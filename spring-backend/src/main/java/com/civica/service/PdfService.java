package com.civica.service;

import com.civica.model.Report;
import com.civica.model.Resolution;
import com.civica.repository.ReportRepository;
import com.civica.repository.ResolutionRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfService {

    private final ReportRepository reportRepository;
    private final ResolutionRepository resolutionRepository;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm").withZone(ZoneId.systemDefault());

    public void generateReportPdf(String reportId, HttpServletResponse response) throws IOException {
        Report report = reportRepository.findById(reportId).orElse(null);
        if (report == null) {
            response.setStatus(404);
            response.getWriter().write("{\"success\":false,\"error\":\"Report not found.\"}");
            return;
        }

        Resolution resolution = resolutionRepository.findByReportId(reportId).orElse(null);

        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"Civica_Report_" + reportId + ".pdf\"");

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            float width = page.getMediaBox().getWidth();
            float margin = 50;
            float y = page.getMediaBox().getHeight() - margin;
            float contentWidth = width - 2 * margin;

            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontItalic = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                // Header
                cs.beginText();
                cs.setFont(fontBold, 22);
                cs.setLeading(28);
                cs.newLineAtOffset(margin, y);
                cs.showText("CIVICA");
                cs.endText();
                y -= 18;

                cs.beginText();
                cs.setFont(fontBold, 9);
                cs.newLineAtOffset(margin, y);
                cs.showText("CIVIC INFRASTRUCTURE AUTHORITY");
                cs.endText();
                y -= 14;

                cs.beginText();
                cs.setFont(fontRegular, 8);
                cs.newLineAtOffset(margin, y);
                cs.showText("OFFICIAL INCIDENT & RESOLUTION DOCUMENT");
                cs.endText();
                y -= 8;

                // Report ID on right
                cs.beginText();
                cs.setFont(fontRegular, 8);
                cs.newLineAtOffset(width - margin - 180, page.getMediaBox().getHeight() - margin);
                cs.showText("REPORT ID: " + reportId);
                cs.endText();

                // Separator
                y -= 10;
                cs.moveTo(margin, y);
                cs.lineTo(width - margin, y);
                cs.stroke();
                y -= 25;

                // Status / Priority / Category
                cs.beginText();
                cs.setFont(fontBold, 9);
                cs.newLineAtOffset(margin, y);
                cs.showText("STATUS: " + report.getStatus().replace("_", " ").toUpperCase());
                cs.endText();

                cs.beginText();
                cs.setFont(fontBold, 9);
                cs.newLineAtOffset(margin + 180, y);
                String priority = report.getSeverity() >= 4 ? "CRITICAL / HIGH" :
                        (report.getSeverity() == 3 ? "MODERATE" : "LOW");
                cs.showText("PRIORITY: " + priority);
                cs.endText();

                cs.beginText();
                cs.setFont(fontBold, 9);
                cs.newLineAtOffset(margin + 360, y);
                cs.showText("CATEGORY: " + report.getCategory().replace("_", " ").toUpperCase());
                cs.endText();
                y -= 30;

                // Separator
                cs.moveTo(margin, y);
                cs.lineTo(width - margin, y);
                cs.stroke();
                y -= 20;

                // Incident Details
                cs.beginText();
                cs.setFont(fontBold, 13);
                cs.newLineAtOffset(margin, y);
                cs.showText("INCIDENT DETAILS");
                cs.endText();
                y -= 20;

                cs.beginText();
                cs.setFont(fontBold, 10);
                cs.newLineAtOffset(margin, y);
                cs.showText("Subject: ");
                cs.setFont(fontRegular, 10);
                cs.showText(truncate(report.getTitle(), 70));
                cs.endText();
                y -= 18;

                cs.beginText();
                cs.setFont(fontBold, 10);
                cs.newLineAtOffset(margin, y);
                cs.showText("Description:");
                cs.endText();
                y -= 16;

                // Word-wrap description
                String desc = report.getDescription() != null && !report.getDescription().isBlank()
                        ? report.getDescription() : "No detailed description provided.";
                y = drawWrappedText(cs, desc, margin, y, contentWidth, fontRegular, 9);
                y -= 20;

                // Location
                cs.beginText();
                cs.setFont(fontBold, 13);
                cs.newLineAtOffset(margin, y);
                cs.showText("LOCATION & SPATIAL DATA");
                cs.endText();
                y -= 20;

                if (report.getAddress() != null && !report.getAddress().isBlank()) {
                    cs.beginText();
                    cs.setFont(fontBold, 10);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("Address: ");
                    cs.setFont(fontRegular, 10);
                    cs.showText(truncate(report.getAddress(), 60));
                    cs.endText();
                    y -= 16;
                }

                if (report.getState() != null && !report.getState().isBlank()) {
                    cs.beginText();
                    cs.setFont(fontBold, 10);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("State: ");
                    cs.setFont(fontRegular, 10);
                    cs.showText(report.getState());
                    cs.endText();
                    y -= 16;
                }

                if (report.getLocation() != null && report.getLocation().getCoordinates() != null) {
                    double lat = report.getLocation().getLatitude();
                    double lng = report.getLocation().getLongitude();
                    cs.beginText();
                    cs.setFont(fontBold, 10);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("Coordinates: ");
                    cs.setFont(fontRegular, 10);
                    cs.showText(String.format("%.6f, %.6f", lat, lng));
                    cs.endText();
                    y -= 20;
                }

                // Metrics
                y -= 10;
                cs.beginText();
                cs.setFont(fontBold, 13);
                cs.newLineAtOffset(margin, y);
                cs.showText("METRICS");
                cs.endText();
                y -= 20;

                cs.beginText();
                cs.setFont(fontRegular, 10);
                cs.newLineAtOffset(margin, y);
                cs.showText("Severity: " + report.getSeverity() + "/5");
                cs.endText();

                cs.beginText();
                cs.setFont(fontRegular, 10);
                cs.newLineAtOffset(margin + 150, y);
                cs.showText("Upvotes: " + report.getUpvotes());
                cs.endText();

                cs.beginText();
                cs.setFont(fontRegular, 10);
                cs.newLineAtOffset(margin + 300, y);
                cs.showText("Gravity Score: " + report.getGravityScore());
                cs.endText();
                y -= 16;

                if (report.getCreatedAt() != null) {
                    cs.beginText();
                    cs.setFont(fontRegular, 10);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("Reported on: " + DATE_FMT.format(report.getCreatedAt()));
                    cs.endText();
                    y -= 16;
                }

                if (report.getAiValidated() != null && report.getAiValidated()) {
                    cs.beginText();
                    cs.setFont(fontBold, 10);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("AI Validated: YES");
                    if (report.getAiConfidence() != null) {
                        cs.showText(" (Confidence: " + String.format("%.1f%%", report.getAiConfidence() * 100) + ")");
                    }
                    cs.endText();
                    y -= 20;
                }

                // Resolution
                if (resolution != null) {
                    y -= 10;
                    cs.beginText();
                    cs.setFont(fontBold, 13);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("RESOLUTION");
                    cs.endText();
                    y -= 20;

                    if (resolution.getResolvedAt() != null) {
                        cs.beginText();
                        cs.setFont(fontRegular, 10);
                        cs.newLineAtOffset(margin, y);
                        cs.showText("Resolved on: " + DATE_FMT.format(resolution.getResolvedAt()));
                        cs.endText();
                        y -= 16;
                    }

                    if (resolution.getNote() != null && !resolution.getNote().isBlank()) {
                        cs.beginText();
                        cs.setFont(fontBold, 10);
                        cs.newLineAtOffset(margin, y);
                        cs.showText("Authority Note:");
                        cs.endText();
                        y -= 14;
                        y = drawWrappedText(cs, resolution.getNote(), margin, y, contentWidth, fontItalic, 9);
                    }
                }

                // Footer
                float footerY = 40;
                cs.moveTo(margin, footerY + 10);
                cs.lineTo(width - margin, footerY + 10);
                cs.stroke();

                cs.beginText();
                cs.setFont(fontRegular, 7);
                cs.newLineAtOffset(margin, footerY);
                cs.showText("Civica Official Digital Certificate - Generated " + DATE_FMT.format(java.time.Instant.now()));
                cs.endText();
            }

            doc.save(response.getOutputStream());
        }
    }

    private float drawWrappedText(PDPageContentStream cs, String text, float x, float y,
                                   float maxWidth, PDType1Font font, float fontSize) throws IOException {
        String[] words = text.split("\\s+");
        StringBuilder line = new StringBuilder();
        float lineHeight = fontSize * 1.4f;

        for (String word : words) {
            String testLine = line.isEmpty() ? word : line + " " + word;
            float testWidth = font.getStringWidth(testLine) / 1000 * fontSize;

            if (testWidth > maxWidth && !line.isEmpty()) {
                cs.beginText();
                cs.setFont(font, fontSize);
                cs.newLineAtOffset(x, y);
                cs.showText(line.toString());
                cs.endText();
                y -= lineHeight;
                line = new StringBuilder(word);
            } else {
                line = new StringBuilder(testLine);
            }
        }

        if (!line.isEmpty()) {
            cs.beginText();
            cs.setFont(font, fontSize);
            cs.newLineAtOffset(x, y);
            cs.showText(line.toString());
            cs.endText();
            y -= lineHeight;
        }

        return y;
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() > maxLen ? text.substring(0, maxLen) + "..." : text;
    }
}
