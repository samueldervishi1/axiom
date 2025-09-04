package com.twizzle.server.repositories;

import com.twizzle.server.models.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    List<Story> findByUserIdAndExpiresAtAfter(String userId, LocalDateTime now);
    List<Story> findByExpiresAtAfter(LocalDateTime now);
    List<Story> findByUsernameAndExpiresAtAfter(String username, LocalDateTime now);
}
