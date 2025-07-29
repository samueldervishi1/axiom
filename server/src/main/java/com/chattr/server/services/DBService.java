package com.chattr.server.services;

import com.chattr.server.exceptions.CustomException;
import com.chattr.server.utils.VDataSource;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.naming.NamingException;
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

    @Value("${app.database.package.name}")
    private String postPkgName;

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final VDataSource vDataSource;

    public DBService(VDataSource vDataSource) {
        this.vDataSource = vDataSource;
    }

    public List<Map<String, Object>> executeQuery(Object requestBody)
            throws SQLException, IOException, NamingException, CustomException {

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

                log.info("DB Response - Result: {}", response);
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

    public List<Map<String, Object>> createScheduledPost(String authorId, String content,
                                                         String authorName, LocalDateTime scheduledFor)
            throws SQLException, IOException, NamingException {

        Map<String, Object> request = new HashMap<>();
        request.put("action", "create_scheduled");
        request.put("authorId", authorId);
        request.put("content", content);
        request.put("authorName", authorName);
        request.put("scheduledFor", scheduledFor.toString());

        return executeQuery(request);
    }

    public void publishScheduledPosts() throws SQLException, IOException, NamingException {
        Map<String, Object> request = new HashMap<>();
        request.put("action", "publish_scheduled");
        executeQuery(request);
    }

    private Connection getConnection() throws SQLException {
        return vDataSource.getConnection();
    }
}
