package com.fleetvane.auth.controller;

import com.fleetvane.auth.dto.AuthResponse;
import com.fleetvane.auth.dto.LoginRequest;
import com.fleetvane.auth.dto.SignupRequest;
import com.fleetvane.auth.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.WebUtils;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request, HttpServletResponse response) {
        AuthService.AuthResult result = authService.signup(request);
        setRefreshTokenCookie(response, result.rawRefreshToken());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthService.AuthResult result = authService.login(request);
        setRefreshTokenCookie(response, result.rawRefreshToken());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        Cookie cookie = WebUtils.getCookie(request, "refresh_token");
        if (cookie == null || cookie.getValue() == null || cookie.getValue().isBlank()) {
            return ResponseEntity.status(401).build();
        }

        AuthService.AuthResult result = authService.refresh(cookie.getValue());
        setRefreshTokenCookie(response, result.rawRefreshToken());
        return ResponseEntity.ok(result.response());
    }
    
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie("refresh_token", refreshToken);
        cookie.setHttpOnly(true);
        // In development, Secure+SameSite=None is required for cross-origin credentials to work properly
        // between localhost:5173 (frontend) and localhost:8080 (backend) in some browsers,
        // or Lax if they are treated as same-site. We will use Lax for now, but if issues arise, None + Secure.
        // For simplicity and broad compatibility on localhost, we'll use Path=/ and HttpOnly.
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
        
        // Hardcode attributes that javax.servlet.http.Cookie lacks direct setters for
        response.addHeader("Set-Cookie", String.format(
            "%s=%s; Max-Age=%d; Path=/; HttpOnly; SameSite=Lax",
            "refresh_token", refreshToken, 7 * 24 * 60 * 60
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        Cookie cookie = WebUtils.getCookie(request, "refresh_token");
        if (cookie != null) {
            authService.logout(cookie.getValue());
        }
        
        Cookie deleteCookie = new Cookie("refresh_token", null);
        deleteCookie.setMaxAge(0);
        deleteCookie.setPath("/");
        deleteCookie.setHttpOnly(true);
        deleteCookie.setSecure(true);
        response.addCookie(deleteCookie);
        
        return ResponseEntity.ok().build();
    }
}
