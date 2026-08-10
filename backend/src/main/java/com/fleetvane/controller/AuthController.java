package com.fleetvane.controller;

import com.fleetvane.dto.AuthResponse;
import com.fleetvane.dto.LoginRequest;
import com.fleetvane.dto.SignupRequest;
import com.fleetvane.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request.getEmail(), request.getPassword()));
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.signup(request.getEmail(), request.getPassword(), request.getName(), request.getRole()));
    }
}
