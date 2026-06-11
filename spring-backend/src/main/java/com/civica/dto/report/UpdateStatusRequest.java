package com.civica.dto.report;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateStatusRequest {

    @NotBlank(message = "Status is required")
    private String status;

    private String note;

    private String imageUrl;

    @Min(value = 1, message = "Estimated days must be at least 1")
    private Integer estimatedDays;
}
