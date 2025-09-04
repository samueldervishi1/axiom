package com.twizzle.server.controllers;

import com.twizzle.server.exceptions.CustomException;
import com.twizzle.server.models.Error;
import com.twizzle.server.models.User;
import com.twizzle.server.models.UserInfo;
import com.twizzle.server.services.LoggingService;
import com.twizzle.server.services.LoginService;
import com.twizzle.server.services.RegisterService;
import com.twizzle.server.utils.JwtTokenUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

import static com.twizzle.server.models.Messages.INVALID_CHANNEL_ID;
import static com.twizzle.server.models.Messages.REGISTER_SUCCESS;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final LoginService loginService;
    private final RegisterService registerService;
    private final JwtTokenUtil jwtTokenUtil;
    private final LoggingService loggingService;

    public AuthController(LoginService loginService, RegisterService registerService, JwtTokenUtil jwtTokenUtil,
            LoggingService loggingService) {
        this.loginService = loginService;
        this.registerService = registerService;
        this.jwtTokenUtil = jwtTokenUtil;
        this.loggingService = loggingService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        String token = Arrays.stream(Optional.ofNullable(request.getCookies()).orElse(new Cookie[0]))
                .filter(c -> "token".equals(c.getName())).map(Cookie::getValue).findFirst().orElse(null);

        if (token == null) {
            return createResponse(new CustomException(401, "Token not found"));
        }

        try {
            Claims claims = jwtTokenUtil.parseAndValidateToken(token);

            UserInfo userInfo = new UserInfo();
            userInfo.setUsername(claims.getSubject());

            long userId = extractUserIdFromClaims(claims);

            userInfo.setUserId(userId);
            userInfo.setStatus("SUCCESS");
            userInfo.setMessage("User info retrieved from token");

            return ResponseEntity.ok(userInfo);
        } catch (Exception e) {
            loggingService.logError("loginController", "getCurrentUser", "Invalid token", e);
            return createResponse(new CustomException(401, e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> loginRequest, HttpServletResponse response,
            HttpServletRequest request) {

        logger.debug("Received login request: {}", loginRequest);
        String username;
        String password;

        try {
            validateSessionAndServer(loginRequest, expectedSessionType, expectedServer);

            Map<String, Object> credentials = safeCastMap(loginRequest.get("credentials"));
            if (credentials == null) {
                throw new CustomException(400, "Missing credentials object");
            }

            username = (String) credentials.get("username");
            password = (String) credentials.get("password");

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Invalid login format: {}", e.getMessage());
            return createResponse(new CustomException(400, "Invalid request format"));
        }

        logger.debug("Extracted username: {}", username);
        logger.debug("Extracted password: {}", password != null ? "[PROTECTED]" : "null");

        if (username == null || username.isBlank()) {
            return createResponse(new CustomException(400, "Username is empty"));
        }
        if (password == null || password.isBlank()) {
            return createResponse(new CustomException(400, "Password is empty"));
        }

        // Input validation and sanitization
        username = username.trim();
        if (username.length() > 50) {
            return createResponse(new CustomException(400, "Username too long"));
        }
        if (password.length() > 128) {
            return createResponse(new CustomException(400, "Password too long"));
        }

        String ipAddress = getIpAddress(request);

        try {
            Map<String, String> tokens = loginService.loginWithRefreshToken(username, password, ipAddress);

            ResponseCookie accessCookie = ResponseCookie.from("token", tokens.get("accessToken")).httpOnly(true)
                    .secure(true).path("/").sameSite("None").maxAge(Duration.ofMinutes(15)).build();

            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", tokens.get("refreshToken"))
                    .httpOnly(true).secure(true).path("/").sameSite("None").maxAge(Duration.ofDays(7)).build();

            response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            return ResponseEntity.ok("Login successful");

        } catch (CustomException e) {
            loggingService.logError("loginController", "login", "Failed to login", e);
            return createResponse(e);
        } catch (Exception e) {
            loggingService.logError("loginController", "login", "Internal Server Error", e);
            return createResponse(new CustomException(500, "Internal server error"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = Arrays.stream(Optional.ofNullable(request.getCookies()).orElse(new Cookie[0]))
                .filter(c -> "refreshToken".equals(c.getName())).map(Cookie::getValue).findFirst().orElse(null);

        if (refreshToken == null) {
            return createResponse(new CustomException(401, "Refresh token not found"));
        }

        try {
            Claims claims = jwtTokenUtil.parseAndValidateToken(refreshToken);

            if (!jwtTokenUtil.isRefreshToken(claims)) {
                return createResponse(new CustomException(401, "Invalid token type"));
            }

            String username = claims.getSubject();
            long userId = extractUserIdFromClaims(claims);

            String sessionId = claims.get("sessionId", String.class);

            String newAccessToken = jwtTokenUtil.generateAccessToken(username, userId, false, sessionId);

            ResponseCookie accessCookie = ResponseCookie.from("token", newAccessToken).httpOnly(true).secure(true)
                    .path("/").sameSite("None").maxAge(Duration.ofMinutes(15)).build();

            response.setHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());

            return ResponseEntity.ok("Token refreshed successfully");

        } catch (Exception e) {
            loggingService.logError("AuthController", "refreshToken", "Failed to refresh token", e);
            return createResponse(new CustomException(401, "Invalid refresh token"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletResponse response) {
        SecurityContextHolder.clearContext();

        ResponseCookie tokenCookie = ResponseCookie.from("token", "").httpOnly(true).secure(true).path("/").maxAge(0)
                .sameSite("None").build();
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", "").httpOnly(true).secure(true).path("/")
                .maxAge(0).sameSite("None").build();

        response.addHeader(HttpHeaders.SET_COOKIE, tokenCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        return ResponseEntity.ok("Logged out");
    }

    @PostMapping("/register")
    public ResponseEntity<Error> register(@RequestBody Map<String, Object> requestBody, HttpServletRequest request) {
        try {
            validateSessionAndServer(requestBody, expectedSessionType, expectedServer);

            Map<String, Object> queries = safeCastMap(requestBody.get("queries"));
            if (queries == null) {
                throw new CustomException(400, "Missing queries object");
            }

            String username = (String) queries.get("username");
            String email = (String) queries.get("email");
            String fullName = (String) queries.get("fullname");
            String password = (String) queries.get("password");
            String channelId = (String) queries.get("channelId");

            if (!expectedChannelId.equals(channelId)) {
                throw new CustomException(400, INVALID_CHANNEL_ID);
            }

            if (username == null || username.isBlank()) {
                throw new CustomException(400, "Username is required");
            }
            if (email == null || email.isBlank()) {
                throw new CustomException(400, "Email is required");
            }
            if (fullName == null || fullName.isBlank()) {
                throw new CustomException(400, "Full name is required");
            }
            if (password == null || password.isBlank()) {
                throw new CustomException(400, "Password is required");
            }

            username = username.trim();
            email = email.trim().toLowerCase();
            fullName = fullName.trim();

            if (username.length() > 50) {
                throw new CustomException(400, "Username too long");
            }
            if (email.length() > 100 || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                throw new CustomException(400, "Invalid email format");
            }
            if (fullName.length() > 100) {
                throw new CustomException(400, "Full name too long");
            }
            if (password.length() < 8 || password.length() > 128) {
                throw new CustomException(400, "Password must be between 8 and 128 characters");
            }

            String ipAddress = getIpAddress(request);

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setFullName(fullName);
            user.setPassword(password);
            user.setIpAddress(ipAddress);
            registerService.createAccount(user);

            return createResponse(new CustomException(200, REGISTER_SUCCESS));

        } catch (CustomException e) {
            loggingService.logError("loginController", "register", "Failed to register", e);
            return createResponse(new CustomException(400, e.getMessage()));
        } catch (Exception e) {
            loggingService.logError("loginController", "register", "Internal Server Error", e);
            return createResponse(new CustomException(500, e.getMessage()));
        }
    }

    private String getIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        return (ip == null || ip.isBlank()) ? request.getRemoteAddr() : ip;
    }

    private Map<String, Object> safeCastMap(Object obj) {
        if (obj instanceof Map<?, ?> map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> casted = (Map<String, Object>) map;
            return casted;
        }
        throw new CustomException(400, "Expected map but got: " + obj);
    }

    private ResponseEntity<Error> createResponse(CustomException e) {
        Error error = switch (e.getCode()) {
            case 200 -> Error.success(e.getMessage());
            case 400 -> Error.badRequest(e.getMessage());
            case 401 -> Error.unauthorized(e.getMessage());
            case 403 -> Error.forbidden(e.getMessage());
            case 404 -> Error.notFound(e.getMessage());
            case 500 -> Error.serverError(e.getMessage());
            default -> Error.custom(String.valueOf(e.getCode()), e.getMessage(), "error");
        };
        return ResponseEntity.status(e.getCode()).body(error);
    }

    private long extractUserIdFromClaims(Claims claims) {
        Object userIdObj = claims.get("userId");
        if (userIdObj instanceof Integer) {
            return ((Integer) userIdObj).longValue();
        } else if (userIdObj instanceof Long) {
            return (Long) userIdObj;
        } else {
            throw new IllegalArgumentException("Invalid userId type: " + userIdObj.getClass());
        }
    }

    private void validateSessionAndServer(Map<String, Object> requestBody, String expectedSessionType,
            String expectedServer) {
        String sessionType = (String) requestBody.get("sessionType");
        String server = (String) requestBody.get("server");

        if (!expectedSessionType.equals(sessionType)) {
            logger.warn("Unexpected session type: {} (expected: {})", sessionType, expectedSessionType);
        }
        if (!expectedServer.equals(server)) {
            logger.warn("Unexpected server: {} (expected: {})", server, expectedServer);
        }
    }

    @Value("${login.expected.session-type}")
    private String expectedSessionType;

    @Value("${login.expected.server}")
    private String expectedServer;

    @Value("${register.expected.channel-id}")
    private String expectedChannelId;
}
