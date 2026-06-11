package com.civica.controller;

import com.civica.dto.admin.UpdateRoleRequest;
import com.civica.dto.common.ApiResponse;
import com.civica.dto.report.UpdateStatusRequest;
import com.civica.model.User;
import com.civica.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin panel operations")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    @Operation(summary = "List all users (paginated)")
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Map<String, Object> result = adminService.getUsers(role, page, limit);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("data", result.get("data"));
        response.put("pagination", result.get("pagination"));
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/users/{id}/role")
    @Operation(summary = "Update a user's role")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Object>> updateUserRole(
            @PathVariable String id,
            @Valid @RequestBody UpdateRoleRequest request,
            Authentication auth) {
        Map<String, String> adminUser = (Map<String, String>) auth.getPrincipal();
        User user = adminService.updateUserRole(id, request.getRole(), adminUser.get("id"));

        Map<String, Object> userData = new LinkedHashMap<>();
        userData.put("_id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("role", user.getRole());
        userData.put("createdAt", user.getCreatedAt());

        return ResponseEntity.ok(ApiResponse.<Object>builder()
                .success(true)
                .message("User role updated to " + request.getRole() + ".")
                .data(userData)
                .build());
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete a user")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable String id, Authentication auth) {
        Map<String, String> adminUser = (Map<String, String>) auth.getPrincipal();
        adminService.deleteUser(id, adminUser.get("id"));
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted."));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get platform analytics")
    public ResponseEntity<ApiResponse<Object>> getAnalytics() {
        Map<String, Object> analytics = adminService.getAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @PatchMapping("/reports/{id}/status")
    @Operation(summary = "Update report status (admin)")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> updateReportStatus(
            @PathVariable String id,
            @RequestBody UpdateStatusRequest request,
            Authentication auth) {
        Map<String, String> adminUser = (Map<String, String>) auth.getPrincipal();
        Map<String, Object> result = adminService.updateReportStatus(
                id, request.getStatus(), request.getNote(),
                request.getImageUrl(), request.getEstimatedDays(), adminUser.get("id"));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("data", result.get("data"));
        response.put("resolution", result.get("resolution"));
        return ResponseEntity.ok(response);
    }
}
