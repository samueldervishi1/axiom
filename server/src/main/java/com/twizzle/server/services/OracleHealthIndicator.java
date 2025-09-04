package com.twizzle.server.services;

import com.twizzle.server.utils.VDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;

@Component
public class OracleHealthIndicator implements HealthIndicator {

    @Value("${app.health.database.query}")
    private String healthQuery;

    private final VDataSource dataSource;

    public OracleHealthIndicator(VDataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        try (Connection connection = dataSource.getConnection()) {
            try (PreparedStatement stmt = connection.prepareStatement(healthQuery)) {
                ResultSet rs = stmt.executeQuery();
                if (rs.next()) {
                    return Health.up().withDetail("database", "Oracle").withDetail("status", "Connection successful")
                            .withDetail("timestamp", Instant.now()).build();
                }
            }
        } catch (SQLException e) {
            return Health.down().withDetail("database", "Oracle").withDetail("error", e.getMessage())
                    .withDetail("timestamp", Instant.now()).build();
        }
        return Health.down().withDetail("database", "Oracle connection failed").build();
    }
}
