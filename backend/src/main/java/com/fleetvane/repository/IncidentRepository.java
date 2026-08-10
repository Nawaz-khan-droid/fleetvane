package com.fleetvane.repository;

import com.fleetvane.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByDriverId(Long driverId);
    List<Incident> findByTruckId(Long truckId);
    List<Incident> findByStatus(String status);
}
