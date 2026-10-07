package com.civica.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    @Column(length = 500)
    private String imageUrl;

    private Double latitude;
    private Double longitude;

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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_upvotes", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "user_id", length = 36)
    @Builder.Default
    private List<String> upvotedBy = new ArrayList<>();

    @Builder.Default
    private Double gravityScore = 0.0;

    @Builder.Default
    private Boolean isDuplicate = false;

    @Column(length = 36)
    private String mergedWith;

    @Column(length = 36)
    private String submittedBy;

    @Column(length = 36)
    private String assignedTo;

    @Builder.Default
    private Boolean aiValidated = false;

    private Double aiConfidence;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_bounding_boxes", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "coord")
    @OrderColumn(name = "coord_order")
    private List<Double> aiBoundingBox;

    private Integer estimatedDays;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Transient
    public GeoJsonPoint getLocation() {
        if (longitude != null && latitude != null) {
            return new GeoJsonPoint(longitude, latitude);
        }
        return null;
    }

    public void setLocation(GeoJsonPoint location) {
        if (location != null) {
            this.longitude = location.getLongitude();
            this.latitude = location.getLatitude();
        } else {
            this.longitude = null;
            this.latitude = null;
        }
    }

    public static class ReportBuilder {
        public ReportBuilder location(GeoJsonPoint location) {
            if (location != null) {
                this.longitude = location.getLongitude();
                this.latitude = location.getLatitude();
            }
            return this;
        }
    }
}
