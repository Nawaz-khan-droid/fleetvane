package com.fleetvane.auth.repository;

import com.fleetvane.auth.entity.InvitationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationTokenRepository extends JpaRepository<InvitationToken, Long> {
    Optional<InvitationToken> findByTokenHash(String tokenHash);
    List<InvitationToken> findAllByLinkExpiresAtBeforeAndIsUsedFalse(LocalDateTime dateTime);
}
