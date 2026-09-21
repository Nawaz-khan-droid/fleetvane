package com.fleetvane.driver.repository;

import com.fleetvane.driver.entity.DriverProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface DriverProfileRepository extends JpaRepository<DriverProfile, Long> {
    Optional<DriverProfile> findByUserId(Long userId);
    Page<DriverProfile> findByIsAvailable(Boolean isAvailable, Pageable pageable);
    
    @Query("SELECT dp FROM DriverProfile dp JOIN User u ON dp.userId = u.id WHERE u.companyId = :companyId")
    Page<DriverProfile> findByCompanyId(@Param("companyId") Long companyId, Pageable pageable);
}
