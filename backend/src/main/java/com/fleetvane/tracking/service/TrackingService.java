package com.fleetvane.tracking.service;

import com.fleetvane.driver.entity.DriverProfile;
import com.fleetvane.driver.repository.DriverProfileRepository;
import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import com.fleetvane.shipment.repository.ShipmentRepository;
import com.fleetvane.tracking.application.VehiclePersistencePort;
import com.fleetvane.tracking.dto.LocationUpdateRequest;
import com.fleetvane.tracking.dto.VehicleLocationEvent;
import com.fleetvane.tracking.entity.GpsEvent;
import com.fleetvane.tracking.repository.GpsEventRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * GPS telemetry ingestion + history reads.
 *
 * Broadcasts on two scoped WebSocket channels (Fleetbase pattern):
 *   /topic/fleet.vehicles            - manager live-map (all vehicles)
 *   /topic/shipment.{id}.tracking   - client tracking page (per-shipment)
 */
@Service
public class TrackingService {

    private final VehiclePersistencePort vehiclePersistencePort;
    private final GpsEventRepository gpsEventRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final ShipmentRepository shipmentRepository;
    private final SimpMessagingTemplate ws;

    public TrackingService(VehiclePersistencePort vehiclePersistencePort,
                           GpsEventRepository gpsEventRepository,
                           DriverProfileRepository driverProfileRepository,
                           ShipmentRepository shipmentRepository,
                           SimpMessagingTemplate ws) {
        this.vehiclePersistencePort = vehiclePersistencePort;
        this.gpsEventRepository = gpsEventRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.shipmentRepository = shipmentRepository;
        this.ws = ws;
    }

    private void enforceVehicleAccess(Long vehicleId, String role, Long userId) {
        if (!"DRIVER".equals(role)) return;
        DriverProfile profile = driverProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("No driver profile found", HttpStatus.FORBIDDEN));
        if (!vehicleId.equals(profile.getVehicleId())) {
            throw new BusinessException("You are not assigned to this vehicle", HttpStatus.FORBIDDEN);
        }
    }

    @Transactional
    public void updateVehicleLocation(Long vehicleId, LocationUpdateRequest request, String role, Long userId) {
        enforceVehicleAccess(vehicleId, role, userId);

        double heading = request.heading() != null ? request.heading() : 0.0;
        double speed   = request.speed()   != null ? request.speed()   : 0.0;

        vehiclePersistencePort.applyGpsLocation(vehicleId, request.lat(), request.lng(), heading);
        gpsEventRepository.save(new GpsEvent(vehicleId, request.lat(), request.lng(), heading, speed));

        // Find the active shipment for this vehicle (DISPATCHED or IN_TRANSIT)
        var activeShipmentOpt = shipmentRepository.findTopByVehicleIdAndStatusIn(vehicleId, List.of("DISPATCHED", "IN_TRANSIT"));
        Long activeShipmentId = activeShipmentOpt.map(s -> s.getId()).orElse(null);

        if (activeShipmentOpt.isPresent()) {
            var shipment = activeShipmentOpt.get();
            if (shipment.getDeliveryLatitude() != null && shipment.getDeliveryLongitude() != null) {
                double distance = com.fleetvane.util.DistanceCalculator.calculateHaversineDistance(
                        request.lat(), request.lng(), shipment.getDeliveryLatitude(), shipment.getDeliveryLongitude()
                );
                if (distance <= 50.0 && !"ARRIVED".equals(shipment.getStatus())) {
                    shipment.setStatus("ARRIVED");
                    shipmentRepository.save(shipment);
                    ws.convertAndSend("/topic/shipment." + shipment.getId() + ".tracking", "✅ Shipment #" + shipment.getId() + " ARRIVED at destination.");
                }
            }
        }

        VehicleLocationEvent event = new VehicleLocationEvent(
                vehicleId,
                vehiclePersistencePort.getPlateNumber(vehicleId),
                request.lat(),
                request.lng(),
                heading,
                speed,
                vehiclePersistencePort.getStatus(vehicleId),
                activeShipmentId
        );

        // Broadcast to manager fleet-map (all vehicles)
        ws.convertAndSend("/topic/fleet.vehicles", event);

        // Broadcast to per-shipment tracking page
        if (activeShipmentId != null) {
            ws.convertAndSend("/topic/shipment." + activeShipmentId + ".tracking", event);
        }
    }

    @Transactional(readOnly = true)
    public Page<GpsEvent> getVehicleHistory(Long vehicleId, Pageable pageable, String role, Long userId) {
        enforceVehicleAccess(vehicleId, role, userId);
        if (!vehiclePersistencePort.vehicleExists(vehicleId)) {
            throw new ResourceNotFoundException("Vehicle", "id", vehicleId);
        }
        return gpsEventRepository.findByVehicleIdOrderByRecordedAtDesc(vehicleId, pageable);
    }
}