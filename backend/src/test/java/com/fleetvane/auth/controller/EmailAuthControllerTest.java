package com.fleetvane.auth.controller;

import com.fleetvane.auth.dto.ActivateAccountRequest;
import com.fleetvane.auth.dto.InviteDriverRequest;
import com.fleetvane.auth.entity.InvitationToken;
import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.InvitationTokenRepository;
import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.auth.security.InvitationTokenHasher;
import com.fleetvane.driver.repository.DriverProfileRepository;
import com.fleetvane.shared.exception.BusinessException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailAuthControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private InvitationTokenRepository tokenRepository;
    @Mock private DriverProfileRepository driverProfileRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private EmailAuthController controller;
    private User manager;

    @BeforeEach
    void setUp() {
        controller = new EmailAuthController(userRepository, tokenRepository, driverProfileRepository, passwordEncoder);
        manager = new User("manager@carrier.test", "hash", "Manager", "MANAGER");
        manager.setId(101L);
        manager.setCompanyId(77L);
        manager.setStatus("ACTIVE");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("101", null,
                        List.of(new SimpleGrantedAuthority("MANAGER"))));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void invitationUsesManagerCompanyAndPersistsOnlyTokenDigest() {
        when(userRepository.findById(101L)).thenReturn(Optional.of(manager));
        when(userRepository.existsByEmailIgnoreCase("driver@carrier.test")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("temporary-password-hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User driver = invocation.getArgument(0);
            driver.setId(202L);
            return driver;
        });

        controller.inviteDriver(new InviteDriverRequest(
                "Driver Name", "Driver@Carrier.Test", "+91 9876543210", "LIC-123", 9L));

        ArgumentCaptor<User> driverCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(driverCaptor.capture());
        assertThat(driverCaptor.getValue().getCompanyId()).isEqualTo(77L);
        assertThat(driverCaptor.getValue().getEmail()).isEqualTo("driver@carrier.test");

        ArgumentCaptor<InvitationToken> tokenCaptor = ArgumentCaptor.forClass(InvitationToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        assertThat(tokenCaptor.getValue().getTokenHash()).matches("[0-9a-f]{64}");
        assertThat(tokenCaptor.getValue().getTokenHash()).doesNotContain("driver@carrier.test");
    }

    @Test
    void duplicateEmailIsRejectedBeforeProvisioningDriver() {
        when(userRepository.findById(101L)).thenReturn(Optional.of(manager));
        when(userRepository.existsByEmailIgnoreCase("driver@carrier.test")).thenReturn(true);

        BusinessException exception = assertThrows(BusinessException.class, () -> controller.inviteDriver(
                new InviteDriverRequest("Driver", "driver@carrier.test", "+91 9876543210", "LIC-123", null)));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(userRepository, never()).save(any(User.class));
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void activationHashesSuppliedTokenAndConsumesItOnce() {
        String rawToken = "a".repeat(64);
        User driver = new User("driver@carrier.test", "temporary", "Driver", "DRIVER");
        driver.setStatus("PENDING_ACTIVATION");
        InvitationToken invitation = new InvitationToken();
        invitation.setUser(driver);
        invitation.setTokenHash(InvitationTokenHasher.sha256(rawToken));
        invitation.setLinkExpiresAt(LocalDateTime.now().plusHours(1));
        when(tokenRepository.findByTokenHash(InvitationTokenHasher.sha256(rawToken)))
                .thenReturn(Optional.of(invitation));
        when(passwordEncoder.encode("StrongPass1")).thenReturn("new-password-hash");

        var response = controller.activateAccount(new ActivateAccountRequest(rawToken, "StrongPass1"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(invitation.isUsed()).isTrue();
        assertThat(driver.getStatus()).isEqualTo("ACTIVE");
        verify(tokenRepository).findByTokenHash(eq(InvitationTokenHasher.sha256(rawToken)));
        verify(tokenRepository).save(invitation);
    }

    @Test
    void expiredInvitationCannotActivateDriver() {
        String rawToken = "b".repeat(64);
        User driver = new User("driver@carrier.test", "temporary", "Driver", "DRIVER");
        InvitationToken invitation = new InvitationToken();
        invitation.setUser(driver);
        invitation.setLinkExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(tokenRepository.findByTokenHash(InvitationTokenHasher.sha256(rawToken)))
                .thenReturn(Optional.of(invitation));

        var response = controller.activateAccount(new ActivateAccountRequest(rawToken, "StrongPass1"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(userRepository, never()).save(any(User.class));
        verify(tokenRepository, never()).save(any());
    }
}
