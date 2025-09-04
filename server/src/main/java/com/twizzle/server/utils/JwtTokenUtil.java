package com.twizzle.server.utils;

import com.twizzle.server.services.LoggingService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
public class JwtTokenUtil {

    private final LoggingService loggingService;
    private final SecureRandom secureRandom = new SecureRandom();

    public JwtTokenUtil(LoggingService loggingService) {
        this.loggingService = loggingService;
    }

    @PostConstruct
    public void init() {
        try {
            if (secretKeyString != null && !secretKeyString.isEmpty()) {
                try {
                    byte[] decodedSecret = Base64.getUrlDecoder().decode(secretKeyString);

                    if (decodedSecret.length < 64) {
                        throw new IllegalArgumentException("JWT secret must be at least 64 bytes for HS512. Current: "
                                + decodedSecret.length + " bytes");
                    }

                    this.secretKey = Keys.hmacShaKeyFor(decodedSecret);

                } catch (IllegalArgumentException e) {
                    byte[] keyBytes = secretKeyString.getBytes(StandardCharsets.UTF_8);
                    if (keyBytes.length < 64) {
                        keyBytes = extendKeyTo64Bytes(keyBytes);
                    }
                    this.secretKey = Keys.hmacShaKeyFor(keyBytes);
                }
            } else {
                this.secretKey = Jwts.SIG.HS512.key().build();
                loggingService.logWarn("JwtTokenUtil", "init",
                        "No JWT secret provided - generated random key (will invalidate on restart)");
            }

            this.accessTokenExpirationMillis = accessTokenExpiration != null ? accessTokenExpiration : 900000L;
            this.refreshTokenExpirationMillis = refreshTokenExpiration != null ? refreshTokenExpiration : 604800000L;

            warmUpJWT();

            loggingService.logInfo("JwtTokenUtil", "init",
                    "JWT initialized with HS512, access token: " + (accessTokenExpirationMillis / 1000 / 60) + "min, "
                            + "refresh token: " + (this.refreshTokenExpirationMillis / 1000 / 60 / 60 / 24) + " days");

        } catch (Exception e) {
            loggingService.logError("JwtTokenUtil", "init", "Failed to initialize JWT utility", e);
            throw new RuntimeException("JWT initialization failed", e);
        }
    }

    private void warmUpJWT() {
        try {
            loggingService.logInfo("JwtTokenUtil", "warmUpJWT", "Starting JWT warmup process");

            Instant now = Instant.now();
            String sessionId = generateSecureSessionId();

            String warmupAccessToken = Jwts.builder().subject("warmup-user").issuer(ISSUER).audience()
                    .add("twizzle-client").and().claim(CLAIM_USER_ID, 999L).claim(CLAIM_TWO_FACTOR, false)
                    .claim(CLAIM_TOKEN_TYPE, "access").claim(CLAIM_SESSION_ID, sessionId)
                    .id(UUID.randomUUID().toString()).issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(1)))
                    .signWith(secretKey).compact();

            String warmupRefreshToken = Jwts.builder().subject("warmup-user").issuer(ISSUER).audience()
                    .add("twizzle-client").and().claim(CLAIM_USER_ID, 999L).claim(CLAIM_TOKEN_TYPE, "refresh")
                    .claim(CLAIM_SESSION_ID, sessionId).id(UUID.randomUUID().toString()).issuedAt(Date.from(now))
                    .expiration(Date.from(now.plusSeconds(1))).signWith(secretKey).compact();

            parseAndValidateToken(warmupAccessToken);
            parseAndValidateToken(warmupRefreshToken);

