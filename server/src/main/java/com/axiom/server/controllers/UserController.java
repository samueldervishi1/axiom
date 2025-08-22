package com.axiom.server.controllers;

import com.axiom.server.models.*;
import com.axiom.server.services.PdfService;
import com.axiom.server.services.UserService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final PdfService pdfService;

    public UserController(UserService userService, PdfService pdfService) {
        this.userService = userService;
        this.pdfService = pdfService;
    }

    @GetMapping
    public ResponseEntity<Page<User>> getAllUsers(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        Page<User> users = userService.getAllUsers(page, size);
        return ResponseEntity.ok(users);
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

    @GetMapping("/{userId}/download-pdf")
    public ResponseEntity<byte[]> downloadUserProfilePdf(@PathVariable Long userId) throws IOException {
        User user = userService.getUserById(userId);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] pdfBytes = pdfService.generateUserProfilePdf(user);

        String filename = "profile_" + user.getUsername() + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentLength(pdfBytes.length);
        headers.setCacheControl("no-cache, no-store, must-revalidate");
        headers.setPragma("no-cache");
        headers.setExpires(0);

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }
}
