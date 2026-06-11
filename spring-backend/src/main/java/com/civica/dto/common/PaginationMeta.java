package com.civica.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Pagination metadata matching the frontend's expected structure:
 * { total, page, pages, limit, hasNext, hasPrev }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaginationMeta {

    private long total;
    private int page;
    private int pages;
    private int limit;
    private boolean hasNext;
    private boolean hasPrev;
}
