package com.chattr.server.services;

import com.chattr.server.exceptions.CustomException;
import com.chattr.server.models.Messages;
import com.chattr.server.models.Post;
import com.chattr.server.models.Report;
import com.chattr.server.models.User;
import com.chattr.server.repositories.PostRepository;
import com.chattr.server.repositories.ReportRepository;
import com.chattr.server.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final LoggingService loggingService;

    public ReportService(ReportRepository reportRepository, PostRepository postRepository,
            UserRepository userRepository, LoggingService loggingService) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.loggingService = loggingService;
    }

    public Report report(Report report) {
        String sessionId = loggingService.getCurrentSessionId();

        try {
            String userId = report.getUserId();
            Long postId = report.getPostId();

            rejectIfAlreadyReported(userId, postId);
            markPostAsReported(postId);
            updateUserReportedPosts(userId, postId);

            report.setReportTime(LocalDateTime.now());

            return reportRepository.save(report);

        } catch (CustomException e) {
            loggingService.logSecurityEvent("POST_REPORTED_FAILED", report.getUserId(), sessionId,
                    String.format("User reported post %s for reason: %s", report.getPostId(), report.getReason()));
            loggingService.logError("ReportService", "report", "Error reporting", e);
            throw e;
        } catch (Exception e) {
            loggingService.logError("ReportService", "report", "Internal Server Error", e);
            throw new CustomException(500, Messages.REPORT_ERROR);
        }
    }

    private void rejectIfAlreadyReported(String userId, Long postId) {
        if (reportRepository.existsByUserIdAndPostId(userId, postId)) {
            throw new CustomException(400, String.format("User %s already reported post %s", userId, postId));
        }
    }

    private void markPostAsReported(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new CustomException(400, String.format("Post not found: %s", postId)));

        if (!post.isReported()) {
            post.setReported(true);
            postRepository.save(post);
        }
    }

    private void updateUserReportedPosts(String userId, Long postId) {
        User user = userRepository.findByUsername(userId)
                .orElseThrow(() -> new CustomException(404, String.format("User not found: %s", userId)));

        if (user.getReportedPostIds() == null) {
            user.setReportedPostIds(new ArrayList<>());
        }

        if (!user.getReportedPostIds().contains(postId.toString())) {
            user.getReportedPostIds().add(postId.toString());
            userRepository.save(user);
        }
    }
}
