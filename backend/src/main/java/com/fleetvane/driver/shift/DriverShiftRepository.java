package com.fleetvane.driver.shift;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverShiftRepository extends JpaRepository<DriverShift, Long> {
    @Query("SELECT s FROM DriverShift s WHERE s.driverId = :driverId AND s.shiftEndedAt IS NULL")
    Optional<DriverShift> findActiveShift(@Param("driverId") Long driverId);
}
