package com.bloomscafe.service;

import com.bloomscafe.dto.AuthenticationRequest;
import com.bloomscafe.dto.AuthenticationResponse;
import com.bloomscafe.dto.RegisterRequest;
import com.bloomscafe.entity.User;
import com.bloomscafe.exception.ResourceNotFoundException;
import com.bloomscafe.repository.UserRepository;
import com.bloomscafe.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    public AuthenticationResponse register(RegisterRequest request) {
        // 1. Create a new User entity and hash the password!
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // ENCRYPTING PASSWORD!
        user.setAddress(request.getAddress());
        user.setRole(request.getRole());

        // 2. Save to database
        userRepository.save(user);

        // 3. Generate a JWT token for the new user
        String jwtToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new AuthenticationResponse(jwtToken);
    }

    public AuthenticationResponse login(AuthenticationRequest request) {
        // 1. This method talks to our CustomUserDetailsService behind the scenes to verify the password
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. If the above line didn't throw an error, the user is authenticated! Find them in the DB.
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // 3. Generate and return the token
        String jwtToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new AuthenticationResponse(jwtToken);
    }
}