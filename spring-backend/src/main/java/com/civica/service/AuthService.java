package com.civica.service;

import com.civica.dto.auth.AuthResponse;
import com.civica.dto.auth.LoginRequest;
import com.civica.dto.auth.RegisterRequest;
import com.civica.exception.BadRequestException;
import com.civica.exception.ConflictException;
import com.civica.exception.ResourceNotFoundException;
import com.civica.model.User;
import com.civica.repository.UserRepository;
import com.civica.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        log.info("Registration attempt: name={}, email={}, role={}", request.getName(), email, request.getRole());

        if (userRepository.existsByEmail(email)) {
            log.info("Registration failed: Email already exists");
            throw new ConflictException("Email already registered.");
        }

        // Only allow citizen/authority on self-registration; admin must be set manually
        List<String> allowedRoles = List.of("citizen", "authority");
        String role = allowedRoles.contains(request.getRole()) ? request.getRole() : "citizen";

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        user = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user.getId(), user.getRole(), user.getName(), user.getEmail());

        log.info("Registration successful: {} (normalized)", email);

        return AuthResponse.builder()
                .token(token)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        log.info("Login attempt: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.info("Login failed: User not found ({})", email);
                    return new ResourceNotFoundException("User not found.");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.info("Login failed: Password mismatch for {}", email);
            throw new BadRequestException("Invalid credentials.");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getRole(), user.getName(), user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .build();
    }

    public User getMe(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }
}
