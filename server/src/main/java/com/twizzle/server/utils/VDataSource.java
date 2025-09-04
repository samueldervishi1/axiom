package com.twizzle.server.utils;

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
        HikariConfig config = getConfig();

        // Oracle connection properties for performance
        config.addDataSourceProperty("oracle.jdbc.timezoneAsRegion", "false");
        config.addDataSourceProperty("oracle.net.keepAlive", "true");
        config.addDataSourceProperty("oracle.jdbc.ReadTimeout", "15000");

        // Oracle statement caching for better performance
        config.addDataSourceProperty("oracle.jdbc.implicitStatementCacheSize", "50");
        config.addDataSourceProperty("oracle.jdbc.explicitStatementCacheSize", "50");
        config.addDataSourceProperty("oracle.net.CONNECT_TIMEOUT", "10000");
        config.addDataSourceProperty("oracle.jdbc.useFetchSizeWithLongColumn", "true");

        // Oracle performance tuning
        config.addDataSourceProperty("oracle.jdbc.defaultRowPrefetch", "20");
        config.addDataSourceProperty("oracle.jdbc.maxCachedBufferSize", "50");
        return config;
    }

    private HikariConfig getConfig() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driverClassName);

        // Optimized pool settings for high performance
        config.setMaximumPoolSize(25); // Increased for better concurrency
        config.setMinimumIdle(10); // Higher minimum for faster response times
        config.setConnectionTimeout(15000); // Reduced timeout for faster failure detection
        config.setIdleTimeout(300000); // 5 minutes idle timeout
        config.setMaxLifetime(900000); // 15 minutes max lifetime
        config.setLeakDetectionThreshold(30000); // 30 seconds leak detection
        config.setValidationTimeout(5000); // 5 seconds validation timeout
        config.setInitializationFailTimeout(10000); // 10 seconds init timeout
        return config;
    }

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${spring.datasource.driver-class-name}")
    private String driverClassName;
}
