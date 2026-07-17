package com.bloomscafe.controller;

import com.bloomscafe.dto.AuthenticationRequest;
import com.bloomscafe.dto.AuthenticationResponse;
import com.bloomscafe.dto.RegisterRequest;
import com.bloomscafe.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        // Hands the JSON request to the service, and returns the generated JWT wrapped in a 200 OK response
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
        // Verifies the user and returns the JWT
        return ResponseEntity.ok(authService.login(request));
    }
}