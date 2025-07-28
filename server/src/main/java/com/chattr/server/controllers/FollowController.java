package com.chattr.server.controllers;

import com.chattr.server.models.FollowRequest;
import com.chattr.server.models.FollowStatus;
import com.chattr.server.models.User;
import com.chattr.server.services.FollowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/follow")
public class FollowController {

    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    @GetMapping("/mutual")
    public ResponseEntity<?> isMutualFollow(@RequestParam Long userAId, @RequestParam Long userBId) {
        boolean isMutual = followService.isMutualFollow(userAId, userBId);
        return ResponseEntity.ok(Map.of("mutual", isMutual));
    }

    @GetMapping("/mutual-connections")
    public ResponseEntity<?> getMutualConnections(@RequestParam Long viewerId, @RequestParam Long profileId) {
        List<User> mutuals = followService.getMutualConnections(viewerId, profileId);
        return ResponseEntity.ok(Map.of("mutualConnections", mutuals));
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<?> getPendingFollowRequests(@RequestParam Long userId) {
        List<FollowRequest> pendingRequests = followService.getPendingFollowRequests(userId);
        return ResponseEntity.ok(pendingRequests);
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<?> getSentFollowRequests(@RequestParam Long userId) {
        List<FollowRequest> sentRequests = followService.getSentFollowRequests(userId);
        return ResponseEntity.ok(sentRequests);
    }

    @GetMapping("/status")
    public ResponseEntity<?> getFollowStatus(@RequestParam Long senderId, @RequestParam Long receiverId) {
        FollowStatus status = followService.getFollowStatus(senderId, receiverId);
        return ResponseEntity.ok(Map.of("status", status.name()));
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<?> getFollowers(@PathVariable Long userId) {
        List<User> followers = followService.getFollowers(userId);
        return ResponseEntity.ok(Map.of("followers", followers));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<?> getFollowing(@PathVariable Long userId) {
        List<User> following = followService.getFollowing(userId);
        return ResponseEntity.ok(Map.of("following", following));
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendFollowRequest(@RequestBody Map<String, Long> payload) {
        Long senderId = payload.get("senderId");
        Long receiverId = payload.get("receiverId");

        followService.sendFollowRequest(senderId, receiverId);
        return ResponseEntity.ok(Map.of("message", "Follow request sent successfully"));
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptFollowRequest(@RequestBody Map<String, Long> payload) {
        Long requestId = payload.get("requestId");
        Long receiverId = payload.get("receiverId");

        followService.acceptFollowRequest(requestId, receiverId);
        return ResponseEntity.ok(Map.of("message", "Follow request accepted successfully"));
    }

    @PostMapping("/unfollow")
    public ResponseEntity<?> unfollowUser(@RequestBody Map<String, Long> payload) {
        Long followerId = payload.get("followerId");
        Long followeeId = payload.get("followeeId");

        followService.unfollowUser(followerId, followeeId);
        return ResponseEntity.ok(Map.of("message", "User unfollowed successfully"));
    }

    @PostMapping("/requests/reject")
    public ResponseEntity<?> rejectFollowRequest(@RequestBody Map<String, Long> payload) {
        Long requestId = payload.get("requestId");
        Long receiverId = payload.get("receiverId");

        followService.rejectFollowRequest(requestId, receiverId);
        return ResponseEntity.ok(Map.of("message", "Follow request rejected successfully"));
    }
}
