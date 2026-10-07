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
@Table(name = "resolutions")
public class Resolution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(name = "report_id", length = 36)
    private String reportId;

    @Column(name = "authority_id", length = 36)
    private String authorityId;

    @Builder.Default
    @Column(columnDefinition = "TEXT")
    private String note = "";

    @Builder.Default
    @Column(length = 500)
    private String imageUrl = "";

    @Builder.Default
    private Instant resolvedAt = Instant.now();
}
