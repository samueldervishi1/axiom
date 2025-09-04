package com.twizzle.server.services;

import com.twizzle.server.models.User;
import com.twizzle.server.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Service
public class QRCode {

    private final UserRepository userRepository;

    public QRCode(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String generateProfileQRCode(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();
        String profileUrl = frontendBaseUrl + "/profile/" + user.getUsername();
        String encodedUrl = URLEncoder.encode(profileUrl, StandardCharsets.UTF_8);

        return qrApiBaseUrl + "?size=" + qrDefaultSize + "&data=" + encodedUrl;
    }

    @Value("${qr.api.base-url}")
    private String qrApiBaseUrl;

    @Value("${qr.default.size}")
    private String qrDefaultSize;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;
}
