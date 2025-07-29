package com.axiom.server.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Setter
@Getter
@Table(name = "SCHEDULED_POSTS")
public class ScheduledPost {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "scheduled_post_seq")
    @SequenceGenerator(name = "scheduled_post_seq", sequenceName = "SCHEDULED_POST_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "AUTHOR_ID", nullable = false)
    private String authorId;

    @Column(name = "CONTENT", length = 4000)
    private String content;

    @Column(name = "AUTHOR_NAME", nullable = false)
    private String authorName;

    @Column(name = "SCHEDULED_FOR", nullable = false)
    private LocalDateTime scheduledFor;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "STATUS")
    private String status = "SCHEDULED";

    @Column(name = "PUBLISHED_AT")
    private LocalDateTime publishedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
