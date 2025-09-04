package com.twizzle.server.services;

import com.twizzle.server.exceptions.CustomException;
import com.twizzle.server.models.*;
import com.twizzle.server.repositories.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static com.twizzle.server.models.Messages.*;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ExperienceRepository experienceRepository;
    private final EducationRepository educationRepository;
    private final SkillRepository skillRepository;
    private final CertificateRepository certificateRepository;
    private final CacheManager cacheManager;

    public UserService(UserRepository userRepository, ExperienceRepository experienceRepository,
            EducationRepository educationRepository, SkillRepository skillRepository,
            CertificateRepository certificateRepository, CacheManager cacheManager) {
        this.userRepository = userRepository;
        this.experienceRepository = experienceRepository;
        this.educationRepository = educationRepository;
        this.skillRepository = skillRepository;
        this.certificateRepository = certificateRepository;
        this.cacheManager = cacheManager;
    }

    @Transactional(readOnly = true)
    public User getUserInfo(String username) {
        var userCache = cacheManager.<String, User>getCache("users-by-username");
        User cachedUser = userCache.getIfPresent(username);
        if (cachedUser != null) {
            return cachedUser;
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND_BY_USERNAME, username)));

        userCache.put(username, user);
        return user;
    }

    public String getUsernameById(Long userId) {
        var usernameCache = cacheManager.<Long, String>getCache("usernames-by-id");
        String cachedUsername = usernameCache.getIfPresent(userId);
        if (cachedUsername != null) {
            return cachedUsername;
        }

        String username = userRepository.findUsernameById(userId)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND_BY_ID, userId)));

        usernameCache.put(userId, username);
        return username;
    }

    @Transactional(readOnly = true)
    public User getUserById(Long userId) {
        var userCache = cacheManager.<Long, User>getCache("users-by-id");
        User cachedUser = userCache.getIfPresent(userId);
        if (cachedUser != null) {
            return cachedUser;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND_BY_ID, userId)));

        userCache.put(userId, user);
        return user;
    }

    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Integer page, Integer size) {
        int defaultPage = page != null ? page : 0;
        int defaultSize = size != null ? size : 5;
        Pageable pageable = PageRequest.of(defaultPage, defaultSize);
        return userRepository.findAll(pageable);
    }

    public List<UserLiteDTO> getFollowers(Long userId) {
        return getUserConnections(userId, "followers", userRepository::findFollowersById);
    }

    public List<UserLiteDTO> getFollowing(Long userId) {
        return getUserConnections(userId, "following", userRepository::findFollowingById);
    }

    private List<UserLiteDTO> getUserConnections(Long userId, String connectionType,
            java.util.function.Function<Long, java.util.Optional<List<String>>> repositoryMethod) {
        var cache = cacheManager.<String, List<UserLiteDTO>>getCache("user-connections", 30, 300);
        String cacheKey = connectionType + "_" + userId;
        List<UserLiteDTO> cachedResult = cache.getIfPresent(cacheKey);
        if (cachedResult != null) {
            return cachedResult;
        }

        if (!userRepository.existsById(userId)) {
            throw new CustomException(404, String.format(USER_NOT_FOUND, userId));
        }

        List<String> connectionIds = repositoryMethod.apply(userId)
                .orElseThrow(() -> new CustomException(404, String.format(USER_NOT_FOUND, userId)));

        if (connectionIds == null || connectionIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> connectionLongIds = connectionIds.stream().map(Long::parseLong).collect(Collectors.toList());
        List<UserLiteDTO> connections = userRepository.findUserLiteByIdIn(connectionLongIds);

        cache.put(cacheKey, connections);
        return connections;
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
