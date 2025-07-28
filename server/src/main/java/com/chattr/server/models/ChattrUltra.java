package com.chattr.server.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "CHAT_CONVERSATIONS")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChattrUltra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(name = "USER_QUESTION", nullable = false)
    private String userQuestion;

    @Lob
    @Column(name = "GEMINI_ANSWER")
    private String geminiAnswer;

    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "CONVERSATION_ID", length = 100)
    private String conversationId;

    @Column(name = "SUCCESS")
    private Boolean success;

    @Lob
    @Column(name = "ERROR_MESSAGE")
    private String errorMessage;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
