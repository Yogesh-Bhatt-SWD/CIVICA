package com.civica.controller;

import com.civica.dto.auth.AuthResponse;
import com.civica.dto.auth.LoginRequest;
import com.civica.dto.auth.RegisterRequest;
import com.civica.dto.common.ApiResponse;
import com.civica.model.User;
import com.civica.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User registration and login")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse data = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<AuthResponse>builder()
                        .success(true)
                        .message("Registration successful.")
                        .data(data)
                        .build());
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse data = authService.login(request);
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Login successful.")
                .data(data)
                .build());
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Object>> getMe(Authentication authentication) {
        Map<String, String> userInfo = (Map<String, String>) authentication.getPrincipal();
        User user = authService.getMe(userInfo.get("id"));

        // Return without password
        Map<String, Object> userData = Map.of(
                "_id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "createdAt", user.getCreatedAt()
        );
        return ResponseEntity.ok(ApiResponse.success(userData));
    }
}
