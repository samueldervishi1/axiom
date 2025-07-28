package com.chattr.server.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Setter
@Getter
@Table(name = "REPORTS")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "report_seq")
    @SequenceGenerator(name = "report_seq", sequenceName = "REPORT_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID")
    private String userId;

    @Column(name = "POST_ID")
    private Long postId;

    @Column(name = "REASON")
    private String reason;

    @Column(name = "REPORT_TIME")
    private LocalDateTime reportTime;
}
