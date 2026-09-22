package com.fleetvane.fleet.repository;

import com.fleetvane.fleet.entity.Vehicle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByIdAndCompanyId(Long id, Long companyId);
    Optional<Vehicle> findByPlateNumberAndCompanyId(String plateNumber, Long companyId);
    Page<Vehicle> findByCompanyId(Long companyId, Pageable pageable);
    Page<Vehicle> findByCompanyIdAndStatus(Long companyId, String status, Pageable pageable);
    java.util.List<Vehicle> findByStatus(String status);
    long countByCompanyId(Long companyId);
}
