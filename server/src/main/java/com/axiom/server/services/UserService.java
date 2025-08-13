package com.axiom.server.services;

import com.axiom.server.exceptions.CustomException;
import com.axiom.server.models.*;
import com.axiom.server.repositories.*;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static com.axiom.server.models.Messages.*;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ExperienceRepository experienceRepository;
    private final EducationRepository educationRepository;
    private final SkillRepository skillRepository;
    private final CertificateRepository certificateRepository;

    public UserService(UserRepository userRepository, ExperienceRepository experienceRepository,
            EducationRepository educationRepository, SkillRepository skillRepository,
            CertificateRepository certificateRepository) {
        this.userRepository = userRepository;
        this.experienceRepository = experienceRepository;
        this.educationRepository = educationRepository;
        this.skillRepository = skillRepository;
        this.certificateRepository = certificateRepository;
    }

    public User getUserInfo(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND_BY_USERNAME, username)));
    }

    public String getUsernameById(Long userId) {
        return userRepository.findUsernameById(userId)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND_BY_ID, userId)));
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
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

    public Experience addExperience(Experience experience) {
        return experienceRepository.save(experience);
    }

    public Education addEducation(Education education) {
        return educationRepository.save(education);
    }

    public Skill addSkill(Skill skill) {
        return skillRepository.save(skill);
    }

    public Certificate addCertificate(Certificate certificate) {
        return certificateRepository.save(certificate);
    }
}
