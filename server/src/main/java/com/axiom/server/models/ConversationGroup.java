package com.axiom.server.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationGroup {
    private String conversationId;
    private String userId;
    private LocalDateTime startedAt;
    private LocalDateTime lastMessageAt;
    private List<Axiom> messages;
    private int messageCount;
}
