package com.axiom.server.services;

import com.axiom.server.exceptions.CustomException;
import com.axiom.server.models.FollowRequest;
import com.axiom.server.models.FollowStatus;
import com.axiom.server.models.User;
import com.axiom.server.repositories.FollowRepository;
import com.axiom.server.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public FollowService(FollowRepository followRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void sendFollowRequest(Long senderId, Long receiverId) {
        User sender = userRepository.findById(senderId).orElseThrow(() -> new CustomException(404, "Sender not found"));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new CustomException(404, "User not found"));

        Optional<FollowRequest> existing = followRepository.findBySenderIdAndReceiverId(senderId, receiverId);
        if (existing.isPresent()) {
            throw new CustomException(400, "Follow request already exists");
        }

        if (sender.getFollowing().contains(receiverId)) {
            throw new CustomException(400, "Already following this user");
        }

        if (!receiver.isPrivate()) {
            addToFollowers(senderId, receiverId);
        } else {
            FollowRequest followRequest = new FollowRequest();
            followRequest.setSenderId(senderId);
            followRequest.setReceiverId(receiverId);
            followRequest.setStatus(FollowStatus.PENDING);
            followRequest.setTimestamp(LocalDateTime.now());
            followRepository.save(followRequest);
        }
    }

    @Transactional
    public void acceptFollowRequest(Long requestId, Long receiverId) {
        FollowRequest followRequest = followRepository.findById(requestId)
                .orElseThrow(() -> new CustomException(404, "Follow request not found"));

        if (!followRequest.getReceiverId().equals(receiverId)) {
            throw new CustomException(403, "Unauthorized to accept this request");
        }

        if (followRequest.getStatus() != FollowStatus.PENDING) {
            throw new CustomException(400, "Follow request is not actionable");
        }

        followRequest.setStatus(FollowStatus.ACCEPTED);
        followRequest.setTimestamp(LocalDateTime.now());
        followRepository.save(followRequest);

        addToFollowers(followRequest.getSenderId(), followRequest.getReceiverId());
    }

    @Transactional
    public void rejectFollowRequest(Long requestId, Long receiverId) {
        FollowRequest request = followRepository.findById(requestId)
                .orElseThrow(() -> new CustomException(404, "Follow request not found"));

        if (!request.getReceiverId().equals(receiverId)) {
            throw new CustomException(403, "Unauthorized to reject this request");
        }

        if (request.getStatus() != FollowStatus.PENDING) {
            throw new CustomException(400, "Follow request is not pending");
        }

        request.setStatus(FollowStatus.REJECTED);
        request.setTimestamp(LocalDateTime.now());
        followRepository.save(request);
    }

    @Transactional
    public void unfollowUser(Long followerId, Long followeeId) {
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new CustomException(404, "Follower not found"));

        User followee = userRepository.findById(followeeId)
                .orElseThrow(() -> new CustomException(404, "User not found"));

        follower.getFollowing().remove(followeeId);
        followee.getFollowers().remove(followerId);

        userRepository.save(follower);
        userRepository.save(followee);

        Optional<FollowRequest> followRequest = followRepository.findBySenderIdAndReceiverId(followerId, followeeId);
        followRequest.ifPresent(request -> {
            request.setStatus(FollowStatus.REJECTED);
            request.setTimestamp(LocalDateTime.now());
            followRepository.save(request);
        });
    }

    public boolean isMutualFollow(Long userAId, Long userBId) {
        User userA = userRepository.findById(userAId).orElseThrow(() -> new CustomException(404, "User A not found"));
        User userB = userRepository.findById(userBId).orElseThrow(() -> new CustomException(404, "User B not found"));

        boolean aFollowsB = userA.getFollowing() != null && userA.getFollowing().contains(userBId);
        boolean bFollowsA = userB.getFollowing() != null && userB.getFollowing().contains(userAId);

        return aFollowsB && bFollowsA;
    }

    public List<User> getMutualConnections(Long viewerId, Long profileId) {
        User viewer = userRepository.findById(viewerId).orElseThrow(() -> new CustomException(404, "Viewer not found"));

        if (viewer.getFollowing() == null || viewer.getFollowing().isEmpty()) {
            return new ArrayList<>();
        }

        return viewer.getFollowing().stream()
                .map(followedUserId -> userRepository.findById(followedUserId).orElse(null))
                .filter(followedUser -> followedUser != null && followedUser.getFollowing() != null
                        && followedUser.getFollowing().contains(profileId))
                .collect(Collectors.toList());
    }

    public List<FollowRequest> getPendingFollowRequests(Long userId) {
        return followRepository.findByReceiverIdAndStatus(userId, FollowStatus.PENDING);
    }

    public List<FollowRequest> getSentFollowRequests(Long userId) {
        return followRepository.findBySenderIdAndStatus(userId, FollowStatus.PENDING);
    }

    public FollowStatus getFollowStatus(Long senderId, Long receiverId) {
        User sender = userRepository.findById(senderId).orElse(null);
        if (sender != null && sender.getFollowing() != null && sender.getFollowing().contains(receiverId)) {
            return FollowStatus.ACCEPTED;
        }

        return followRepository.findBySenderIdAndReceiverId(senderId, receiverId).map(FollowRequest::getStatus)
                .orElse(FollowStatus.NONE);
    }

    public List<User> getFollowers(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(404, "User not found"));

        if (user.getFollowers() == null) {
            return new ArrayList<>();
        }

        return user.getFollowers().stream().map(followerId -> userRepository.findById(followerId).orElse(null))
                .filter(Objects::nonNull).collect(Collectors.toList());
    }

    public List<User> getFollowing(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(404, "User not found"));

        if (user.getFollowing() == null) {
            return new ArrayList<>();
        }

        return user.getFollowing().stream().map(followingId -> userRepository.findById(followingId).orElse(null))
                .filter(Objects::nonNull).collect(Collectors.toList());
    }

    private void addToFollowers(Long senderId, Long receiverId) {
        User sender = userRepository.findById(senderId).orElseThrow(() -> new CustomException(404, "Sender not found"));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new CustomException(404, "Receiver not found"));

        if (receiver.getFollowers() == null) {
            receiver.setFollowers(new ArrayList<>());
        }
        if (!receiver.getFollowers().contains(senderId)) {
            receiver.getFollowers().add(senderId);
        }

        if (sender.getFollowing() == null) {
            sender.setFollowing(new ArrayList<>());
        }
        if (!sender.getFollowing().contains(receiverId)) {
            sender.getFollowing().add(receiverId);
        }

        userRepository.save(receiver);
        userRepository.save(sender);
    }
}
