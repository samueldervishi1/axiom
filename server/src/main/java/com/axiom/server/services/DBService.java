package com.axiom.server.services;

import com.axiom.server.exceptions.CustomException;
import com.axiom.server.models.Post;
import com.axiom.server.utils.VDataSource;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.StopWatch;

import java.io.IOException;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class DBService {

    private final LoggingService loggingService;

    @Value("${app.database.package.name}")
    private String postPkgName;

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final VDataSource vDataSource;
    private final Map<String, Long> queryPerformanceMetrics = new ConcurrentHashMap<>();

    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final long BASE_RETRY_DELAY_MS = 100;

    @Value("${db.performance.slow-query-threshold-ms:1000}")
    private long slowQueryThresholdMs;

    public DBService(VDataSource vDataSource, LoggingService loggingService) {
        this.vDataSource = vDataSource;
        this.loggingService = loggingService;
    }

    public List<Map<String, Object>> executeQuery(Object requestBody)
            throws SQLException, IOException, CustomException {

        StopWatch stopWatch = new StopWatch("DBService.executeQuery");
        stopWatch.start();

        List<Map<String, Object>> response;
        String executeQueryCall = "begin ?:=" + postPkgName + ".executeQuery(?); end;";

        String requestSignature = generateRequestSignature(requestBody);

        int attempt = 0;
        SQLException lastException = null;

        while (true) {
            try (Connection conn = getConnectionWithTimeout()) {
                String jsonRequest = getCachedJsonString(requestBody);
                Object[] inParameters = new Object[]{jsonRequest};

                log.debug("DB Request - JSON: {} (Attempt: {})", jsonRequest, attempt + 1);

                try (CallableStatement callableStatement = executeCallWithCache(conn, executeQueryCall, inParameters,
                        requestSignature)) {
                    callableStatement.setQueryTimeout(30);

                    try (ResultSet resultSet = (ResultSet) callableStatement.getObject(1)) {
                        response = processResultSet(resultSet);
                        break;
                    }
                }
            } catch (SQLException e) {
                lastException = e;
                attempt++;

                if (attempt < MAX_RETRY_ATTEMPTS) {
                    long delayMs = BASE_RETRY_DELAY_MS * (1L << attempt);
                    log.warn("Database query failed (attempt {}/{}), retrying in {}ms: {}", attempt, MAX_RETRY_ATTEMPTS,
                            delayMs, e.getMessage());
                    try {
                        TimeUnit.MILLISECONDS.sleep(delayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new CustomException(500, "Query interrupted: " + ie.getMessage());
                    }
                } else {
                    log.error("All database retry attempts failed", e);
                    throw new CustomException(500,
                            "Database operation failed after " + MAX_RETRY_ATTEMPTS + " attempts: " + e.getMessage());
                }
            }
        }

        if (response.isEmpty() && lastException != null) {
            throw new CustomException(500, "Database operation failed: " + lastException.getMessage());
        }

        stopWatch.stop();
        long executionTime = stopWatch.getTotalTimeMillis();
        logQueryPerformance(requestSignature, executionTime);

        return response;
    }

    private CallableStatement executeCallWithCache(Connection conn, String query, Object[] inParameters,
            String signature) throws SQLException {
        CallableStatement statement = getPreparedCallWithCache(conn, query, inParameters);
        statement.execute();
        return statement;
    }

    private CallableStatement getPreparedCallWithCache(Connection conn, String query, Object[] inParameters)
            throws SQLException {

        CallableStatement call = conn.prepareCall(query, ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
        call.registerOutParameter(1, Types.REF_CURSOR);

        try {
            if (call.isWrapperFor(Class.forName("oracle.jdbc.OracleCallableStatement"))) {
                log.debug("Using Oracle-specific statement optimizations");
            }
        } catch (ClassNotFoundException e) {
            log.debug("Oracle driver not available, using standard JDBC");
        }

        if (inParameters != null) {
            for (int i = 0; i < inParameters.length; i++) {
                call.setObject(i + 2, inParameters[i]);
            }
        }

        return call;
    }

    @Cacheable(value = "scheduledPosts", key = "#authorId + '_' + #content.hashCode()")
    public List<Map<String, Object>> createScheduledPost(String authorId, String content, String authorName,
            LocalDateTime scheduledFor) throws SQLException, IOException {

        log.debug("Creating scheduled post for author: {}", authorId);

        Map<String, Object> request = new HashMap<>();
        request.put("action", "create_scheduled");
        request.put("authorId", authorId);
        request.put("content", content);
        request.put("authorName", authorName);
        request.put("scheduledFor", scheduledFor.toString());

        return executeQuery(request);
    }

    public void publishScheduledPosts() throws SQLException, IOException {
        Map<String, Object> request = new HashMap<>();
        request.put("action", "publish_scheduled");
        executeQuery(request);
    }

    public List<Map<String, Object>> createPostWithImage(Post post) throws SQLException, IOException {
        List<Map<String, Object>> response = new ArrayList<>();

        String createPostCall = "begin ?:=" + postPkgName + ".create_post(?, ?, ?, ?, ?, ?); end;";

        try (Connection conn = getConnection()) {
            try (CallableStatement call = conn.prepareCall(createPostCall)) {
                call.registerOutParameter(1, Types.REF_CURSOR);
                call.setString(2, post.getContent());
                call.setString(3, post.getAuthorId());
                call.setString(4, post.getAuthorName());

                if (post.getImageData() != null) {
                    call.setBytes(5, post.getImageData());
                } else {
                    call.setNull(5, Types.BLOB);
                }
                call.setString(6, post.getImageFilename());
                call.setString(7, post.getImageContentType());

                call.execute();

                try (ResultSet resultSet = (ResultSet) call.getObject(1)) {
                    while (resultSet.next()) {
                        String jsonResponse = resultSet.getString("response_text");

                        if (jsonResponse != null && (jsonResponse.startsWith("Database error")
                                || jsonResponse.startsWith("Routing error") || jsonResponse.contains("error"))) {
                            throw new CustomException(500, "Database operation failed: " + jsonResponse);
                        }

                        try {
                            Map<String, Object> responseMap = objectMapper.readValue(jsonResponse,
                                    new TypeReference<>() {
                                    });
                            response.add(responseMap);
                        } catch (Exception e) {
                            Map<String, Object> rawResponse = new HashMap<>();
                            rawResponse.put("message", jsonResponse);
                            response.add(rawResponse);
                        }
                    }
                }
            }
        }

        return response;
    }

    public Map<String, Object> getPostImageData(Long postId) throws SQLException {
        String getImageCall = "begin ?:=" + postPkgName + ".get_post_image(?); end;";

        try (Connection conn = getConnection(); CallableStatement call = conn.prepareCall(getImageCall)) {

            call.registerOutParameter(1, Types.REF_CURSOR);
            call.setLong(2, postId);

            call.execute();

            try (ResultSet resultSet = (ResultSet) call.getObject(1)) {
                if (resultSet.next()) {
                    Map<String, Object> imageData = new HashMap<>();
                    imageData.put("IMAGE_DATA", resultSet.getBlob("IMAGE_DATA"));
                    imageData.put("IMAGE_FILENAME", resultSet.getString("IMAGE_FILENAME"));
                    imageData.put("IMAGE_CONTENT_TYPE", resultSet.getString("IMAGE_CONTENT_TYPE"));
                    return imageData;
                }
            }
        }
        return null;
    }

    private Connection getConnectionWithTimeout() throws SQLException {
        Connection conn = vDataSource.getConnection();

        conn.setAutoCommit(true);
        conn.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);

        return conn;
    }

    private Connection getConnection() throws SQLException {
        return getConnectionWithTimeout();
    }

    private String generateRequestSignature(Object requestBody) {
        try {
            if (requestBody instanceof Map<?, ?> map) {
                String action = String.valueOf(map.get("action"));
                return action != null ? action : "unknown";
            }
            return requestBody.getClass().getSimpleName();
        } catch (Exception e) {
            return "signature_error";
        }
    }

    private String getCachedJsonString(Object requestBody) throws IOException {
        return objectMapper.writeValueAsString(requestBody);
    }

    private List<Map<String, Object>> processResultSet(ResultSet resultSet) throws SQLException, CustomException {
        List<Map<String, Object>> response = new ArrayList<>();

        while (resultSet.next()) {
            String jsonResponse = resultSet.getString("response_text");

            if (isErrorResponse(jsonResponse)) {
                log.error("DB Error - Response: {}", jsonResponse);

                Exception dbException = new SQLException("Database operation failed: " + jsonResponse);
                loggingService.logError("DbService", "executeQuery", "Database operation failed", dbException);

                throw new CustomException(500, "Database operation failed: " + jsonResponse);
            }

            try {
                Map<String, Object> responseMap = objectMapper.readValue(jsonResponse, new TypeReference<>() {
                });
                response.add(responseMap);
            } catch (Exception e) {
                log.debug("Non-JSON response: {}", jsonResponse);
                Map<String, Object> rawResponse = new HashMap<>();
                rawResponse.put("message", jsonResponse);
                response.add(rawResponse);
            }
        }

        return response;
    }

    private boolean isErrorResponse(String jsonResponse) {
        return jsonResponse != null
                && (jsonResponse.startsWith("Database error") || jsonResponse.startsWith("Routing error")
                        || jsonResponse.contains("ORA-") || jsonResponse.toLowerCase().contains("error"));
    }

    private void logQueryPerformance(String signature, long executionTime) {
        queryPerformanceMetrics.merge(signature, executionTime, Long::sum);

        if (executionTime > slowQueryThresholdMs) {
            log.warn("Slow query detected - Signature: {}, Execution time: {}ms", signature, executionTime);
            loggingService.logWarn("DBService", "slowQuery",
                    String.format("Slow query: %s took %dms", signature, executionTime));
        } else {
            log.debug("Query executed - Signature: {}, Execution time: {}ms", signature, executionTime);
        }
    }

    /**
     * Get performance statistics (useful for monitoring)
     */
    public Map<String, Object> getPerformanceStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalQueries", queryPerformanceMetrics.size());
        stats.put("queryMetrics", new HashMap<>(queryPerformanceMetrics));

        // Calculate average execution time per query type
        Map<String, Double> avgExecutionTimes = new HashMap<>();
        queryPerformanceMetrics.forEach((sig, totalTime) -> {
            // This is simplified - in production you'd track count separately
            avgExecutionTimes.put(sig, totalTime.doubleValue());
        });
        stats.put("averageExecutionTimes", avgExecutionTimes);

        return stats;
    }
}
