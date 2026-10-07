package com.civica.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = true)
    private String password;

    @Builder.Default
    @Column(nullable = false)
    private String role = "citizen";

    @Builder.Default
    @Column(length = 500)
    private String avatar = "";

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String provider = "local";

    @Column(length = 100)
    private String providerId;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
