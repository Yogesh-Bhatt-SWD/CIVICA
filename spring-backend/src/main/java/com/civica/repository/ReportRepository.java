package com.civica.repository;

import com.civica.model.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, String> {

    Page<Report> findBySubmittedBy(String userId, Pageable pageable);

    Page<Report> findBySubmittedByAndStatusNot(String userId, String status, Pageable pageable);

    Page<Report> findBySubmittedByAndStatus(String userId, String status, Pageable pageable);

    Page<Report> findByStatusIn(List<String> statuses, Pageable pageable);

    Page<Report> findByStatusInAndCategory(List<String> statuses, String category, Pageable pageable);

    Page<Report> findByStatus(String status, Pageable pageable);

    Page<Report> findByStatusNot(String status, Pageable pageable);

    Page<Report> findByCategory(String category, Pageable pageable);

    Page<Report> findByStatusAndCategory(String status, String category, Pageable pageable);

    Page<Report> findByStatusNotAndCategory(String status, String category, Pageable pageable);

    long countByStatus(String status);

    @Query(value = "SELECT * FROM reports r WHERE r.category = :category AND r.status != 'resolved' AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL AND (6371000 * acos(LEAST(1.0, GREATEST(-1.0, cos(radians(:lat)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(r.latitude)))))) <= :maxDistanceMetres", nativeQuery = true)
    List<Report> findNearbyDuplicates(@Param("lng") double lng, @Param("lat") double lat, @Param("maxDistanceMetres") double maxDistanceMetres, @Param("category") String category);

    @Query("SELECT r FROM Report r WHERE r.address IS NOT NULL AND r.address != ''")
    List<Report> findAllWithAddress();

    @Query("SELECT r.category AS category, COUNT(r) AS count FROM Report r GROUP BY r.category")
    List<CategoryCountProjection> countReportsByCategory();

    @Query("SELECT r.status AS status, COUNT(r) AS count FROM Report r GROUP BY r.status")
    List<StatusCountProjection> countReportsByStatus();

    @Query("SELECT r.address AS address, COUNT(r) AS count FROM Report r WHERE r.address IS NOT NULL AND r.address != '' GROUP BY r.address ORDER BY COUNT(r) DESC")
    List<AreaCountProjection> findTopReportedAreas(Pageable pageable);

    interface CategoryCountProjection {
        String getCategory();
        Long getCount();
    }

    interface StatusCountProjection {
        String getStatus();
        Long getCount();
    }

    interface AreaCountProjection {
        String getAddress();
        Long getCount();
    }
}
