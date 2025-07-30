package com.axiom.server.controllers;

import com.axiom.server.models.PasswordUpdateRequest;
import com.axiom.server.models.User;
import com.axiom.server.services.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
