package com.civica.controller;

import com.civica.dto.common.ApiResponse;
import com.civica.dto.report.UpdateStatusRequest;
import com.civica.model.Resolution;
import com.civica.service.AuthorityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/authority")
@RequiredArgsConstructor
@Tag(name = "Authority", description = "Authority report management")
public class AuthorityController {

    private final AuthorityService authorityService;

    @GetMapping("/reports")
    @Operation(summary = "Get active reports for authority queue")
    public ResponseEntity<Map<String, Object>> getActiveReports(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        // Check role - only authority and admin
        Map<String, Object> result = authorityService.getActiveReports(category, status, page, limit);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("data", result.get("data"));
        response.put("pagination", result.get("pagination"));
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/reports/{id}/status")
    @Operation(summary = "Update report status (authority)")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> updateReportStatus(
            @PathVariable String id,
            @RequestBody UpdateStatusRequest request,
            Authentication auth) {
        Map<String, String> user = (Map<String, String>) auth.getPrincipal();
        Map<String, Object> result = authorityService.updateReportStatus(
                id, request.getStatus(), request.getNote(),
                request.getImageUrl(), request.getEstimatedDays(), user.get("id"));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Report marked as " + request.getStatus() + ".");
        response.put("data", result.get("data"));
        response.put("resolution", result.get("resolution"));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/{id}/resolution")
    @Operation(summary = "Get resolution for a report")
    public ResponseEntity<ApiResponse<Resolution>> getResolution(@PathVariable String id) {
        Resolution resolution = authorityService.getResolution(id);
        return ResponseEntity.ok(ApiResponse.success(resolution));
    }
}
