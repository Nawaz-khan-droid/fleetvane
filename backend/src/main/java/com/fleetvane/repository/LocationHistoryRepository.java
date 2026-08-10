package com.fleetvane.repository;

import com.fleetvane.model.LocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LocationHistoryRepository extends JpaRepository<LocationHistory, Long> {
    List<LocationHistory> findByTruckIdOrderByRecordedAtDesc(Long truckId);
}
