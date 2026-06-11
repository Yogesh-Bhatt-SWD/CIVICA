package com.civica.controller;

import com.civica.dto.common.ApiResponse;
import com.civica.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Issue report management")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/my")
    @Operation(summary = "Get current user's reports")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> getMyReports(
            Authentication auth,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String status) {
        Map<String, String> user = (Map<String, String>) auth.getPrincipal();
        Map<String, Object> result = reportService.getMyReports(user.get("id"), user.get("role"), page, limit, status);

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("success", true);
        response.put("data", result.get("data"));
        response.put("pagination", result.get("pagination"));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/categories")
    @Operation(summary = "Get available issue categories")
    public ResponseEntity<Map<String, Object>> getCategories() {
        List<String> categories = reportService.getCategories();
        return ResponseEntity.ok(Map.of("success", true, "categories", categories));
    }

    @GetMapping("/recalculate")
    @Operation(summary = "Admin: Recalculate all gravity scores")
    public ResponseEntity<ApiResponse<String>> recalculateScores() {
        int count = reportService.recalculateScores();
        return ResponseEntity.ok(ApiResponse.success(null,
                "Recalculated gravity scores for " + count + " reports."));
    }

    @PostMapping("/validate-image")
    @Operation(summary = "Validate an image via AI service")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> validateImage(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "category", required = false) String category) {
        Map<String, Object> aiData = reportService.validateImage(image, category);

        if (Boolean.TRUE.equals(aiData.get("isDown"))) {
            Map<String, Object> response = new java.util.LinkedHashMap<>();
            response.put("success", false);
            response.put("error", "AI service connection failed");
            response.put("message", aiData.get("message"));
            response.put("isDown", true);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(response);
        }

        return ResponseEntity.ok(Map.of("success", true, "aiData", aiData));
    }

    @PostMapping
    @Operation(summary = "Create a new report")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> createReport(
            Authentication auth,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("category") String category,
            @RequestParam("latitude") String latitude,
            @RequestParam("longitude") String longitude,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "severity", required = false) String severity,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        Map<String, String> user = (Map<String, String>) auth.getPrincipal();

        Map<String, Object> result = reportService.createReport(
                title, description, category, latitude, longitude,
                address, state, severity, image, user.get("id"));

        // Check if AI rejected
        if (Boolean.TRUE.equals(result.get("rejected"))) {
            Map<String, Object> errorResponse = new java.util.LinkedHashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", result.get("error"));
            errorResponse.put("aiData", result.get("aiData"));
            return ResponseEntity.badRequest().body(errorResponse);
        }

        boolean isDuplicate = Boolean.TRUE.equals(result.get("duplicate"));
        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("success", true);
        response.put("duplicate", isDuplicate);
        response.put("message", result.get("message"));

        // Convert the data to response map format
        Object data = result.get("data");
        if (data instanceof com.civica.model.Report report) {
            response.put("data", reportService.toResponseMap(report));
        } else {
            response.put("data", data);
        }

        return ResponseEntity.status(isDuplicate ? HttpStatus.OK : HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Get all reports (paginated, filtered)")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> getReports(
            Authentication auth,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String severity,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        Map<String, String> user = (Map<String, String>) auth.getPrincipal();
        Map<String, Object> result = reportService.getReports(status, category, severity, page, limit, user.get("role"));

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("success", true);
        response.put("data", result.get("data"));
        response.put("pagination", result.get("pagination"));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a report by ID")
    public ResponseEntity<ApiResponse<Object>> getReportById(@PathVariable String id) {
        Map<String, Object> data = reportService.getReportById(id);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Generate PDF for a report")
    public void generateReportPdf(@PathVariable String id,
                                   jakarta.servlet.http.HttpServletResponse response) throws Exception {
        // Delegate to PdfService - injected via field
        pdfService.generateReportPdf(id, response);
    }

    @PatchMapping("/{id}/upvote")
    @Operation(summary = "Toggle upvote on a report")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Object>> upvoteReport(
            @PathVariable String id, Authentication auth) {
        Map<String, String> user = (Map<String, String>) auth.getPrincipal();
        Map<String, Object> result = reportService.upvoteReport(id, user.get("id"));

        boolean hasUpvoted = Boolean.TRUE.equals(result.get("hasUpvoted"));
        return ResponseEntity.ok(ApiResponse.<Object>builder()
                .success(true)
                .message(hasUpvoted ? "Upvoted successfully." : "Upvote removed.")
                .data(result)
                .build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a report")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Void>> deleteReport(
            @PathVariable String id, Authentication auth) {
        Map<String, String> user = (Map<String, String>) auth.getPrincipal();
        reportService.deleteReport(id, user.get("id"), user.get("role"));
        return ResponseEntity.ok(ApiResponse.success(null, "Report deleted successfully."));
    }

    // PdfService injected separately to avoid circular dependency
    @org.springframework.beans.factory.annotation.Autowired
    private com.civica.service.PdfService pdfService;
}
