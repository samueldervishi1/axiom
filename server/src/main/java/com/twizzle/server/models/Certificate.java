package com.twizzle.server.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Objects;

@Setter
@Getter
@Entity
@Table(name = "USER_CERTIFICATES")
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "certificate_seq")
    @SequenceGenerator(name = "certificate_seq", sequenceName = "CERTIFICATE_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private Long userId;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "ISSUING_ORGANIZATION")
    private String issuingOrganization;

    @Column(name = "ISSUE_DATE")
    private LocalDate issueDate;

    @Column(name = "EXPIRATION_DATE")
    private LocalDate expirationDate;

    @Column(name = "CREDENTIAL_ID")
    private String credentialId;

    @Column(name = "CREDENTIAL_URL")
    private String credentialUrl;

    @Column(name = "DESCRIPTION", length = 1000)
    private String description;

    @Column(name = "DOES_NOT_EXPIRE")
    private boolean doesNotExpire = false;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Certificate certificate = (Certificate) o;
        return Objects.equals(id, certificate.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
