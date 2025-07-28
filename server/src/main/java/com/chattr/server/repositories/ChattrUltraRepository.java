package com.chattr.server.repositories;

import com.chattr.server.models.ChattrUltra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChattrUltraRepository extends JpaRepository<ChattrUltra, Long> {
    List<ChattrUltra> findByConversationIdOrderByCreatedAtAsc(String conversationId);
}
