package com.twizzle.server.controllers;

import com.twizzle.server.services.QRCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class QRCodeController {

    private final QRCode QRCode;

    public QRCodeController(QRCode QRCode) {
        this.QRCode = QRCode;
    }

    @GetMapping("/qr-code/{userId}")
    public ResponseEntity<String> generateQRCode(@PathVariable Long userId) {
        try {
            String qrCodeUrl = QRCode.generateProfileQRCode(userId);
            return ResponseEntity.ok(qrCodeUrl);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
