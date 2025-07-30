package com.axiom.server.services;

import com.axiom.server.exceptions.CustomException;
import com.axiom.server.models.User;
import com.axiom.server.repositories.UserRepository;
import com.axiom.server.utils.JwtTokenUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static com.axiom.server.models.Messages.INVALID_CREDENTIALS;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoginService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;
    private final LoggingService loggingService;

    public String login(String username, String password, String ipAddress) {
        Map<String, String> tokens = performLogin(username, password, ipAddress, false);
        return tokens.get("accessToken");
    }

    public Map<String, String> loginWithRefreshToken(String username, String password, String ipAddress) {
        return performLogin(username, password, ipAddress, true);
    }

    private Map<String, String> performLogin(String username, String password, String ipAddress,
            boolean includeRefreshToken) {
        String sessionId = loggingService.getCurrentSessionId();
        long totalStart = System.currentTimeMillis();

        try {
            User user = findAndValidateUser(username);
            verifyPassword(password, user);

            String commonSessionId = jwtTokenUtil.generateSecureSessionId();
            String accessToken = jwtTokenUtil.generateAccessToken(user.getUsername(), user.getId(), user.isTwoFa(),
                    commonSessionId);

            runPostLoginAsync(user, ipAddress, username, sessionId);

            if (includeRefreshToken) {
                String refreshToken = jwtTokenUtil.generateRefreshToken(user.getUsername(), user.getId(),
                        commonSessionId);
                return Map.of("accessToken", accessToken, "refreshToken", refreshToken);
            } else {
                return Map.of("accessToken", accessToken);
            }

        } catch (CustomException e) {
            long totalDuration = System.currentTimeMillis() - totalStart;

            loggingService.logSecurityEvent("LOGIN_FAILED", username, sessionId,
                    String.format("Login failed for %s from IP %s: %s (time: %dms)", username, ipAddress,
                            e.getMessage(), totalDuration));
            throw e;

        } catch (Exception e) {
            long totalDuration = System.currentTimeMillis() - totalStart;

            loggingService.logSecurityEvent("LOGIN_ERROR", username, sessionId, String.format(
                    "System error during login for %s from IP %s (time: %dms)", username, ipAddress, totalDuration));

            loggingService.logError("LoginService", "login",
                    String.format("Unexpected error during login for %s from IP %s", username, ipAddress), e);

            throw new CustomException(500, "Login system error");
        }
    }

    private User findAndValidateUser(String username) {
        return userRepository.findByUsername(username).filter(user -> !user.isDeleted())
                .orElseThrow(() -> new CustomException(401, INVALID_CREDENTIALS));
    }

    private void verifyPassword(String rawPassword, User user) {
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new CustomException(401, INVALID_CREDENTIALS);
        }
    }

    private void runPostLoginAsync(User user, String ipAddress, String username, String sessionId) {
        CompletableFuture.runAsync(() -> {
            try {

                if (ipChanged(user.getLastLoginIp(), ipAddress)) {
                    loggingService.logSecurityEvent("LOGIN_IP_CHANGED", username, sessionId,
                            String.format("User %s logged in from new IP %s (previous: %s)", username, ipAddress,
                                    user.getLastLoginIp()));
                }

                updateLoginMetadata(user, ipAddress);
                userRepository.save(user);

            } catch (Exception e) {
                loggingService.logSecurityEvent("POST_LOGIN_ERROR", username, sessionId,
                        String.format("Post-login tasks failed for %s: %s", username, e.getMessage()));

                loggingService.logError("LoginService", "runPostLoginAsync", "Post-login error for user: " + username,
                        e);
            }
        });
    }

    private boolean ipChanged(String lastIp, String currentIp) {
        return lastIp == null || !lastIp.equals(currentIp);
    }

    private void updateLoginMetadata(User user, String ipAddress) {
        LocalDateTime now = LocalDateTime.now();
        if (user.getFirstTimeLoggedIn() == null) {
            user.setFirstTimeLoggedIn(now);
            user.setLoginStreak(1);
        }
        user.setLastLoginIp(ipAddress);
        user.setLastLoginTime(now);
    }
}
