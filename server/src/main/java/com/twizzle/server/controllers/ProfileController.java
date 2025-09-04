package com.twizzle.server.controllers;

import com.twizzle.server.models.PasswordUpdateRequest;
import com.twizzle.server.models.User;
import com.twizzle.server.services.ProfileService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/is-blocked")
    public ResponseEntity<?> isBlocked(@RequestParam Long blockerId, @RequestParam Long targetId) {
        boolean isBlocked = profileService.isBlocked(blockerId, targetId);
        return ResponseEntity.ok(Map.of("isBlocked", isBlocked));
    }

    @PostMapping("/change/account/public")
    public ResponseEntity<?> changeAccountPublic(@RequestParam Long userId) {
        User user = profileService.makePublic(userId);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/change/account/private")
    public ResponseEntity<?> changeAccountPrivate(@RequestParam Long userId) {
        User user = profileService.makePrivate(userId);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/block")
    public ResponseEntity<?> blockUser(@RequestBody Map<String, Long> body) {
        Long blockerId = body.get("blockerId");
        Long targetId = body.get("targetId");
        profileService.blockUser(blockerId, targetId);
        return ResponseEntity.ok("User blocked successfully");
    }

    @PostMapping("/unblock")
    public ResponseEntity<?> unblockUser(@RequestBody Map<String, Long> body) {
        Long blockerId = body.get("blockerId");
        Long targetId = body.get("targetId");
        profileService.unblockUser(blockerId, targetId);
        return ResponseEntity.ok("User unblocked successfully");
    }

    @PutMapping("/{userId}/update")
    public ResponseEntity<User> updateUser(@PathVariable Long userId, @RequestBody User updatedUser) {
        User updated = profileService.updateProfile(userId, updatedUser);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{userId}/update/password")
    public ResponseEntity<String> updatePassword(@PathVariable Long userId,
            @RequestBody PasswordUpdateRequest request) {
        profileService.updatePassword(userId, request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok("Password updated successfully");
    }

    @PutMapping("/{userId}/deactivate")
    public ResponseEntity<String> deactivateUser(@PathVariable Long userId) {
        profileService.deactivateUser(userId);
        return ResponseEntity.ok("User deactivated successfully");
    }

    @PutMapping("/{userId}/reactivate")
    public ResponseEntity<String> reactivateUser(@PathVariable Long userId) {
        profileService.activateUser(userId);
        return ResponseEntity.ok("User reactivated successfully");
    }

    @DeleteMapping("/{userId}/delete")
    public ResponseEntity<String> deleteUser(@PathVariable Long userId) {
        profileService.softDeleteUser(userId);
        return ResponseEntity.ok("User deleted successfully");
    }

    @PostMapping("/{userId}/image")
    public ResponseEntity<User> addProfileImage(@PathVariable Long userId, @RequestParam("file") MultipartFile file) {
        User updatedUser = profileService.addProfileImage(userId, file);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{userId}/image")
    public ResponseEntity<String> removeProfileImage(@PathVariable Long userId) {
        profileService.removeProfileImage(userId);
        return ResponseEntity.ok("Profile image removed successfully");
    }

    @GetMapping("/{userId}/image")
    public ResponseEntity<byte[]> getProfileImage(@PathVariable Long userId) {
        byte[] imageData = profileService.getProfileImage(userId);
        String contentType = profileService.getProfileImageContentType(userId);

        if (imageData == null || imageData.length == 0) {
            return ResponseEntity.notFound().build();
        }

        HttpHeaders headers = new HttpHeaders();
        if (contentType != null) {
            headers.setContentType(MediaType.parseMediaType(contentType));
        } else {
            headers.setContentType(MediaType.IMAGE_JPEG);
        }

        return ResponseEntity.ok().headers(headers).body(imageData);
    }

    @GetMapping("/{userId}/image/exists")
    public ResponseEntity<Map<String, Boolean>> hasProfileImage(@PathVariable Long userId) {
        boolean hasImage = profileService.hasProfileImage(userId);
        return ResponseEntity.ok(Map.of("hasProfileImage", hasImage));
    }
}
