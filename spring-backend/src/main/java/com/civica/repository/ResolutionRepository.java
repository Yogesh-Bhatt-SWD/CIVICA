package com.civica.repository;

import com.civica.model.Resolution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResolutionRepository extends JpaRepository<Resolution, String> {

    Optional<Resolution> findByReportId(String reportId);

    List<Resolution> findAllByReportIdIn(List<String> reportIds);
}
