package com.fleetvane.auth.repository;

import com.fleetvane.auth.entity.InvitationToken;
import com.fleetvane.auth.entity.User;
import com.fleetvane.shared.config.JpaAuditingConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(JpaAuditingConfig.class)
class InvitationTokenRepositoryIntegrationTest {

    @Autowired private InvitationTokenRepository invitationTokenRepository;
    @Autowired private UserRepository userRepository;

    private User driver;

    @BeforeEach
    void setUp() {
        invitationTokenRepository.deleteAll();
        userRepository.deleteAll();
        driver = userRepository.save(new User("driver@carrier.test", "temporary", "Driver", "DRIVER"));
    }

    @Test
    void findsOnlyUnusedExpiredInvitationTokens() {
        InvitationToken expiredUnused = save("expired-unused", LocalDateTime.now().minusMinutes(1), false);
        save("expired-used", LocalDateTime.now().minusMinutes(1), true);
        save("valid-unused", LocalDateTime.now().plusHours(1), false);

        assertThat(invitationTokenRepository.findAllByLinkExpiresAtBeforeAndIsUsedFalse(LocalDateTime.now()))
                .extracting(InvitationToken::getId)
                .containsExactly(expiredUnused.getId());
    }

    @Test
    void resolvesStoredDigestAndPersistsSingleUseLifecycle() {
        InvitationToken token = save("sha256-digest", LocalDateTime.now().plusHours(1), false);

        InvitationToken loaded = invitationTokenRepository.findByTokenHash("sha256-digest").orElseThrow();
        loaded.setUsed(true);
        invitationTokenRepository.saveAndFlush(loaded);

        assertThat(invitationTokenRepository.findByTokenHash("sha256-digest").orElseThrow().isUsed()).isTrue();
        assertThat(token.isUsed()).isTrue();
    }

    private InvitationToken save(String tokenHash, LocalDateTime expiresAt, boolean used) {
        InvitationToken token = new InvitationToken();
        token.setUser(driver);
        token.setTokenHash(tokenHash);
        token.setLinkExpiresAt(expiresAt);
        token.setUsed(used);
        return invitationTokenRepository.saveAndFlush(token);
    }
}
