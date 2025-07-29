package com.axiom.server.controllers;

import com.axiom.server.services.OracleHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    private final OracleHealthIndicator oracleHealthIndicator;

    public HealthController(OracleHealthIndicator oracleHealthIndicator) {
        this.oracleHealthIndicator = oracleHealthIndicator;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        boolean isHealthy = true;

        Map<String, Object> server = new HashMap<>();
        server.put("status", "UP");
        server.put("timestamp", Instant.now());
        server.put("jvm", getJvmHealth());
        health.put("server", server);

        Health dbHealth = oracleHealthIndicator.health();
        Map<String, Object> database = new HashMap<>();
        database.put("status", dbHealth.getStatus().getCode());
        database.put("type", "Oracle");
        database.putAll(dbHealth.getDetails());
        health.put("database", database);

        if (!dbHealth.getStatus().equals(Status.UP)) {
            isHealthy = false;
        }

        health.put("status", isHealthy ? "UP" : "DOWN");

        return ResponseEntity.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(health);
    }

    private Map<String, Object> getJvmHealth() {
        Map<String, Object> jvm = new HashMap<>();
        Runtime runtime = Runtime.getRuntime();

        jvm.put("maxMemory", runtime.maxMemory());
        jvm.put("totalMemory", runtime.totalMemory());
        jvm.put("freeMemory", runtime.freeMemory());
        jvm.put("usedMemory", runtime.totalMemory() - runtime.freeMemory());
        jvm.put("availableProcessors", runtime.availableProcessors());

        return jvm;
    }
}
