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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
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
    private final MongoTemplate mongoTemplate;

    public Map<String, Object> getActiveReports(String category, String status, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "gravityScore"));
        Query query = new Query();

        if (status != null && !status.isBlank() && List.of("pending", "in_progress").contains(status)) {
            query.addCriteria(Criteria.where("status").is(status));
        } else {
            query.addCriteria(Criteria.where("status").in("pending", "in_progress"));
        }

        if (category != null && !category.isBlank()) {
            query.addCriteria(Criteria.where("category").is(category));
        }

        long total = mongoTemplate.count(query, Report.class);
        query.with(pageable);
        List<Report> reports = mongoTemplate.find(query, Report.class);

        List<Map<String, Object>> populated = reports.stream().map(reportService::toResponseMap).toList();
        int totalPages = (int) Math.ceil((double) total / limit);

        Map<String, Object> result = new HashMap<>();
        result.put("data", populated);
        result.put("pagination", PaginationMeta.builder()
                .total(total).page(page).pages(totalPages)
                .hasNext(page < totalPages).hasPrev(page > 1).build());
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
