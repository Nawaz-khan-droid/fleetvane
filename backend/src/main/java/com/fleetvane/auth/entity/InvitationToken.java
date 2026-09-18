package com.fleetvane.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "invitation_tokens")
public class InvitationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "link_expires_at", nullable = false)
    private LocalDateTime linkExpiresAt;

    @Column(name = "is_used")
    private boolean isUsed = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public InvitationToken() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public LocalDateTime getLinkExpiresAt() { return linkExpiresAt; }
    public void setLinkExpiresAt(LocalDateTime linkExpiresAt) { this.linkExpiresAt = linkExpiresAt; }

    public boolean isUsed() { return isUsed; }
    public void setUsed(boolean used) { this.isUsed = used; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
