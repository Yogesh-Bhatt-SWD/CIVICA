package com.civica.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reports")
public class Report {

    @Id
    private String id;

    private String title;
    private String description;
    private String category;
    private String imageUrl;

    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint location;

    @Builder.Default
    private String address = "";

    @Builder.Default
    private String state = "";

    @Builder.Default
    private String status = "pending";

    @Builder.Default
    private Integer severity = 3;

    @Builder.Default
    private Integer upvotes = 0;

    @Builder.Default
    private List<String> upvotedBy = new ArrayList<>();

    @Builder.Default
    private Double gravityScore = 0.0;

    @Builder.Default
    private Boolean isDuplicate = false;

    private String mergedWith;

    private String submittedBy;

    private String assignedTo;

    @Builder.Default
    private Boolean aiValidated = false;

    private Double aiConfidence;

    private List<Double> aiBoundingBox;

    private Integer estimatedDays;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
