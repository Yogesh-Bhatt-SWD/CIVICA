package com.civica.service;

import com.civica.dto.common.PaginationMeta;
import com.civica.exception.BadRequestException;
import com.civica.exception.ForbiddenException;
import com.civica.exception.ResourceNotFoundException;
import com.civica.model.GeoJsonPoint;
import com.civica.model.Report;
import com.civica.model.User;
import com.civica.repository.ReportRepository;
import com.civica.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;

/**
 * Core service for report CRUD operations, AI validation, geospatial
 * duplicate detection, file upload, and gravity score management.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final AiIntegrationService aiIntegrationService;
    private final GravityScoreService gravityScoreService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    // ─── Categories ────────────────────────────────────────────────

    public List<String> getCategories() {
        return aiIntegrationService.getCategories();
    }

    // ─── AI Image Validation (proxy) ───────────────────────────────

    public Map<String, Object> validateImage(MultipartFile image, String category) {
        return aiIntegrationService.validateImage(image, category);
    }

    // ─── Create Report ─────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Map<String, Object> createReport(String title, String description, String category,
                                             String latitude, String longitude,
                                             String address, String state, String severity,
                                             MultipartFile image, String userId) {
        if (title == null || title.isBlank() || category == null || category.isBlank()
                || latitude == null || longitude == null) {
            throw new BadRequestException("Title, category and location are required.");
        }

        String imageUrl = "";
        Map<String, Object> aiData = Map.of("valid", false, "message", "AI Service Offline");
        boolean aiValidated = false;

        // Step 1: Handle image upload + AI validation
        if (image != null && !image.isEmpty()) {
            // AI Validation BEFORE file save
            try {
                aiData = aiIntegrationService.validateImage(image, category);
                aiValidated = Boolean.TRUE.equals(aiData.get("valid"));

                // Strict rejection ONLY if AI is UP and it explicitly rejected
                if (!aiValidated && !Boolean.TRUE.equals(aiData.get("isDown"))) {
                    log.warn("[AI REJECTED] Category: {}, Message: {}", category, aiData.get("message"));
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("rejected", true);
                    result.put("error", aiData.getOrDefault("message",
                            "AI could not validate this image for the selected category."));
                    result.put("aiData", aiData);
                    return result;
                }

                if (Boolean.TRUE.equals(aiData.get("isDown"))) {
                    log.warn("[AI OFFLINE] Allowing manual submission for {}", category);
                } else {
                    log.info("AI VALIDATED: {} (conf: {})", category, aiData.get("confidence"));
                }
            } catch (Exception e) {
                log.error("AI service error: {}", e.getMessage());
                aiData = Map.of("valid", false,
                        "message", "AI validation service is currently offline. Manual review required.",
                        "isDown", true, "confidence", 0.0);
            }

            // File storage
            imageUrl = saveUploadedFile(image);
        } else {
            throw new BadRequestException("An image is required for AI validation.");
        }

        double lng = Double.parseDouble(longitude);
        double lat = Double.parseDouble(latitude);

        // Step 2: Geospatial duplicate detection (100m radius, same category)
        List<Report> duplicates = reportRepository.findNearbyDuplicates(lng, lat, 100, category);
        if (!duplicates.isEmpty()) {
            Report duplicate = duplicates.get(0);
            boolean alreadyUpvoted = duplicate.getUpvotedBy() != null
                    && duplicate.getUpvotedBy().contains(userId);
            if (!alreadyUpvoted) {
                duplicate.setUpvotes(duplicate.getUpvotes() + 1);
                if (duplicate.getUpvotedBy() == null) {
                    duplicate.setUpvotedBy(new ArrayList<>());
                }
                duplicate.getUpvotedBy().add(userId);
            }
            duplicate.setGravityScore(gravityScoreService.calculate(duplicate));
            reportRepository.save(duplicate);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("duplicate", true);
            result.put("message", "Similar issue already reported nearby. Your upvote has been added!");
            result.put("data", toResponseMap(duplicate));
            return result;
        }

        // Step 3: Parse severity and apply smart detection
        int severityNum = 3;
        if (severity != null && !severity.isBlank()) {
            try {
                severityNum = Math.min(5, Math.max(1, Integer.parseInt(severity)));
            } catch (NumberFormatException ignored) {}
        }

        // Smart Severity: boost if AI bounding box is large or confidence is high
        Object bbObj = aiData.get("boundingBox");
        if (bbObj instanceof List) {
            List<?> bb = (List<?>) bbObj;
            if (bb.size() == 4) {
                try {
                    double x1 = ((Number) bb.get(0)).doubleValue();
                    double y1 = ((Number) bb.get(1)).doubleValue();
                    double x2 = ((Number) bb.get(2)).doubleValue();
                    double y2 = ((Number) bb.get(3)).doubleValue();
                    double area = (x2 - x1) * (y2 - y1);
                    Object confObj = aiData.get("confidence");
                    double conf = confObj instanceof Number ? ((Number) confObj).doubleValue() : 0;
                    if (area > 0.15 || conf > 0.80) {
                        severityNum = 5;
                    }
                } catch (Exception ignored) {}
            }
        }

        // Step 4: Build and save report
        Double aiConfidence = null;
        Object confObj = aiData.get("confidence");
        if (confObj instanceof Number) {
            aiConfidence = ((Number) confObj).doubleValue();
        }

        List<Double> aiBoundingBox = null;
        if (bbObj instanceof List) {
            try {
                List<?> bbRaw = (List<?>) bbObj;
                aiBoundingBox = new ArrayList<>();
                for (Object v : bbRaw) {
                    aiBoundingBox.add(((Number) v).doubleValue());
                }
            } catch (Exception ignored) {}
        }

        Report newReport = Report.builder()
                .title(title.trim())
                .description(description != null ? description.trim() : "")
                .category(category)
                .imageUrl(imageUrl)
                .location(new GeoJsonPoint(lng, lat))
                .address(address != null ? address.trim() : "")
                .state(state != null ? state.trim() : "")
                .severity(severityNum)
                .submittedBy(userId)
                .aiValidated(aiValidated)
                .aiConfidence(aiConfidence)
                .aiBoundingBox(aiBoundingBox)
                .createdAt(Instant.now())
                .build();

        newReport.setGravityScore(gravityScoreService.calculate(newReport));
        reportRepository.save(newReport);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("duplicate", false);
        result.put("message", "Report submitted successfully.");
        result.put("data", toResponseMap(newReport));
        return result;
    }

    // ─── Get Reports (paginated, filtered) ─────────────────────────

    public Map<String, Object> getReports(String status, String category, String severity,
                                           int page, int limit, String role) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "gravityScore"));
        Page<Report> result;

        boolean isCitizen = "citizen".equals(role);

        if (status != null && !status.isBlank() && category != null && !category.isBlank()) {
            result = reportRepository.findByStatusAndCategory(status, category, pageable);
        } else if (status != null && !status.isBlank()) {
            result = reportRepository.findByStatus(status, pageable);
        } else if (category != null && !category.isBlank()) {
            if (isCitizen) {
                result = reportRepository.findByStatusNotAndCategory("resolved", category, pageable);
            } else {
                result = reportRepository.findByCategory(category, pageable);
            }
        } else if (isCitizen) {
            result = reportRepository.findByStatusNot("resolved", pageable);
        } else {
            result = reportRepository.findAll(pageable);
        }

        List<Map<String, Object>> populated = result.getContent().stream()
                .map(this::toResponseMap).toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("data", populated);
        response.put("pagination", PaginationMeta.builder()
                .total(result.getTotalElements())
                .page(page)
                .pages(result.getTotalPages())
                .limit(limit)
                .hasNext(result.hasNext())
                .hasPrev(result.hasPrevious())
                .build());
        return response;
    }

    // ─── Get My Reports ────────────────────────────────────────────

    public Map<String, Object> getMyReports(String userId, String role, int page, int limit, String status) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Report> result;

        if (status != null && !status.isBlank()) {
            result = reportRepository.findBySubmittedByAndStatus(userId, status, pageable);
        } else if ("citizen".equals(role)) {
            result = reportRepository.findBySubmittedByAndStatusNot(userId, "resolved", pageable);
        } else {
            result = reportRepository.findBySubmittedBy(userId, pageable);
        }

        List<Map<String, Object>> populated = result.getContent().stream()
                .map(this::toResponseMap).toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("data", populated);
        response.put("pagination", PaginationMeta.builder()
                .total(result.getTotalElements())
                .page(page)
                .pages(result.getTotalPages())
                .hasNext(result.hasNext())
                .hasPrev(result.hasPrevious())
                .build());
        return response;
    }

    // ─── Get Report By ID ──────────────────────────────────────────

    public Map<String, Object> getReportById(String id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found."));
        return toResponseMap(report);
    }

    // ─── Upvote Toggle ─────────────────────────────────────────────

    public Map<String, Object> upvoteReport(String reportId, String userId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found."));

        List<String> upvotedBy = report.getUpvotedBy();
        if (upvotedBy == null) {
            upvotedBy = new ArrayList<>();
            report.setUpvotedBy(upvotedBy);
        }

        boolean alreadyUpvoted = upvotedBy.contains(userId);
        if (alreadyUpvoted) {
            upvotedBy.remove(userId);
            report.setUpvotes(Math.max(0, report.getUpvotes() - 1));
        } else {
            upvotedBy.add(userId);
            report.setUpvotes(report.getUpvotes() + 1);
        }

        report.setGravityScore(gravityScoreService.calculate(report));
        reportRepository.save(report);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("upvotes", report.getUpvotes());
        result.put("gravityScore", report.getGravityScore());
        result.put("hasUpvoted", !alreadyUpvoted);
        return result;
    }

    // ─── Delete Report ─────────────────────────────────────────────

    public void deleteReport(String reportId, String userId, String role) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found."));

        if (!report.getSubmittedBy().equals(userId) && !"admin".equals(role)) {
            throw new ForbiddenException("You can only delete your own reports.");
        }

        reportRepository.delete(report);
    }

    // ─── Recalculate Gravity Scores ────────────────────────────────

    public int recalculateScores() {
        List<Report> reports = reportRepository.findByStatusNot("resolved",
                PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        for (Report report : reports) {
            report.setGravityScore(gravityScoreService.calculate(report));
            reportRepository.save(report);
        }
        return reports.size();
    }

    // ─── Response Mapper ───────────────────────────────────────────

    /**
     * Converts a Report to a Map matching the frontend's expected JSON structure.
     * Populates submittedBy / assignedTo with user data (name, email).
     * Uses _id instead of id to match the Mongoose/Node.js format the frontend expects.
     */
    public Map<String, Object> toResponseMap(Report report) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("_id", report.getId());
        map.put("title", report.getTitle());
        map.put("description", report.getDescription());
        map.put("category", report.getCategory());
        map.put("imageUrl", report.getImageUrl());

        // Location as GeoJSON
        if (report.getLocation() != null) {
            Map<String, Object> location = new LinkedHashMap<>();
            location.put("type", report.getLocation().getType());
            location.put("coordinates", report.getLocation().getCoordinates());
            map.put("location", location);
        }

        map.put("address", report.getAddress());
        map.put("state", report.getState());
        map.put("status", report.getStatus());
        map.put("severity", report.getSeverity());
        map.put("upvotes", report.getUpvotes());
        map.put("upvotedBy", report.getUpvotedBy());
        map.put("gravityScore", report.getGravityScore());
        map.put("isDuplicate", report.getIsDuplicate());
        map.put("mergedWith", report.getMergedWith());

        // Populate submittedBy
        if (report.getSubmittedBy() != null) {
            userRepository.findById(report.getSubmittedBy()).ifPresentOrElse(
                    user -> map.put("submittedBy", userInfoMap(user)),
                    () -> map.put("submittedBy", report.getSubmittedBy())
            );
        }

        // Populate assignedTo
        if (report.getAssignedTo() != null) {
            userRepository.findById(report.getAssignedTo()).ifPresentOrElse(
                    user -> map.put("assignedTo", userInfoMap(user)),
                    () -> map.put("assignedTo", report.getAssignedTo())
            );
        }

        map.put("aiValidated", report.getAiValidated());
        map.put("aiConfidence", report.getAiConfidence());
        map.put("aiBoundingBox", report.getAiBoundingBox());
        map.put("estimatedDays", report.getEstimatedDays());
        map.put("createdAt", report.getCreatedAt());

        return map;
    }

    // ─── Private Helpers ───────────────────────────────────────────

    private Map<String, Object> userInfoMap(User user) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("_id", user.getId());
        info.put("name", user.getName());
        info.put("email", user.getEmail());
        return info;
    }

    private String saveUploadedFile(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalName = file.getOriginalFilename();
            if (originalName == null) originalName = "upload";
            String safeName = originalName.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
            String fileName = System.currentTimeMillis() + "_" + safeName;

            Path targetPath = uploadPath.resolve(fileName);
            file.transferTo(targetPath.toFile());

            return "http://localhost:5000/uploads/" + fileName;
        } catch (IOException e) {
            log.error("Failed to save uploaded file: {}", e.getMessage());
            throw new BadRequestException("Failed to save uploaded file.");
        }
    }
}
