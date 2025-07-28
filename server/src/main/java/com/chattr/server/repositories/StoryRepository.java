package com.chattr.server.repositories;

import com.chattr.server.models.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    List<Story> findByUserIdAndExpiresAtAfter(String userId, LocalDateTime now);

    List<Story> findByExpiresAtAfter(LocalDateTime now);

    @Query("SELECT s FROM Story s WHERE s.userId = :userId ORDER BY s.createdAt DESC")
    List<Story> findByUserIdOrderByCreatedAtDesc(@Param("userId") String userId);

    @Query("SELECT s FROM Story s WHERE s.expiresAt > :now ORDER BY s.createdAt DESC")
    List<Story> findActiveStoriesOrderByCreatedAtDesc(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(s) FROM Story s WHERE s.userId = :userId AND s.expiresAt > :now")
    Long countActiveStoriesByUserId(@Param("userId") String userId, @Param("now") LocalDateTime now);

    List<Story> findByUsernameAndExpiresAtAfter(String username, LocalDateTime now);
}