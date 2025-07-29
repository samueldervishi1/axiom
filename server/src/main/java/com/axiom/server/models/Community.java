package com.axiom.server.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "COMMUNITIES")
public class Community {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "community_seq")
    @SequenceGenerator(name = "community_seq", sequenceName = "COMMUNITY_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NAME")
    private String name;

    @Column(name = "DESCRIPTION", length = 4000)
    private String description;

    @Column(name = "OWNER_ID")
    private Long ownerId;

    @Column(name = "CREATED_AT")
    private LocalDateTime createTime;

    @Column(name = "POST_IDS", columnDefinition = "CLOB")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> postIds = new ArrayList<>();

    @Column(name = "USER_IDS", columnDefinition = "CLOB")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> userIds = new ArrayList<>();
}
