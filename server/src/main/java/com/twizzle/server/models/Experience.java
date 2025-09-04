package com.twizzle.server.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Objects;

@Setter
@Getter
@Entity
@Table(name = "USER_EXPERIENCE")
public class Experience {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "experience_seq")
    @SequenceGenerator(name = "experience_seq", sequenceName = "EXPERIENCE_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private Long userId;

    @Column(name = "COMPANY", nullable = false)
    private String company;

    @Column(name = "POSITION", nullable = false)
    private String position;

    @Column(name = "DESCRIPTION", length = 2000)
    private String description;

    @Column(name = "START_DATE")
    private LocalDate startDate;

    @Column(name = "END_DATE")
    private LocalDate endDate;

    @Column(name = "IS_CURRENT")
    private boolean isCurrent = false;

    @Column(name = "LOCATION")
    private String location;

    @Column(name = "EMPLOYMENT_TYPE")
    private String employmentType;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Experience experience = (Experience) o;
        return Objects.equals(id, experience.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
