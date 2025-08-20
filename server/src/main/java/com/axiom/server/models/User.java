package com.axiom.server.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Setter
@Getter
@Entity
@Table(name = "USERS")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @SequenceGenerator(name = "user_seq", sequenceName = "USER_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USERNAME", unique = true, nullable = false)
    private String username;

    @Column(name = "PASSWORD", nullable = false)
    private String password;

    @Column(name = "FULL_NAME")
    private String fullName;

    @Column(name = "EMAIL", unique = true)
    private String email;

    @Column(name = "BIO", length = 1000)
    private String bio;

    @Column(name = "TITLE")
    private String title;

    @Column(name = "ROLE")
    private String role = "simple_account";

    @Column(name = "DELETED")
    private boolean deleted;

    @Column(name = "TWO_FA")
    private boolean twoFa = false;

    @Column(name = "ACCOUNT_CREATION_DATE")
    private LocalDateTime accountCreationDate;

    @ElementCollection
    @CollectionTable(name = "USER_REPORTED_POSTS", joinColumns = @JoinColumn(name = "USER_ID"))
    @Column(name = "POST_ID")
    private List<String> reportedPostIds = new ArrayList<>();

    @Column(name = "IS_DEACTIVATED")
    private boolean isDeactivated;

    @Column(name = "DEACTIVATION_TIME")
    private LocalDateTime deactivationTime;

    @Column(name = "IP_ADDRESS")
    private String ipAddress;

    @Column(name = "LAST_LOGIN_IP")
    private String lastLoginIp;

    @Column(name = "LAST_LOGIN_TIME")
    private LocalDateTime lastLoginTime;

    @Column(name = "FIRST_TIME_LOGGED_IN")
    private LocalDateTime firstTimeLoggedIn;

    @ElementCollection
    @CollectionTable(name = "USER_FOLLOWERS", joinColumns = @JoinColumn(name = "USER_ID"))
    @Column(name = "FOLLOWER_ID")
    private List<Long> followers = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "USER_FOLLOWING", joinColumns = @JoinColumn(name = "USER_ID"))
    @Column(name = "FOLLOWING_ID")
    private List<Long> following = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "USER_BLOCKED_USERS", joinColumns = @JoinColumn(name = "USER_ID"))
    @Column(name = "BLOCKED_USER_ID")
    private List<Long> blockedUsers = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "USER_SAVED_POSTS", joinColumns = @JoinColumn(name = "USER_ID"))
    @Column(name = "POST_ID")
    private List<String> savedPostIds = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "USER_LINKS", joinColumns = @JoinColumn(name = "USER_ID"))
    @Column(name = "LINK")
    private List<String> links = new ArrayList<>();

    @Column(name = "LOGIN_STREAK")
    private int loginStreak = 0;

    @Column(name = "IS_PRIVATE")
    private boolean isPrivate = true;

    @Column(name = "POST_COUNT")
    private int postCount;

    @Column(name = "LIKE_COUNT")
    private int likeCount;

    @Column(name = "COMMENT_COUNT")
    private int commentCount;

    @Column(name = "KARMA")
    private int karma;

    @Column(name = "PROFILE_COLOR_HEX")
    private String profileColorHex;

    @Column(name = "ABOUT", length = 4000)
    private String about;

    @Lob
    @Column(name = "PROFILE_IMAGE_DATA")
    private byte[] profileImageData;

    @Column(name = "PROFILE_IMAGE_FILENAME")
    private String profileImageFilename;

    @Column(name = "PROFILE_IMAGE_CONTENT_TYPE")
    private String profileImageContentType;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "USER_ID")
    private List<Experience> experiences = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "USER_ID")
    private List<Education> education = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "USER_ID")
    private List<Skill> skills = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "USER_ID")
    private List<Certificate> certificates = new ArrayList<>();

    @Column(name = "STRIPE_CUSTOMER_ID")
    private String stripeCustomerId;

    @Column(name = "SUBSCRIPTION_STATUS")
    private String subscriptionStatus = "inactive";

    @Column(name = "PLAN_TYPE")
    private String planType = "free";

    @Column(name = "SUBSCRIPTION_START_DATE")
    private LocalDateTime subscriptionStartDate;

    @Column(name = "SUBSCRIPTION_END_DATE")
    private LocalDateTime subscriptionEndDate;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        User user = (User) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
