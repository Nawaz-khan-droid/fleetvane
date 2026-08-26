package com.fleetvane.dispatch;

import com.fleetvane.driver.entity.DriverProfile;
import com.fleetvane.driver.repository.DriverProfileRepository;
import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.routing.dto.CreateOptimizationJobRequest;
import com.fleetvane.routing.dto.RouteSolutionResponse;
import com.fleetvane.routing.service.RouteSolverService;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shipment.repository.ShipmentRepository;
import com.fleetvane.shared.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DispatchService {

    private static final Logger log = LoggerFactory.getLogger(DispatchService.class);

    private final RouteSolverService solverService;
    private final VehicleRepository vehicleRepository;
    private final ShipmentRepository shipmentRepository;
    private final DriverProfileRepository driverProfileRepository;

    public DispatchService(RouteSolverService solverService,
                           VehicleRepository vehicleRepository,
                           ShipmentRepository shipmentRepository,
                           DriverProfileRepository driverProfileRepository) {
        this.solverService = solverService;
        this.vehicleRepository = vehicleRepository;
        this.shipmentRepository = shipmentRepository;
        this.driverProfileRepository = driverProfileRepository;
    }

    @Transactional
    public RouteSolutionResponse dispatchAll(Long userId) {
        List<Shipment> pending = shipmentRepository.findByStatus("REQUESTED");
        if (pending.isEmpty()) {
            throw new BusinessException("No pending shipments to dispatch", HttpStatus.BAD_REQUEST);
        }

        List<Vehicle> vehicles = vehicleRepository.findAll();
        if (vehicles.isEmpty()) {
            throw new BusinessException("No vehicles available for dispatch", HttpStatus.BAD_REQUEST);
        }

        List<Long> vehicleIds = vehicles.stream().map(Vehicle::getId).toList();
        List<Long> shipmentIds = pending.stream().map(Shipment::getId).toList();

        CreateOptimizationJobRequest request = new CreateOptimizationJobRequest(vehicleIds, shipmentIds);
        RouteSolutionResponse response = solverService.solveSync(request, userId);

        assignShipments(response, vehicles);

        return response;
    }

    private void assignShipments(RouteSolutionResponse response, List<Vehicle> vehicles) {
        Map<Long, Vehicle> vehiclesById = vehicles.stream()
                .collect(Collectors.toMap(Vehicle::getId, v -> v));

        Map<Long, DriverProfile> driverByVehicle = driverProfileRepository.findAll().stream()
                .filter(dp -> dp.getVehicleId() != null)
                .collect(Collectors.toMap(DriverProfile::getVehicleId, dp -> dp));

        for (RouteSolutionResponse.VehicleRoute route : response.routes()) {
            if (route.stops().isEmpty()) continue;

            Vehicle vehicle = vehiclesById.get(route.originalId());
            if (vehicle != null) {
                vehicle.setStatus("IN_USE");
                vehicleRepository.save(vehicle);
            }

            DriverProfile driver = driverByVehicle.get(route.originalId());

            double totalWeight = 0;
            double totalVolume = 0;

            for (RouteSolutionResponse.Stop stop : route.stops()) {
                Shipment shipment = shipmentRepository.findById(stop.shipmentId()).orElse(null);
                if (shipment == null) continue;

                shipment.setVehicleId(route.originalId());
                if (driver != null) {
                    shipment.setDriverId(driver.getUserId());
                }
                shipment.setStatus("ASSIGNED");
                shipment.setAssignedAt(Instant.now());
                shipmentRepository.save(shipment);

                totalWeight += shipment.getWeight() != null ? shipment.getWeight() : 0;
                totalVolume += shipment.getVolumeM3() != null ? shipment.getVolumeM3() : 0;
            }

            if (vehicle != null) {
                vehicle.setCurrentWeightKg(totalWeight);
                vehicle.setCurrentVolumeM3(totalVolume);
                vehicleRepository.save(vehicle);
            }
        }

        log.info("Dispatch complete: assigned {} shipments across {} routes",
                response.routes().stream().mapToInt(r -> r.stops().size()).sum(),
                response.routes().size());
    }
}
