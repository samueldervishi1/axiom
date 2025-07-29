package com.axiom.server.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "FOLLOW_REQUESTS")
public class FollowRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "follow_seq")
    @SequenceGenerator(name = "follow_seq", sequenceName = "FOLLOW_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "SENDER_ID")
    private Long senderId;

    @Column(name = "RECEIVER_ID")
    private Long receiverId;

    @Column(name = "STATUS")
    @Enumerated(EnumType.STRING)
    private FollowStatus status;

    @Column(name = "TIMESTAMP")
    private LocalDateTime timestamp;
}
