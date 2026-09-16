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
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        AuthService.AuthResult result = authService.signup(request);
        setRefreshTokenCookie(httpRequest, response, result.rawRefreshToken());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        AuthService.AuthResult result = authService.login(request);
        setRefreshTokenCookie(httpRequest, response, result.rawRefreshToken());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        Cookie cookie = WebUtils.getCookie(request, "refresh_token");
        if (cookie == null || cookie.getValue() == null || cookie.getValue().isBlank()) {
            return ResponseEntity.status(401).build();
        }

        AuthService.AuthResult result = authService.refresh(cookie.getValue());
        setRefreshTokenCookie(request, response, result.rawRefreshToken());
        return ResponseEntity.ok(result.response());
    }
    
    private void setRefreshTokenCookie(HttpServletRequest request, HttpServletResponse response, String refreshToken) {
        boolean secure = request.isSecure() || "https".equalsIgnoreCase(request.getScheme());
        StringBuilder cookieHeader = new StringBuilder();
        cookieHeader.append("refresh_token=").append(refreshToken)
                .append("; Max-Age=").append(7 * 24 * 60 * 60)
                .append("; Path=/; HttpOnly; SameSite=Lax");

        if (secure) {
            cookieHeader.append("; Secure");
        }

        response.addHeader("Set-Cookie", cookieHeader.toString());
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
