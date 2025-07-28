package com.chattr.server.repositories;

import com.chattr.server.models.FollowRequest;
import com.chattr.server.models.FollowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<FollowRequest, Long> {
    Optional<FollowRequest> findBySenderIdAndReceiverId(Long senderId, Long receiverId);

    List<FollowRequest> findByReceiverIdAndStatus(Long receiverId, FollowStatus status);

    List<FollowRequest> findBySenderIdAndStatus(Long senderId, FollowStatus status);
}
