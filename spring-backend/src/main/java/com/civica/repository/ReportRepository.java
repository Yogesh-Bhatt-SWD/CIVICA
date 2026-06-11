package com.civica.repository;

import com.civica.model.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends MongoRepository<Report, String> {

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

    @Query("{ 'location': { $near: { $geometry: { type: 'Point', coordinates: [?0, ?1] }, $maxDistance: ?2 } }, 'category': ?3, 'status': { $ne: 'resolved' } }")
    List<Report> findNearbyDuplicates(double lng, double lat, double maxDistanceMetres, String category);

    @Query("{ 'address': { $ne: '' } }")
    List<Report> findAllWithAddress();
}
