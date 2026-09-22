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
    Page<Shipment> findByTransportCompanyId(Long transportCompanyId, Pageable pageable);
    Page<Shipment> findByTransportCompanyIdAndStatus(Long transportCompanyId, String status, Pageable pageable);
    Page<Shipment> findByDriverId(Long driverId, Pageable pageable);
    Page<Shipment> findByStatus(String status, Pageable pageable);
    List<Shipment> findByStatus(String status);
    List<Shipment> findByVehicleIdAndStatusIn(Long vehicleId, List<String> statuses);
    List<Shipment> findByStatusIn(List<String> statuses);
    
    java.util.Optional<Shipment> findByIdAndDriverId(Long id, Long driverId);
    java.util.Optional<Shipment> findByIdAndClientId(Long id, Long clientId);

    /** Find the most recent active shipment for a vehicle (for WebSocket channel scoping). */
    java.util.Optional<Shipment> findTopByVehicleIdAndStatusInOrderByAssignedAtDesc(Long vehicleId, List<String> statuses);

    default java.util.Optional<Shipment> findTopByVehicleIdAndStatusIn(Long vehicleId, List<String> statuses) {
        return findTopByVehicleIdAndStatusInOrderByAssignedAtDesc(vehicleId, statuses);
    }
}
