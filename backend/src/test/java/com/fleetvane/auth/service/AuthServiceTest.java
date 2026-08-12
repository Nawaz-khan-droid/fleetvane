package com.fleetvane.auth.service;

import com.fleetvane.auth.dto.AuthResponse;
import com.fleetvane.auth.dto.LoginRequest;
import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.RefreshTokenRepository;
import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.shared.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private JwtService jwtService;

    private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository, 
                refreshTokenRepository, 
                passwordEncoder, 
                jwtService, 
                86400000L
        );
        
        user = new User();
        user.setId(1L);
        user.setEmail("test@fleetvane.com");
        user.setPasswordHash("encoded_password");
        user.setName("Test");
        user.setRole("CLIENT");
    }

    @Test
    void testLogin_Success() {
        LoginRequest request = new LoginRequest("test@fleetvane.com", "password");
        
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "encoded_password")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("mock_jwt_token");
        
        AuthResponse response = authService.login(request);
        
        assertNotNull(response);
        assertEquals("mock_jwt_token", response.accessToken());
        assertEquals(1L, response.user().id());
        assertEquals("CLIENT", response.user().role());
        
        verify(refreshTokenRepository).save(any());
    }

    @Test
    void testLogin_BadCredentials() {
        LoginRequest request = new LoginRequest("test@fleetvane.com", "wrong_password");
        
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong_password", "encoded_password")).thenReturn(false);
        
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            authService.login(request);
        });
        
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("Invalid credentials", exception.getMessage());
        
        verify(jwtService, never()).generateToken(any());
        verify(refreshTokenRepository, never()).save(any());
    }
}
