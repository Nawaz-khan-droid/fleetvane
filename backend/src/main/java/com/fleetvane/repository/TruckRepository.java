package com.fleetvane.repository;

import com.fleetvane.model.Truck;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface TruckRepository extends JpaRepository<Truck, Long> {
    List<Truck> findByStatus(String status);
    List<Truck> findByManagerId(Long managerId);
    List<Truck> findByLastHeartbeatBefore(LocalDateTime threshold);
}
