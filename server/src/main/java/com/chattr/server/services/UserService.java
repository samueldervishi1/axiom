package com.chattr.server.services;

import com.chattr.server.exceptions.CustomException;
import com.chattr.server.models.User;
import com.chattr.server.models.UserLiteDTO;
import com.chattr.server.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static com.chattr.server.models.Messages.*;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUserInfo(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND_BY_USERNAME, username)));
    }

    public String getUsernameById(Long userId) {
        return userRepository.findUsernameById(userId)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND_BY_ID, userId)));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<UserLiteDTO> getFollowers(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new CustomException(404, String.format(USER_NOT_FOUND, userId));
        }

        List<String> followerIds = userRepository.findFollowersById(userId)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND, userId)));

        if (followerIds == null || followerIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> followerLongIds = followerIds.stream().map(Long::parseLong).collect(Collectors.toList());

        return userRepository.findUserLiteByIdIn(followerLongIds);
    }

    public List<UserLiteDTO> getFollowing(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new CustomException(404, String.format(USER_NOT_FOUND, userId));
        }

        List<String> followingIds = userRepository.findFollowingById(userId)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND, userId)));

        if (followingIds == null || followingIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> followingLongIds = followingIds.stream().map(Long::parseLong).collect(Collectors.toList());

        return userRepository.findUserLiteByIdIn(followingLongIds);
    }
}