            loggingService.logInfo("JwtTokenUtil", "warmUpJWT", "JWT warmup completed successfully");

        } catch (Exception e) {
            loggingService.logError("JwtTokenUtil", "warmUpJWT", "JWT warmup failed", e);
            throw new RuntimeException("JWT warmup failed", e);
        }
    }

    public String generateAccessToken(String username, Long userId, boolean twoFa, String sessionId) {
        Instant now = Instant.now();

        return Jwts.builder().subject(username).issuer(ISSUER).audience().add("twizzle-client").and()
                .claim(CLAIM_USER_ID, userId).claim(CLAIM_TWO_FACTOR, twoFa).claim(CLAIM_TOKEN_TYPE, "access")
                .claim(CLAIM_SESSION_ID, sessionId).id(UUID.randomUUID().toString()).issuedAt(Date.from(now))
                .notBefore(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenExpirationMillis, ChronoUnit.MILLIS))).signWith(secretKey)
                .compact();
    }

    public String generateSecureSessionId() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    public Claims parseAndValidateToken(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(secretKey).requireIssuer(ISSUER).requireAudience("twizzle-client")
                    .clockSkewSeconds(10).build().parseSignedClaims(token).getPayload();

            validateTokenClaims(claims);

            return claims;

        } catch (JwtException e) {
            loggingService.logWarn("JwtTokenUtil", "parseAndValidateToken",
                    "Token validation failed: " + e.getMessage());
            throw e;
        }
    }

    public String generateAccessToken(String username, Long userId, boolean twoFa) {
        String sessionId = generateSecureSessionId();
        return generateAccessToken(username, userId, twoFa, sessionId);
    }

    public String generateRefreshToken(String username, Long userId, String sessionId) {
        Instant now = Instant.now();

        return Jwts.builder().subject(username).issuer(ISSUER).audience().add("twizzle-client").and()
                .claim(CLAIM_USER_ID, userId).claim(CLAIM_TOKEN_TYPE, "refresh").claim(CLAIM_SESSION_ID, sessionId)
                .id(UUID.randomUUID().toString()).issuedAt(Date.from(now)).notBefore(Date.from(now))
                .expiration(Date.from(now.plus(refreshTokenExpirationMillis, ChronoUnit.MILLIS))).signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken(String username, Long userId) {
        String sessionId = generateSecureSessionId();
        return generateRefreshToken(username, userId, sessionId);
    }

    public boolean isRefreshToken(Claims claims) {
        String tokenType = claims.get(CLAIM_TOKEN_TYPE, String.class);
        return !"refresh".equals(tokenType);
    }

    public boolean isAccessToken(Claims claims) {
        String tokenType = claims.get(CLAIM_TOKEN_TYPE, String.class);
        return "access".equals(tokenType);
    }

    private void validateTokenClaims(Claims claims) {
        if (claims.get(CLAIM_USER_ID) == null) {
            throw new JwtException("Token missing required userId claim");
        }

        if (claims.get(CLAIM_TOKEN_TYPE) == null) {
            throw new JwtException("Token missing required tokenType claim");
        }

        if (claims.getId() == null) {
            throw new JwtException("Token missing required jti (JWT ID) claim");
        }

        String tokenType = claims.get(CLAIM_TOKEN_TYPE, String.class);
        if (!"access".equals(tokenType) && !"refresh".equals(tokenType)) {
            throw new JwtException("Invalid token type: " + tokenType);
        }
    }

    private byte[] extendKeyTo64Bytes(byte[] originalKey) {
        try {
            javax.crypto.spec.PBEKeySpec spec = new javax.crypto.spec.PBEKeySpec(
                    new String(originalKey, StandardCharsets.UTF_8).toCharArray(),
                    "jwt-salt".getBytes(StandardCharsets.UTF_8), 10000, 512);

            javax.crypto.SecretKeyFactory factory = javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            return factory.generateSecret(spec).getEncoded();

        } catch (Exception e) {
            byte[] extended = new byte[64];
            for (int i = 0; i < 64; i++) {
                extended[i] = originalKey[i % originalKey.length];
            }
            return extended;
        }
    }

    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_TWO_FACTOR = "twoFactor";
    private static final String CLAIM_TOKEN_TYPE = "tokenType";
    private static final String CLAIM_SESSION_ID = "sessionId";
    private static final String ISSUER = "twizzle-server";

    @Getter
    private SecretKey secretKey;
    private long accessTokenExpirationMillis;
    private long refreshTokenExpirationMillis;

    @Value("${jwt.secret}")
    private String secretKeyString;

    @Value("${jwt.access.expiration:900000}")
    private Long accessTokenExpiration;

    @Value("${jwt.refresh.expiration:604800000}")
    private Long refreshTokenExpiration;
}
