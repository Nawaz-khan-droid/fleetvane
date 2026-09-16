package com.fleetvane.auth.service;

import com.fleetvane.auth.config.JwtAuthFilter;
import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

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

    @Test
    void testJwtFilterClearsStaleAuthenticationForInvalidToken() throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        JwtAuthFilter filter = new JwtAuthFilter(jwtService, userRepository);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("stale-user", null, List.of())
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        SecurityContextHolder.clearContext();
    }
}
