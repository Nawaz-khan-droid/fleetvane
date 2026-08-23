package com.fleetvane.auth.service;

import com.fleetvane.auth.dto.AuthResponse;
import com.fleetvane.auth.dto.LoginRequest;
import com.fleetvane.auth.dto.SignupRequest;
import com.fleetvane.auth.entity.RefreshToken;
import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.RefreshTokenRepository;
import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.shared.exception.BusinessException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final long refreshTokenDurationMs;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       @Value("${fleetvane.jwt.refresh-token-expiration-ms}") long refreshTokenDurationMs) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenDurationMs = refreshTokenDurationMs;
    }

    @Transactional
    public AuthResult signup(SignupRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new BusinessException("Email already in use", HttpStatus.CONFLICT);
        }

        String requestedRole = (request.role() != null && !request.role().isBlank()) ? request.role().toUpperCase() : "CLIENT";

        if (!"CLIENT".equals(requestedRole) && userRepository.count() > 0) {
            throw new BusinessException(
                    "Self-registration for role '" + requestedRole + "' is forbidden. Public registration is restricted to CLIENT.",
                    HttpStatus.FORBIDDEN
            );
        }

        String assignedRole = userRepository.count() == 0 ? ("ADMIN".equals(requestedRole) ? "ADMIN" : "MANAGER") : "CLIENT";

        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.name(),
                assignedRole
        );

        User savedUser = userRepository.save(user);
        return authenticateAndGenerateTokens(savedUser);
    }

    @Transactional
    public AuthResponse provisionUser(SignupRequest request, String targetRole) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new BusinessException("Email already in use", HttpStatus.CONFLICT);
        }

        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.name(),
                targetRole
        );

        User savedUser = userRepository.save(user);
        return new AuthResponse(
                null,
                new AuthResponse.UserDto(savedUser.getId(), savedUser.getEmail(), savedUser.getName(), savedUser.getRole())
        );
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException("Invalid credentials", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new BusinessException("Account is deactivated", HttpStatus.FORBIDDEN);
        }

        return authenticateAndGenerateTokens(user);
    }

    @Transactional
    public AuthService.AuthResult refresh(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        if (refreshToken.getRevokedAt() != null) {
            refreshTokenRepository.revokeFamily(refreshToken.getFamilyId(), Instant.now());
            throw new BusinessException("Token reuse detected. Family revoked.", HttpStatus.UNAUTHORIZED);
        }

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException("Refresh token expired", HttpStatus.UNAUTHORIZED);
        }

        if (Boolean.FALSE.equals(refreshToken.getUser().getIsActive())) {
            throw new BusinessException("Account is deactivated", HttpStatus.FORBIDDEN);
        }

        refreshToken.setRevokedAt(Instant.now());
        
        String newRawRefreshToken = UUID.randomUUID().toString();
        String newTokenHash = hashToken(newRawRefreshToken);
        
        RefreshToken newRefreshToken = new RefreshToken(
                UUID.randomUUID(),
                refreshToken.getUser(),
                newTokenHash,
                refreshToken.getFamilyId(),
                Instant.now().plusMillis(refreshTokenDurationMs)
        );
                
        refreshTokenRepository.save(newRefreshToken);
        refreshToken.setReplacedBy(newRefreshToken.getId());
        refreshTokenRepository.save(refreshToken);

        String accessToken = jwtService.generateToken(refreshToken.getUser());

        AuthResponse response = new AuthResponse(
                accessToken,
                new AuthResponse.UserDto(
                        refreshToken.getUser().getId(),
                        refreshToken.getUser().getEmail(),
                        refreshToken.getUser().getName(),
                        refreshToken.getUser().getRole()
                )
        );
        
        return new AuthService.AuthResult(response, newRawRefreshToken);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        
        String tokenHash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        });
    }

    public AuthResult authenticateAndGenerateTokens(User user) {
        String accessToken = jwtService.generateToken(user);
        
        String rawRefreshToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawRefreshToken);
        
        RefreshToken refreshToken = new RefreshToken(
                UUID.randomUUID(),
                user,
                tokenHash,
                UUID.randomUUID(),
                Instant.now().plusMillis(refreshTokenDurationMs)
        );
                
        refreshTokenRepository.save(refreshToken);

        AuthResponse response = new AuthResponse(
                accessToken,
                new AuthResponse.UserDto(user.getId(), user.getEmail(), user.getName(), user.getRole())
        );

        return new AuthResult(response, rawRefreshToken);
    }
    
    public record AuthResult(AuthResponse response, String rawRefreshToken) {}

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
