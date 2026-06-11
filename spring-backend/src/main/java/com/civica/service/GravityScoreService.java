package com.civica.service;

import com.civica.model.Report;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/**
 * Port of gravityScore.js:
 * score = (severity * 10) + (upvotes * 2) + (daysElapsed * 0.5)
 */
@Service
public class GravityScoreService {

    public double calculate(Report report) {
        double severity = report.getSeverity() != null ? report.getSeverity() : 3;
        double upvotes = report.getUpvotes() != null ? report.getUpvotes() : 0;

        Instant createdAt = report.getCreatedAt() != null ? report.getCreatedAt() : Instant.now();
        double daysElapsed = Duration.between(createdAt, Instant.now()).toMillis() / (1000.0 * 60 * 60 * 24);

        double score = (severity * 10) + (upvotes * 2) + (daysElapsed * 0.5);
        return Math.round(score * 10.0) / 10.0;
    }
}
