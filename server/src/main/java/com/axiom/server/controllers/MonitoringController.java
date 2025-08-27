package com.axiom.server.controllers;

import com.axiom.server.services.DBService;
import com.axiom.server.services.PerformanceMonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for performance monitoring and system health endpoints
 */
@RestController
@RequestMapping("/monitoring")
@RequiredArgsConstructor
public class MonitoringController {

    private final PerformanceMonitoringService performanceMonitoringService;
    private final DBService dbService;

    /**
     * Get comprehensive performance statistics
     */
    @GetMapping("/performance")
    public ResponseEntity<Map<String, Object>> getPerformanceStats() {
        Map<String, Object> stats = performanceMonitoringService.getPerformanceStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get performance statistics for a specific endpoint
     */
    @GetMapping("/performance/endpoint")
    public ResponseEntity<Map<String, Object>> getEndpointStats(@RequestParam String endpoint) {
        Map<String, Object> stats = performanceMonitoringService.getEndpointStats(endpoint);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get database performance statistics
     */
    @GetMapping("/performance/database")
    public ResponseEntity<Map<String, Object>> getDatabaseStats() {
        Map<String, Object> stats = dbService.getPerformanceStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get system health status
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        Map<String, Object> health = performanceMonitoringService.getHealthStatus();
        return ResponseEntity.ok(health);
    }

    /**
     * Get combined monitoring dashboard data
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("health", performanceMonitoringService.getHealthStatus());
        dashboard.put("performance", performanceMonitoringService.getPerformanceStats());
        dashboard.put("database", dbService.getPerformanceStats());

        return ResponseEntity.ok(dashboard);
    }

    /**
     * Reset performance metrics (useful for testing or maintenance)
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetMetrics() {
        performanceMonitoringService.resetMetrics();

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Performance metrics have been reset");

        return ResponseEntity.ok(response);
    }

    /**
     * Simple health check endpoint
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        response.put("message", "Service is running");

        return ResponseEntity.ok(response);
    }
}
