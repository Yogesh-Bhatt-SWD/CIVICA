package com.civica.service;

import com.civica.dto.common.PaginationMeta;
import com.civica.exception.BadRequestException;
import com.civica.exception.ResourceNotFoundException;
import com.civica.model.Report;
import com.civica.model.Resolution;
import com.civica.repository.ReportRepository;
import com.civica.repository.ResolutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthorityService {

    private final ReportRepository reportRepository;
    private final ResolutionRepository resolutionRepository;
    private final GravityScoreService gravityScoreService;
    private final ReportService reportService;

    public Map<String, Object> getActiveReports(String category, String status, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "gravityScore"));
        Page<Report> reportPage;

        List<String> statuses;
        if (status != null && !status.isBlank() && List.of("pending", "in_progress").contains(status)) {
            statuses = List.of(status);
        } else {
            statuses = List.of("pending", "in_progress");
        }

        if (category != null && !category.isBlank()) {
            reportPage = reportRepository.findByStatusInAndCategory(statuses, category, pageable);
        } else {
            reportPage = reportRepository.findByStatusIn(statuses, pageable);
        }

        List<Map<String, Object>> populated = reportPage.getContent().stream()
                .map(reportService::toResponseMap).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("data", populated);
        result.put("pagination", PaginationMeta.builder()
                .total(reportPage.getTotalElements())
                .page(page)
                .pages(reportPage.getTotalPages())
                .hasNext(reportPage.hasNext())
                .hasPrev(reportPage.hasPrevious())
                .build());
        return result;
    }

    public Map<String, Object> updateReportStatus(String reportId, String status, String note,
                                                    String imageUrl, Integer estimatedDays, String authorityUserId) {
        if (status == null || !List.of("in_progress", "resolved").contains(status)) {
            throw new BadRequestException("Status must be in_progress or resolved.");
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found."));

        report.setStatus(status);
        report.setAssignedTo(authorityUserId);
        if (estimatedDays != null) {
            report.setEstimatedDays(estimatedDays);
        }
        report.setGravityScore(gravityScoreService.calculate(report));
        reportRepository.save(report);

        Resolution resolution = null;
        if ("resolved".equals(status)) {
            resolution = Resolution.builder()
                    .reportId(report.getId())
                    .authorityId(authorityUserId)
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

    public Resolution getResolution(String reportId) {
        return resolutionRepository.findByReportId(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("No resolution found for this report."));
    }
}
