package com.fleetvane.auth.service;

import com.fleetvane.auth.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private User testUser;

    @BeforeEach
    void setUp() {
        String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
        long expirationMs = 3600000;
        jwtService = new JwtService(secret, expirationMs);

        testUser = new User();
        testUser.setId(100L);
        testUser.setName("Test User");
        testUser.setEmail("test@fleetvane.com");
        testUser.setRole("DRIVER");
    }

    @Test
    void testGenerateAccessTokenAndExtractUserId() {
        String token = jwtService.generateToken(testUser);
        assertNotNull(token);
        
        Long userId = jwtService.extractUserId(token);
        assertEquals(100L, userId);
        
        String role = jwtService.extractRole(token);
        assertEquals("DRIVER", role);
        
        String email = jwtService.extractUsername(token);
        assertEquals("test@fleetvane.com", email);
    }
}
