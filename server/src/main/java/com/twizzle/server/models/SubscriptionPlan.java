package com.twizzle.server.models;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "SUBSCRIPTION_PLANS")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "subscription_plan_seq")
    @SequenceGenerator(name = "subscription_plan_seq", sequenceName = "SUBSCRIPTION_PLAN_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "PLAN_TYPE", nullable = false, unique = true)
    private String planType;

    @Column(name = "STRIPE_PRICE_ID", nullable = false)
    private String stripePriceId;

    @Column(name = "PRICE", nullable = false)
    private BigDecimal price;

    @Column(name = "BILLING_INTERVAL")
    private String billingInterval; // monthly, yearly

    @Column(name = "DESCRIPTION", length = 1000)
    private String description;

    @Column(name = "MAX_REQUESTS_PER_DAY")
    private Integer maxRequestsPerDay;

    @Column(name = "PREMIUM_MODELS_ACCESS")
    private boolean premiumModelsAccess;

    @Column(name = "ACTIVE")
    private boolean active = true;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
