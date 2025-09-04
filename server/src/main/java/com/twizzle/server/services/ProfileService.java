package com.twizzle.server.services;

import com.twizzle.server.exceptions.CustomException;
import com.twizzle.server.models.Messages;
import com.twizzle.server.models.User;
import com.twizzle.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

import static com.twizzle.server.models.Messages.USER_NOT_FOUND_BY_ID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoggingService loggingService;

    public User updateProfile(Long userId, User updatedUser) {
        String sessionId = loggingService.getCurrentSessionId();

        try {
            validateUserId(userId);
            User user = findUserById(userId);

            applyProfileChanges(user, updatedUser);

            return userRepository.save(user);

        } catch (CustomException e) {
            loggingService.logSecurityEvent("PROFILE_UPDATE_FAILED", userId.toString(), sessionId,
                    String.format("Profile update failed: %s", e.getMessage()));
            loggingService.logError("UserService", "updateProfile", "Profile update error", e);
            throw e;
        } catch (Exception e) {
            loggingService.logSecurityEvent("PROFILE_UPDATE_ERROR", userId.toString(), sessionId,
                    String.format("System error during profile update: %s", e.getMessage()));
            loggingService.logError("UserService", "updateProfile", "Unexpected error during profile update", e);
            throw new CustomException(500, "Failed to update profile");
        }
    }

    public void updatePassword(Long userId, String oldPassword, String newPassword) {
        validateUserId(userId);
        User user = findUserById(userId);

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new CustomException(400, String.format(Messages.INVALID_CREDENTIALS));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void softDeleteUser(Long userId) {
        toggleUserFlag(userId, true, false, null);
    }

    public void deactivateUser(Long userId) {
        toggleUserFlag(userId, false, true, LocalDateTime.now());
    }

    public void activateUser(Long userId) {
        toggleUserFlag(userId, false, false, null);
    }

    public void blockUser(Long blockerId, Long targetId) {
        if (blockerId.equals(targetId)) {
            throw new CustomException(400, String.format(Messages.BLOCK_NOT_ALLOWED));
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new CustomException(404, String.format(Messages.USER_NOT_FOUND, blockerId)));

        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new CustomException(404, String.format(Messages.USER_NOT_FOUND, targetId)));

        if (blocker.getBlockedUsers() == null) {
            blocker.setBlockedUsers(new ArrayList<>());
        }

        if (!blocker.getBlockedUsers().contains(targetId)) {
            blocker.getBlockedUsers().add(targetId);
        }

        if (blocker.getFollowing() != null) {
            blocker.getFollowing().remove(targetId);
        }

        if (blocker.getFollowers() != null) {
            blocker.getFollowers().remove(targetId);
        }

        if (target.getFollowing() != null) {
            target.getFollowing().remove(blockerId);
        }

        if (target.getFollowers() != null) {
            target.getFollowers().remove(blockerId);
        }

        userRepository.save(blocker);
        userRepository.save(target);
    }

    public void unblockUser(Long blockerId, Long targetId) {
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new CustomException(404, String.format(Messages.USER_NOT_FOUND, blockerId)));

        if (blocker.getBlockedUsers() != null && blocker.getBlockedUsers().contains(targetId)) {
            blocker.getBlockedUsers().remove(targetId);
            userRepository.save(blocker);
        }
    }

    public boolean isBlocked(Long blockerId, Long targetId) {
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new CustomException(404, String.format(Messages.USER_NOT_FOUND, blockerId)));
        return blocker.getBlockedUsers() != null && blocker.getBlockedUsers().contains(targetId);
    }

    public User makePublic(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND_BY_ID, userId)));

        user.setPrivate(false);
        return userRepository.save(user);
    }

    public User makePrivate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND_BY_ID, userId)));

        user.setPrivate(true);
        return userRepository.save(user);
    }

    private void applyProfileChanges(User user, User updatedUser) {
        Optional.ofNullable(updatedUser.getFullName()).ifPresent(user::setFullName);
        Optional.ofNullable(updatedUser.getBio()).ifPresent(user::setBio);
        Optional.ofNullable(updatedUser.getRole()).ifPresent(user::setRole);
        Optional.ofNullable(updatedUser.getTitle()).ifPresent(user::setTitle);
        Optional.ofNullable(updatedUser.getEmail()).ifPresent(user::setEmail);
        Optional.ofNullable(updatedUser.getProfileColorHex()).ifPresent(user::setProfileColorHex);
        Optional.ofNullable(updatedUser.getAbout()).ifPresent(user::setAbout);
        if (updatedUser.getLinks() != null) {
            List<String> newLinks = updatedUser.getLinks();
            List<String> mergedLinks = new ArrayList<>(newLinks);

            Set<String> uniqueLinks = new LinkedHashSet<>(mergedLinks);

            user.setLinks(new ArrayList<>(uniqueLinks));
        }
        user.setTwoFa(updatedUser.isTwoFa());
    }

    private void toggleUserFlag(Long userId, boolean deleted, boolean deactivated, LocalDateTime deactivationTime) {
        validateUserId(userId);
        User user = findUserById(userId);

        user.setDeleted(deleted);
        user.setDeactivated(deactivated);
        user.setDeactivationTime(deactivationTime);

        userRepository.save(user);
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(404, String.format(Messages.USER_NOT_FOUND_BY_ID, userId)));
    }

    private void validateUserId(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException(Messages.USER_ID_ERROR);
        }
    }

    public User addProfileImage(Long userId, MultipartFile file) {
        String sessionId = loggingService.getCurrentSessionId();

        try {
            validateUserId(userId);
            User user = findUserById(userId);

            if (file.isEmpty()) {
                throw new CustomException(400, "Profile image file cannot be empty");
            }

            String contentType = file.getContentType();
            if (!isValidImageType(contentType)) {
                throw new CustomException(400, "Invalid image format. Only JPEG, PNG, and GIF are allowed");
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                throw new CustomException(400, "Image size cannot exceed 5MB");
            }

            user.setProfileImageData(file.getBytes());
            user.setProfileImageFilename(file.getOriginalFilename());
            user.setProfileImageContentType(contentType);

            loggingService.logSecurityEvent("PROFILE_IMAGE_ADDED", userId.toString(), sessionId,
                    String.format("Profile image added for user: %s", userId));

            return userRepository.save(user);

        } catch (IOException e) {
            loggingService.logSecurityEvent("PROFILE_IMAGE_UPLOAD_ERROR", userId.toString(), sessionId,
                    String.format("Failed to upload profile image: %s", e.getMessage()));
            loggingService.logError("ProfileService", "addProfileImage", "Failed to read image file", e);
            throw new CustomException(500, "Failed to process image file");
        } catch (CustomException e) {
            loggingService.logSecurityEvent("PROFILE_IMAGE_UPLOAD_FAILED", userId.toString(), sessionId,
                    String.format("Profile image upload failed: %s", e.getMessage()));
            throw e;
        } catch (Exception e) {
            loggingService.logSecurityEvent("PROFILE_IMAGE_UPLOAD_ERROR", userId.toString(), sessionId,
                    String.format("System error during profile image upload: %s", e.getMessage()));
            loggingService.logError("ProfileService", "addProfileImage", "Unexpected error during profile image upload",
                    e);
            throw new CustomException(500, "Failed to upload profile image");
        }
    }

    public void removeProfileImage(Long userId) {
        String sessionId = loggingService.getCurrentSessionId();

        try {
            validateUserId(userId);
            User user = findUserById(userId);

            user.setProfileImageData(null);
            user.setProfileImageFilename(null);
            user.setProfileImageContentType(null);

            userRepository.save(user);

            loggingService.logSecurityEvent("PROFILE_IMAGE_REMOVED", userId.toString(), sessionId,
                    String.format("Profile image removed for user: %s", userId));

        } catch (CustomException e) {
            loggingService.logSecurityEvent("PROFILE_IMAGE_REMOVAL_FAILED", userId.toString(), sessionId,
                    String.format("Profile image removal failed: %s", e.getMessage()));
            throw e;
        } catch (Exception e) {
            loggingService.logSecurityEvent("PROFILE_IMAGE_REMOVAL_ERROR", userId.toString(), sessionId,
                    String.format("System error during profile image removal: %s", e.getMessage()));
            loggingService.logError("ProfileService", "removeProfileImage",
                    "Unexpected error during profile image removal", e);
            throw new CustomException(500, "Failed to remove profile image");
        }
    }

    public byte[] getProfileImage(Long userId) {
        try {
            validateUserId(userId);
            User user = findUserById(userId);

            return user.getProfileImageData();

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            loggingService.logError("ProfileService", "getProfileImage",
                    "Unexpected error during profile image retrieval", e);
            throw new CustomException(500, "Failed to retrieve profile image");
        }
    }

    public String getProfileImageContentType(Long userId) {
        try {
            validateUserId(userId);
            User user = findUserById(userId);

            return user.getProfileImageContentType();

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            loggingService.logError("ProfileService", "getProfileImageContentType",
                    "Unexpected error during profile image content type retrieval", e);
            throw new CustomException(500, "Failed to retrieve profile image content type");
        }
    }

    public boolean hasProfileImage(Long userId) {
        try {
            validateUserId(userId);
            User user = findUserById(userId);

            return user.getProfileImageData() != null && user.getProfileImageData().length > 0;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            loggingService.logError("ProfileService", "hasProfileImage", "Unexpected error during profile image check",
                    e);
            throw new CustomException(500, "Failed to check profile image status");
        }
    }

    private boolean isValidImageType(String contentType) {
        return contentType != null && (contentType.equals("image/jpeg") || contentType.equals("image/jpg")
                || contentType.equals("image/png") || contentType.equals("image/gif"));
    }
}
