package com.civica.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resolutions")
public class Resolution {

    @Id
    private String id;

    private String reportId;
    private String authorityId;

    @Builder.Default
    private String note = "";

    @Builder.Default
    private String imageUrl = "";

    @Builder.Default
    private Instant resolvedAt = Instant.now();
}
