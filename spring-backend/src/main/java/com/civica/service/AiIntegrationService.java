package com.civica.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * HTTP client for integrating with the Python AI service (Flask, port 5001).
 * Proxies /validate and /health endpoints.
 */
@Slf4j
@Service
public class AiIntegrationService {

    private final RestTemplate restTemplate;
    private final String aiServiceUrl;

    public AiIntegrationService(@Value("${ai.service.url}") String aiServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.aiServiceUrl = aiServiceUrl;
    }

    /**
     * Fetch categories from AI service /health endpoint.
     * Falls back to static list if AI is offline.
     */
    @SuppressWarnings("unchecked")
    public List<String> getCategories() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    aiServiceUrl + "/health", Map.class);

            if (response.getBody() != null) {
                Object classes = response.getBody().get("classes");
                if (classes instanceof List && !((List<?>) classes).isEmpty()) {
                    return (List<String>) classes;
                }
            }
        } catch (RestClientException e) {
            log.warn("AI offline or unreachable, falling back to static categories: {}", e.getMessage());
        }

        return List.of("FallenTrees", "DamagedElectricalPoles", "Potholes and RoadCracks", "Garbage");
    }

    /**
     * Validate an image via the AI service's /validate endpoint.
     *
     * @return Map with AI response data, or error/offline info
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> validateImage(MultipartFile file, String category) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });
            if (category != null && !category.isBlank()) {
                body.add("category", category);
            }

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            log.info("Requesting AI Validation ({})...", category);
            ResponseEntity<Map> response = restTemplate.exchange(
                    aiServiceUrl + "/validate",
                    HttpMethod.POST,
                    requestEntity,
                    Map.class
            );

            Map<String, Object> aiData = response.getBody();
            if (aiData != null) {
                log.info("AI VALIDATED: {} (conf: {})", category, aiData.get("confidence"));
            }
            return aiData;

        } catch (RestClientException e) {
            log.error("AI service connection error: {}", e.getMessage());
            return Map.of(
                    "valid", false,
                    "message", "AI validation service is currently offline. Manual review required.",
                    "isDown", true,
                    "confidence", 0.0
            );
        } catch (Exception e) {
            log.error("AI service error: {}", e.getMessage());
            return Map.of(
                    "valid", false,
                    "message", "AI service error: " + e.getMessage(),
                    "isDown", false,
                    "confidence", 0.0
            );
        }
    }
}
