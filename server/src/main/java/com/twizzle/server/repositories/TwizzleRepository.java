package com.twizzle.server.repositories;

import com.twizzle.server.models.Twizzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TwizzleRepository extends JpaRepository<Twizzle, Long> {
    List<Twizzle> findByConversationIdOrderByCreatedAtAsc(String conversationId);
    List<Twizzle> findByUserIdOrderByConversationIdAscCreatedAtAsc(String userId);

    @Modifying
    @Query("DELETE FROM Twizzle a WHERE a.conversationId = :conversationId")
    void deleteByConversationId(@Param("conversationId") String conversationId);
}
