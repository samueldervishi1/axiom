package com.axiom.server.services;

import com.axiom.server.exceptions.CustomException;
import com.axiom.server.models.Post;
import com.axiom.server.utils.VDataSource;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class DBService {

    private final LoggingService loggingService;

    @Value("${app.database.package.name}")
    private String postPkgName;

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final VDataSource vDataSource;

    public DBService(VDataSource vDataSource, LoggingService loggingService) {
        this.vDataSource = vDataSource;
        this.loggingService = loggingService;
    }

    public List<Map<String, Object>> executeQuery(Object requestBody)
            throws SQLException, IOException, CustomException {

        List<Map<String, Object>> response = new ArrayList<>();

        String executeQueryCall = "begin ?:=" + postPkgName + ".executeQuery(?); end;";

        try (Connection conn = getConnection()) {
            String jsonRequest = objectMapper.writeValueAsString(requestBody);

            Object[] inParameters = new Object[]{jsonRequest};

            log.info("DB Request - JSON: {}", jsonRequest);

            try (CallableStatement callableStatement = executeCall(conn, executeQueryCall, inParameters);
                    ResultSet resultSet = (ResultSet) callableStatement.getObject(1)) {

                while (resultSet.next()) {
                    String jsonResponse = resultSet.getString("response_text");

                    if (jsonResponse != null && (jsonResponse.startsWith("Database error")
                            || jsonResponse.startsWith("Routing error") || jsonResponse.contains("error"))) {
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
                        log.info("Non-JSON response: {}", jsonResponse);
                        Map<String, Object> rawResponse = new HashMap<>();
                        rawResponse.put("message", jsonResponse);
                        response.add(rawResponse);
                    }
                }
            }
        }

        return response;
    }

    private CallableStatement executeCall(Connection conn, String query, Object[] inParameters) throws SQLException {
        CallableStatement statement = getPreparedCall(conn, query, inParameters);
        statement.execute();
        return statement;
    }

    private CallableStatement getPreparedCall(Connection conn, String query, Object[] inParameters)
            throws SQLException {
        CallableStatement call = conn.prepareCall(query);
        call.registerOutParameter(1, Types.REF_CURSOR);

        if (inParameters != null) {
            for (int i = 0; i < inParameters.length; i++) {
                call.setObject(i + 2, inParameters[i]);
            }
        }

        return call;
    }

    public List<Map<String, Object>> createScheduledPost(String authorId, String content, String authorName,
            LocalDateTime scheduledFor) throws SQLException, IOException {

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

    public Map<String, Object> getPostImageData(Long postId) throws SQLException, IOException {
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

    private Connection getConnection() throws SQLException {
        return vDataSource.getConnection();
    }
}
