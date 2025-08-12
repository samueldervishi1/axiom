package com.axiom.server.controllers;

import com.axiom.server.models.*;
import com.axiom.server.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/lookup/{username}")
    public ResponseEntity<User> getUserInfo(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserInfo(username));
    }

    @GetMapping("/{userId}/username")
    public ResponseEntity<String> getUsername(@PathVariable Long userId) {
        String username = userService.getUsernameById(userId);
        return ResponseEntity.ok(username);
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<List<UserLiteDTO>> getFollowers(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getFollowers(userId));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<List<UserLiteDTO>> getFollowing(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getFollowing(userId));
    }

    @PostMapping("/{userId}/experience")
    public ResponseEntity<Experience> addExperience(@PathVariable Long userId, @RequestBody Experience experience) {
        experience.setUserId(userId);
        return ResponseEntity.ok(userService.addExperience(experience));
    }

    @PostMapping("/{userId}/education")
    public ResponseEntity<Education> addEducation(@PathVariable Long userId, @RequestBody Education education) {
        education.setUserId(userId);
        return ResponseEntity.ok(userService.addEducation(education));
    }

    @PostMapping("/{userId}/skill")
    public ResponseEntity<Skill> addSkill(@PathVariable Long userId, @RequestBody Skill skill) {
        skill.setUserId(userId);
        return ResponseEntity.ok(userService.addSkill(skill));
    }

    @PostMapping("/{userId}/certificate")
    public ResponseEntity<Certificate> addCertificate(@PathVariable Long userId, @RequestBody Certificate certificate) {
        certificate.setUserId(userId);
        return ResponseEntity.ok(userService.addCertificate(certificate));
    }
}
