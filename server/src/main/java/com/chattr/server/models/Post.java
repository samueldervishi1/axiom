package com.chattr.server.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Setter
@Getter
@Table(name = "POSTS")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "post_seq")
    @SequenceGenerator(name = "post_seq", sequenceName = "POST_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "AUTHOR_ID", nullable = false)
    private String authorId;

    @Column(name = "CONTENT", length = 4000)
    private String content;

    @Column(name = "AUTHOR_NAME", nullable = false)
    private String authorName;

    @ElementCollection
    @CollectionTable(name = "POST_LIKES", joinColumns = @JoinColumn(name = "POST_ID"))
    @Column(name = "USER_ID")
    private List<String> likedUserIds = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "POST_SAVES", joinColumns = @JoinColumn(name = "POST_ID"))
    @Column(name = "USER_ID")
    private List<String> savedUserIds = new ArrayList<>();

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "DELETED")
    private Boolean deleted = false;

    @Column(name = "REPORTED")
    private Boolean reported = false;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public boolean isReported() {
        return reported != null && reported;
    }
}
