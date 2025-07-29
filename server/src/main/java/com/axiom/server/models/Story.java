package com.axiom.server.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@Table(name = "STORIES")
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "story_seq")
    @SequenceGenerator(name = "story_seq", sequenceName = "STORY_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private String userId;

    @Column(name = "USERNAME")
    private String username;

    @Column(name = "MEDIA_PATH", length = 1000)
    private String mediaPath;

    @Column(name = "IS_VIDEO")
    private Boolean isVideo;

    @Column(name = "VIEWED_BY", columnDefinition = "CLOB")
    @Convert(converter = StringSetConverter.class)
    private Set<String> viewedBy = new HashSet<>();

    @Column(name = "CAPTION", length = 4000)
    private String caption;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "EXPIRES_AT")
    private LocalDateTime expiresAt;
}

@Converter
class StringSetConverter implements AttributeConverter<Set<String>, String> {

    @Override
    public String convertToDatabaseColumn(Set<String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        return String.join(",", attribute);
    }

    @Override
    public Set<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(Arrays.asList(dbData.split(",")));
    }
}
