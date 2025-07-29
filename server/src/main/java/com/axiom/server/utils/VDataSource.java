package com.axiom.server.utils;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

@Component
public class VDataSource {

    private DataSource dataSource;

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${spring.datasource.driver-class-name}")
    private String driverClassName;

    @PostConstruct
    public void init() throws IOException {
        this.dataSource = initDataSource();
    }

    public Connection getConnection() throws SQLException {
        if (dataSource == null) {
            throw new SQLException("DataSource not initialized");
        }
        return dataSource.getConnection();
    }

    private DataSource initDataSource() throws IOException {
        Logger.getLogger(VDataSource.class.getName()).log(Level.INFO, "initDataSource() - Local Oracle Connection");

        try {
            HikariConfig config = getHikariConfig();

            Logger.getLogger(VDataSource.class.getName()).log(Level.INFO,
                    "DataSource initialized with URL: " + url + " and user: " + username);

            return new HikariDataSource(config);

        } catch (Exception e) {
            Logger.getLogger(VDataSource.class.getName()).log(Level.SEVERE, "Failed to initialize DataSource", e);
            throw new IOException("Failed to initialize DataSource: " + e.getMessage(), e);
        }
    }

    private HikariConfig getHikariConfig() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driverClassName);

        // Oracle-specific optimizations
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setLeakDetectionThreshold(60000);

        // Oracle connection properties
        config.addDataSourceProperty("oracle.jdbc.timezoneAsRegion", "false");
        config.addDataSourceProperty("oracle.net.keepAlive", "true");
        config.addDataSourceProperty("oracle.jdbc.ReadTimeout", "30000");
        return config;
    }
}
