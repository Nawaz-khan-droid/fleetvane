package com.fleetvane.incident.repository;

import com.fleetvane.incident.entity.IncidentReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Long> {
    Page<IncidentReport> findByDriverId(Long driverId, Pageable pageable);
}
