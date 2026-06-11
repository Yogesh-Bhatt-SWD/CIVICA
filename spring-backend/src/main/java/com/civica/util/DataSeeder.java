package com.civica.util;

import com.civica.model.GeoJsonPoint;
import com.civica.model.Report;
import com.civica.model.User;
import com.civica.repository.ReportRepository;
import com.civica.repository.UserRepository;
import com.civica.service.GravityScoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Seeds the database with sample users and reports on first run.
 * Only runs if no users exist in the database.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final PasswordEncoder passwordEncoder;
    private final GravityScoreService gravityScoreService;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already has data, skipping seed.");
            return;
        }

        log.info("Seeding database with sample data...");

        // Create users
        User citizen = userRepository.save(User.builder()
                .name("Yogesh Bhatt")
                .email("citizen@civica.dev")
                .password(passwordEncoder.encode("password123"))
                .role("citizen")
                .build());

        User authority = userRepository.save(User.builder()
                .name("Authority Officer")
                .email("authority@civica.dev")
                .password(passwordEncoder.encode("password123"))
                .role("authority")
                .build());

        User admin = userRepository.save(User.builder()
                .name("Admin User")
                .email("admin@civica.dev")
                .password(passwordEncoder.encode("password123"))
                .role("admin")
                .build());

        // Create sample reports
        List<Report> reports = List.of(
                Report.builder()
                        .title("Large Pothole on MG Road")
                        .description("Deep pothole near the main intersection causing vehicle damage")
                        .category("Potholes and RoadCracks")
                        .location(new GeoJsonPoint(72.8777, 19.0760))
                        .address("MG Road, Near Signal")
                        .state("Maharashtra")
                        .severity(4)
                        .upvotes(12)
                        .submittedBy(citizen.getId())
                        .status("pending")
                        .createdAt(Instant.now().minusSeconds(86400 * 3))
                        .build(),
                Report.builder()
                        .title("Garbage Dump near Park")
                        .description("Overflowing garbage bins near children's park")
                        .category("Garbage")
                        .location(new GeoJsonPoint(72.8856, 19.0826))
                        .address("Central Park, Andheri")
                        .state("Maharashtra")
                        .severity(3)
                        .upvotes(8)
                        .submittedBy(citizen.getId())
                        .status("in_progress")
                        .assignedTo(authority.getId())
                        .estimatedDays(2)
                        .createdAt(Instant.now().minusSeconds(86400 * 5))
                        .build(),
                Report.builder()
                        .title("Fallen Tree Blocking Road")
                        .description("Large tree fell during storm, blocking entire lane")
                        .category("FallenTrees")
                        .location(new GeoJsonPoint(77.5946, 12.9716))
                        .address("Brigade Road")
                        .state("Karnataka")
                        .severity(5)
                        .upvotes(25)
                        .submittedBy(citizen.getId())
                        .status("pending")
                        .createdAt(Instant.now().minusSeconds(86400))
                        .build(),
                Report.builder()
                        .title("Damaged Street Light Pole")
                        .description("Electric pole leaning dangerously after accident")
                        .category("DamagedElectricalPoles")
                        .location(new GeoJsonPoint(77.2090, 28.6139))
                        .address("Connaught Place")
                        .state("Delhi")
                        .severity(5)
                        .upvotes(18)
                        .submittedBy(citizen.getId())
                        .status("pending")
                        .createdAt(Instant.now().minusSeconds(86400 * 2))
                        .build()
        );

        for (Report report : reports) {
            report.setGravityScore(gravityScoreService.calculate(report));
            reportRepository.save(report);
        }

        log.info("Database seeded successfully!");
        log.info("  Citizens: citizen@civica.dev / password123");
        log.info("  Authority: authority@civica.dev / password123");
        log.info("  Admin: admin@civica.dev / password123");
    }
}
