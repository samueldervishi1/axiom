package com.axiom.server.utils;

import com.axiom.server.exceptions.CustomException;
import com.axiom.server.services.DBService;
import com.axiom.server.services.LoggingService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PostScheduler {

    private final DBService dbService;
    private final LoggingService loggingService;

    public PostScheduler(DBService dbService, LoggingService loggingService) {
        this.dbService = dbService;
        this.loggingService = loggingService;
    }

    @Scheduled(fixedRate = 300000)
    public void publishScheduledPosts() {
        try {
            dbService.publishScheduledPosts();
        } catch (Exception e) {
            loggingService.logError("PostScheduler", "publishScheduledPosts", "Failed to publish scheduled posts", e);
            throw new CustomException(500, "Failed to publish scheduled posts: " + e.getMessage());
        }
    }
}
