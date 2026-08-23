package com.fleetvane.tracking.repository;

import com.fleetvane.tracking.entity.GpsEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface GpsEventRepository extends JpaRepository<GpsEvent, Long> {
    Page<GpsEvent> findByVehicleIdOrderByRecordedAtDesc(Long vehicleId, Pageable pageable);

    @Query("SELECT g FROM GpsEvent g WHERE g.vehicleId = :vehicleId AND g.recordedAt BETWEEN :start AND :end ORDER BY g.recordedAt ASC")
    List<GpsEvent> findByVehicleIdAndRecordedAtBetween(
            @Param("vehicleId") Long vehicleId,
            @Param("start") Instant start,
            @Param("end") Instant end
    );
}
