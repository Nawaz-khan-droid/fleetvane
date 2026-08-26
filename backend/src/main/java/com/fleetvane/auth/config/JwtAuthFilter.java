package com.fleetvane.auth.config;

import com.fleetvane.auth.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final com.fleetvane.auth.repository.UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, com.fleetvane.auth.repository.UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        
        try {
            Long userId = jwtService.extractUserId(jwt);
            String role = jwtService.extractRole(jwt);
            
            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Fetch user to ensure they exist and are active
                var userOpt = userRepository.findById(userId);
                if (userOpt.isPresent() && userOpt.get().getIsActive()) {
                    UserDetails userDetails = new User(String.valueOf(userId), "", 
                        List.of(new SimpleGrantedAuthority(role), new SimpleGrantedAuthority("ROLE_" + role)));
                    
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Token invalid or expired, continue and let Spring Security handle it
        }

        filterChain.doFilter(request, response);
    }
}
