package com.fleetvane.shipment.repository;

import com.fleetvane.shipment.entity.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Page<Shipment> findByClientId(Long clientId, Pageable pageable);
    Page<Shipment> findByDriverId(Long driverId, Pageable pageable);
    Page<Shipment> findByStatus(String status, Pageable pageable);
    List<Shipment> findByVehicleIdAndStatusIn(Long vehicleId, List<String> statuses);
}
