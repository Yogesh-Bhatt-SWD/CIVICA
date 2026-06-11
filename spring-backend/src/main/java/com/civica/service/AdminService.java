package com.civica.service;

import com.civica.dto.common.PaginationMeta;
import com.civica.exception.BadRequestException;
import com.civica.exception.ResourceNotFoundException;
import com.civica.model.Report;
import com.civica.model.Resolution;
import com.civica.model.User;
import com.civica.repository.ReportRepository;
import com.civica.repository.ResolutionRepository;
import com.civica.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final ResolutionRepository resolutionRepository;
    private final GravityScoreService gravityScoreService;
    private final ReportService reportService;
    private final MongoTemplate mongoTemplate;

    public Map<String, Object> getUsers(String role, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> result;

        if (role != null && !role.isBlank()) {
            result = userRepository.findByRole(role, pageable);
        } else {
            result = userRepository.findAll(pageable);
        }

        // Map users to response format with _id field
        List<Map<String, Object>> users = result.getContent().stream().map(u -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("role", u.getRole());
            map.put("avatar", u.getAvatar());
            map.put("createdAt", u.getCreatedAt());
            return map;
        }).toList();

        Map<String, Object> response = new HashMap<>();
        response.put("data", users);
        response.put("pagination", PaginationMeta.builder()
                .total(result.getTotalElements())
                .page(page)
                .pages(result.getTotalPages())
                .build());
        return response;
    }

    public User updateUserRole(String userId, String newRole, String adminId) {
        if (!List.of("citizen", "authority", "admin").contains(newRole)) {
            throw new BadRequestException("Invalid role.");
        }
        if (userId.equals(adminId)) {
            throw new BadRequestException("Cannot change your own role.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        user.setRole(newRole);
        return userRepository.save(user);
    }

    public void deleteUser(String userId, String adminId) {
        if (userId.equals(adminId)) {
            throw new BadRequestException("Cannot delete yourself.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        userRepository.delete(user);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getAnalytics() {
        long totalReports = reportRepository.count();
        long resolvedCount = reportRepository.countByStatus("resolved");
        long pendingCount = reportRepository.countByStatus("pending");
        long inProgressCount = reportRepository.countByStatus("in_progress");

        // Reports by category aggregation
        Aggregation catAgg = Aggregation.newAggregation(
                Aggregation.group("category").count().as("count"),
                Aggregation.project("count").and("_id").as("category")
        );
        List<Map> catResults = mongoTemplate.aggregate(catAgg, "reports", Map.class).getMappedResults();
        List<Map<String, Object>> reportsByCategory = catResults.stream().map(m -> {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("category", m.get("category"));
            r.put("count", m.get("count"));
            return r;
        }).toList();

        // Reports by status aggregation
        Aggregation statusAgg = Aggregation.newAggregation(
                Aggregation.group("status").count().as("count"),
                Aggregation.project("count").and("_id").as("status")
        );
        List<Map> statusResults = mongoTemplate.aggregate(statusAgg, "reports", Map.class).getMappedResults();
        List<Map<String, Object>> reportsByStatus = statusResults.stream().map(m -> {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("status", m.get("status"));
            r.put("count", m.get("count"));
            return r;
        }).toList();

        // Top reported areas
        Aggregation areaAgg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("address").ne("")),
                Aggregation.group("address").count().as("count"),
                Aggregation.project("count").and("_id").as("address"),
                Aggregation.sort(Sort.Direction.DESC, "count"),
                Aggregation.limit(5)
        );
        List<Map> areaResults = mongoTemplate.aggregate(areaAgg, "reports", Map.class).getMappedResults();
        List<Map<String, Object>> topReportedAreas = areaResults.stream().map(m -> {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("address", m.get("address"));
            r.put("count", m.get("count"));
            return r;
        }).toList();

        // Average resolution time
        double avgResolutionTime = 0;
        List<Resolution> resolutions = resolutionRepository.findAll();
        if (!resolutions.isEmpty()) {
            List<String> reportIds = resolutions.stream().map(Resolution::getReportId).toList();
            List<Report> resolvedReports = reportRepository.findAllById(reportIds);
            Map<String, Instant> reportCreatedMap = new HashMap<>();
            resolvedReports.forEach(r -> reportCreatedMap.put(r.getId(), r.getCreatedAt()));

            double totalDays = 0;
            int count = 0;
            for (Resolution res : resolutions) {
                Instant created = reportCreatedMap.get(res.getReportId());
                if (created != null && res.getResolvedAt() != null) {
                    double days = Duration.between(created, res.getResolvedAt()).toMillis() / (1000.0 * 60 * 60 * 24);
                    totalDays += days;
                    count++;
                }
            }
            if (count > 0) {
                avgResolutionTime = Math.round((totalDays / count) * 10.0) / 10.0;
            }
        }

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("totalReports", totalReports);
        analytics.put("resolvedCount", resolvedCount);
        analytics.put("pendingCount", pendingCount);
        analytics.put("inProgressCount", inProgressCount);
        analytics.put("avgResolutionTime", avgResolutionTime);
        analytics.put("reportsByCategory", reportsByCategory);
        analytics.put("reportsByStatus", reportsByStatus);
        analytics.put("topReportedAreas", topReportedAreas);
        return analytics;
    }

    public Map<String, Object> updateReportStatus(String reportId, String status, String note,
                                                    String imageUrl, Integer estimatedDays, String adminId) {
        if (status == null || !List.of("in_progress", "resolved").contains(status)) {
            throw new BadRequestException("Status must be in_progress or resolved.");
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found."));

        report.setStatus(status);
        report.setAssignedTo(adminId);
        if (estimatedDays != null) {
            report.setEstimatedDays(estimatedDays);
        }
        report.setGravityScore(gravityScoreService.calculate(report));
        reportRepository.save(report);

        Resolution resolution = null;
        if ("resolved".equals(status)) {
            resolution = Resolution.builder()
                    .reportId(report.getId())
                    .authorityId(adminId)
                    .note(note != null ? note : "")
                    .imageUrl(imageUrl != null ? imageUrl : "")
                    .build();
            resolutionRepository.save(resolution);
        }

        Map<String, Object> populated = reportService.toResponseMap(
                reportRepository.findById(report.getId()).orElse(report));

        Map<String, Object> result = new HashMap<>();
        result.put("data", populated);
        result.put("resolution", resolution);
        return result;
    }
}
