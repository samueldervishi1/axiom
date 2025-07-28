package com.chattr.server.controllers;

import com.chattr.server.exceptions.CustomException;
import com.chattr.server.models.Community;
import com.chattr.server.services.DBService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.naming.NamingException;
import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/community")
public class CommunityController {

    private final DBService dbService;
    private final ObjectMapper objectMapper;

    public CommunityController(DBService dbService, ObjectMapper objectMapper) {
        this.dbService = dbService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/get/all")
    public ResponseEntity<List<Community>> getAllCommunities() {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("action", "GET_ALL_COMMUNITIES");
            requestBody.put("table", "COMMUNITIES");

            List<Map<String, Object>> dbResponse = dbService.executeQuery(requestBody);
            List<Community> communities = dbResponse.stream().map(this::mapToCommunity).collect(Collectors.toList());

            return ResponseEntity.ok(communities);

        } catch (SQLException | IOException | NamingException | CustomException e) {
            log.error("Error getting all communities", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/get/{name}")
    public ResponseEntity<Community> getCommunityByName(@PathVariable String name) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("action", "GET_COMMUNITY_BY_NAME");
            requestBody.put("table", "COMMUNITIES");
            requestBody.put("name", name);

            List<Map<String, Object>> dbResponse = dbService.executeQuery(requestBody);

            if (dbResponse.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Community community = mapToCommunity(dbResponse.get(0));
            return ResponseEntity.ok(community);

        } catch (SQLException | IOException | NamingException | CustomException e) {
            log.error("Error getting community by name: {}", name, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/count/users/{name}")
    public ResponseEntity<Integer> getUserCountForCommunity(@PathVariable String name) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("action", "GET_USER_COUNT_FOR_COMMUNITY");
            requestBody.put("table", "COMMUNITIES");
            requestBody.put("name", name);

            List<Map<String, Object>> dbResponse = dbService.executeQuery(requestBody);

            if (dbResponse.isEmpty()) {
                return ResponseEntity.ok(0);
            }

            Object countObj = dbResponse.get(0).get("USER_COUNT");
            Integer count = getIntegerValue(countObj);
            return ResponseEntity.ok(count != null ? count : 0);

        } catch (SQLException | IOException | NamingException | CustomException e) {
            log.error("Error getting user count for community: {}", name, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/create/{ownerId}")
    public ResponseEntity<Community> createCommunity(@PathVariable String ownerId, @RequestBody Community community) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("action", "CREATE_COMMUNITY");
            requestBody.put("table", "COMMUNITIES");
            requestBody.put("name", community.getName());
            requestBody.put("ownerId", ownerId);
            requestBody.put("description", community.getDescription());
            requestBody.put("createTime", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            List<Map<String, Object>> dbResponse = dbService.executeQuery(requestBody);

            if (!dbResponse.isEmpty()) {
                Community created = mapToCommunity(dbResponse.get(0));

                return ResponseEntity.status(HttpStatus.CREATED).body(created);
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();

        } catch (SQLException | IOException | NamingException | CustomException e) {
            log.error("Error creating community for owner: {}", ownerId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/join/{communityId}/{userId}")
    public ResponseEntity<String> joinCommunity(@PathVariable String communityId, @PathVariable String userId) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("action", "JOIN_COMMUNITY");
            requestBody.put("table", "COMMUNITIES");
            requestBody.put("communityId", communityId);
            requestBody.put("userId", userId);

            dbService.executeQuery(requestBody);
            return ResponseEntity.ok("User has successfully joined the community.");

        } catch (SQLException | IOException | NamingException | CustomException e) {
            log.error("Error joining community {} for user {}", communityId, userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to join community: " + e.getMessage());
        }
    }

    @PostMapping("/leave/{communityId}/{userId}")
    public ResponseEntity<String> leaveCommunity(@PathVariable String communityId, @PathVariable String userId) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("action", "LEAVE_COMMUNITY");
            requestBody.put("table", "COMMUNITIES");
            requestBody.put("communityId", communityId);
            requestBody.put("userId", userId);

            dbService.executeQuery(requestBody);
            return ResponseEntity.ok("User has successfully left the community.");

        } catch (SQLException | IOException | NamingException | CustomException e) {
            log.error("Error leaving community {} for user {}", communityId, userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to leave community: " + e.getMessage());
        }
    }

    private Community mapToCommunity(Map<String, Object> dbRow) {
        Community community = new Community();

        try {
            community.setId(getLongValue(dbRow.get("ID")));
            community.setName((String) dbRow.get("NAME"));
            community.setDescription((String) dbRow.get("DESCRIPTION"));
            community.setOwnerId(getLongValue(dbRow.get("OWNER_ID")));

            Object createTimeObj = dbRow.get("CREATED_AT");
            if (createTimeObj != null) {
                if (createTimeObj instanceof String) {
                    community.setCreateTime(
                            LocalDateTime.parse((String) createTimeObj, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                } else if (createTimeObj instanceof LocalDateTime) {
                    community.setCreateTime((LocalDateTime) createTimeObj);
                }
            }

            String postIdsJson = (String) dbRow.get("POST_IDS");
            if (postIdsJson != null && !postIdsJson.trim().isEmpty()) {
                try {
                    List<String> postIds = objectMapper.readValue(postIdsJson, new TypeReference<>() {
                    });
                    community.setPostIds(postIds != null ? postIds : new ArrayList<>());
                } catch (Exception e) {
                    log.warn("Error parsing POST_IDS JSON", e);
                    community.setPostIds(new ArrayList<>());
                }
            } else {
                community.setPostIds(new ArrayList<>());
            }

            String userIdsJson = (String) dbRow.get("USER_IDS");
            if (userIdsJson != null && !userIdsJson.trim().isEmpty()) {
                try {
                    List<String> userIds = objectMapper.readValue(userIdsJson, new TypeReference<>() {
                    });
                    community.setUserIds(userIds != null ? userIds : new ArrayList<>());
                } catch (Exception e) {
                    log.warn("Error parsing USER_IDS JSON", e);
                    community.setUserIds(new ArrayList<>());
                }
            } else {
                community.setUserIds(new ArrayList<>());
            }

        } catch (Exception e) {
            log.error("Error mapping database row to Community object", e);
        }

        return community;
    }

    private Long getLongValue(Object value) {
        if (value == null)
            return null;
        if (value instanceof Long)
            return (Long) value;
        if (value instanceof Number)
            return ((Number) value).longValue();
        if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private Integer getIntegerValue(Object value) {
        if (value == null)
            return null;
        if (value instanceof Integer)
            return (Integer) value;
        if (value instanceof Number)
            return ((Number) value).intValue();
        if (value instanceof String) {
            try {
                return Integer.parseInt((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
