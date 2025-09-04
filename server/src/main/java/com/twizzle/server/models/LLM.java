package com.twizzle.server.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "LLM")
public class LLM {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "llm_seq")
    @SequenceGenerator(name = "llm_seq", sequenceName = "LLM_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "DATE_TIME")
    private LocalDateTime dateTime;

    @Column(name = "CHANGES", length = 4000)
    private String changes;

    @Column(name = "VERSION")
    private String version;

    @Column(name = "STATUS")
    private String status;

    @Column(name = "MODEL_NAME")
    private String modelName;

    @Column(name = "MODEL_ID")
    private String modelId;

    @Column(name = "PARAMETERS")
    private String parameters;

    @Column(name = "MAX_TOKENS")
    private Integer maxTokens;

    @Column(name = "TRAINING_DATA")
    private String trainingData;

    @Column(name = "ARCHITECTURE")
    private String architecture;

    @Column(name = "CAPABILITIES")
    private String capabilities;

    public LLM() {
        this.dateTime = LocalDateTime.now();
    }
}
