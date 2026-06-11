package com.civica.repository;

import com.civica.model.Resolution;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ResolutionRepository extends MongoRepository<Resolution, String> {

    Optional<Resolution> findByReportId(String reportId);

    List<Resolution> findAllByReportIdIn(List<String> reportIds);
}
