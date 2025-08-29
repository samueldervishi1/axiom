package com.axiom.server.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.ThreadMXBean;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
public class PerformanceMonitoringService {

    private final Map<String, AtomicLong> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> totalResponseTimes = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> errorCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> slowestRequests = new ConcurrentHashMap<>();

    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong totalErrors = new AtomicLong(0);
    private final LocalDateTime startupTime = LocalDateTime.now();

    public void recordRequest(String endpoint, long responseTimeMs) {
        requestCounts.computeIfAbsent(endpoint, k -> new AtomicLong(0)).incrementAndGet();
        totalResponseTimes.computeIfAbsent(endpoint, k -> new AtomicLong(0)).addAndGet(responseTimeMs);
        totalRequests.incrementAndGet();

        slowestRequests.merge(endpoint, responseTimeMs, Long::max);

        if (responseTimeMs > 2000) {
            log.warn("Slow request detected: {} took {}ms", endpoint, responseTimeMs);
        }
    }

    public void recordError(String endpoint) {
        errorCounts.computeIfAbsent(endpoint, k -> new AtomicLong(0)).incrementAndGet();
        totalErrors.incrementAndGet();
    }

    public Map<String, Object> getPerformanceStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("uptime", getUptimeInfo());
        stats.put("totalRequests", totalRequests.get());
        stats.put("totalErrors", totalErrors.get());
        stats.put("errorRate", calculateOverallErrorRate());

        stats.put("systemMetrics", getSystemMetrics());

        stats.put("endpointStats", getEndpointStats());

        stats.put("slowestEndpoints", getSlowestEndpoints());

        return stats;
    }

    public Map<String, Object> getEndpointStats(String endpoint) {
        Map<String, Object> stats = new HashMap<>();

        long requests = requestCounts.getOrDefault(endpoint, new AtomicLong(0)).get();
        long totalTime = totalResponseTimes.getOrDefault(endpoint, new AtomicLong(0)).get();
        long errors = errorCounts.getOrDefault(endpoint, new AtomicLong(0)).get();

        stats.put("endpoint", endpoint);
        stats.put("totalRequests", requests);
        stats.put("totalErrors", errors);
        stats.put("errorRate", requests > 0 ? (double) errors / requests * 100 : 0.0);
        stats.put("averageResponseTime", requests > 0 ? totalTime / requests : 0);
        stats.put("slowestRequest", slowestRequests.getOrDefault(endpoint, 0L));

        return stats;
    }

    public void resetMetrics() {
        requestCounts.clear();
        totalResponseTimes.clear();
        errorCounts.clear();
        slowestRequests.clear();
        totalRequests.set(0);
        totalErrors.set(0);

        log.info("Performance metrics have been reset");
    }

    private Map<String, Object> getUptimeInfo() {
        Map<String, Object> uptime = new HashMap<>();
        uptime.put("startupTime", startupTime);
        uptime.put("currentTime", LocalDateTime.now());
        return uptime;
    }

    private Map<String, Object> getSystemMetrics() {
        Map<String, Object> system = new HashMap<>();

        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        system.put("heapMemoryUsed", memoryBean.getHeapMemoryUsage().getUsed() / (1024 * 1024));
        system.put("heapMemoryMax", memoryBean.getHeapMemoryUsage().getMax() / (1024 * 1024));
        system.put("nonHeapMemoryUsed", memoryBean.getNonHeapMemoryUsage().getUsed() / (1024 * 1024));

        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        system.put("activeThreads", threadBean.getThreadCount());
        system.put("peakThreads", threadBean.getPeakThreadCount());

        Runtime runtime = Runtime.getRuntime();
        system.put("availableProcessors", runtime.availableProcessors());
        system.put("totalMemory", runtime.totalMemory() / (1024 * 1024));
        system.put("freeMemory", runtime.freeMemory() / (1024 * 1024));

        return system;
    }

    private Map<String, Object> getEndpointStats() {
        Map<String, Object> endpointStats = new HashMap<>();

        requestCounts.forEach((endpoint, count) -> endpointStats.put(endpoint, getEndpointStats(endpoint)));

        return endpointStats;
    }

    private Map<String, Long> getSlowestEndpoints() {
        return new HashMap<>(slowestRequests);
    }

    private double calculateOverallErrorRate() {
        long total = totalRequests.get();
        return total > 0 ? (double) totalErrors.get() / total * 100 : 0.0;
    }

    public Map<String, Object> getHealthStatus() {
        Map<String, Object> health = new HashMap<>();

        double errorRate = calculateOverallErrorRate();
        boolean isHealthy = errorRate < 5.0;

        health.put("status", isHealthy ? "UP" : "DOWN");
        health.put("errorRate", errorRate);
        health.put("totalRequests", totalRequests.get());
        health.put("uptime", "Since " + startupTime);

        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        double memoryUsage = (double) memoryBean.getHeapMemoryUsage().getUsed()
                / memoryBean.getHeapMemoryUsage().getMax() * 100;

        health.put("memoryUsagePercent", memoryUsage);
        health.put("memoryHealthy", memoryUsage < 90.0);

        return health;
    }
}
