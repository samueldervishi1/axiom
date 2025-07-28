package com.chattr.server.services;

import com.chattr.server.exceptions.CustomException;
import com.chattr.server.models.User;
import com.chattr.server.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

import static com.chattr.server.models.Messages.*;

/** Service responsible for validating and registering new users. */
@Service
public class RegisterService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoggingService loggingService;

    public RegisterService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            LoggingService loggingService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.loggingService = loggingService;
    }

    public void createAccount(User user) {
        String sessionId = loggingService.getCurrentSessionId();
        validateAccount(user);

        String encodedPassword = passwordEncoder.encode(user.getPassword());

        user.setPassword(encodedPassword);
        user.setRole(user.getRole() != null ? user.getRole() : DEFAULT_ROLE);
        user.setAccountCreationDate(LocalDateTime.now());

        loggingService.logSecurityEvent("REGISTER_ACCOUNT", user.getUsername(), sessionId,
                String.format("User %s created his account with role %s", null, ""));

        userRepository.save(user);
    }

    private void validateAccount(User user) {
        if (user == null)
            throw new CustomException(400, String.format(USER_SHOULD_NOT_BE_NULL));
        validateEmail(user.getEmail());
        validateFullName(user.getFullName());
        validatePassword(user.getPassword());
        checkDuplicates(user);
    }

    private void validateEmail(String email) {
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new CustomException(400, INVALID_EMAIL_FORMAT);
        }
    }

    private void validateFullName(String fullName) {
        if (!StringUtils.hasText(fullName) || fullName.length() < 2) {
            throw new CustomException(400, NAME_TOO_SHORT);
        }
    }

    private void validatePassword(String password) {
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new CustomException(400, INVALID_PASSWORD_FORMAT);
        }
    }

    private void checkDuplicates(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new CustomException(400, EMAIL_ALREADY_EXISTS);
        }
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new CustomException(400, USERNAME_ALREADY_EXISTS);
        }
    }
}
