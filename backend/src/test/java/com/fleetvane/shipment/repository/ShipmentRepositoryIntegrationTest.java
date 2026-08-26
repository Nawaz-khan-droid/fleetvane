package com.fleetvane.shipment.repository;

import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shared.config.JpaAuditingConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository slice integration test.
 *
 * Boots the real JPA stack against embedded H2 (PostgreSQL compatibility mode),
 * runs the actual Flyway migrations (V1-V5), and exercises the derived queries
 * that BACK THE SECURITY MODEL — i.e. the tenant-isolation lookups used by
 * ShipmentService for DRIVER/CLIENT authorization.
 *
 * Seeds real parent rows (users, vehicles) because the schema enforces
 * client_id/driver_id -> users(id) and vehicle_id -> vehicles(id) foreign keys,
 * and imports JpaAuditingConfig so NOT NULL audit timestamps are populated.
 */
@DataJpaTest
@Import(JpaAuditingConfig.class)
class ShipmentRepositoryIntegrationTest {

    @Autowired
    private ShipmentRepository shipmentRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private VehicleRepository vehicleRepository;

    // Captured from save() so assertions never depend on DB-assigned ID sequences
    private User client100, driver200, driver999, client300;
    private Vehicle vehicle10, vehicle20;
    private Shipment assignedToDriver200;
    private Shipment inTransitOtherDriver;
    private Shipment requestedForClient300;

    private static User newUser(String email, String role) {
        User u = new User(email, "bcrypt-hash-placeholder", "Test " + role, role);
        return u;
    }

    private static Vehicle newVehicle(String plate) {
        Vehicle v = new Vehicle();
        v.setPlateNumber(plate);
        v.setType("TRUCK");
        v.setModel("Tata Prima Test");
        v.setCapacity(15000.0);
        v.setFuelType("DIESEL");
        v.setStatus("AVAILABLE");
        v.setLat(19.0760);
        v.setLng(72.8777);
        v.setHeading(0.0);
        v.setMaxVolumeM3(30.0);
        v.setCurrentWeightKg(0.0);
        v.setCurrentVolumeM3(0.0);
        return v;
    }

    private static Shipment newShipment(Long clientId, Long driverId, Long vehicleId, String status) {
        Shipment s = new Shipment();
        s.setClientId(clientId);
        s.setDriverId(driverId);
        s.setVehicleId(vehicleId);
        s.setStatus(status);
        s.setOriginAddress("Warehouse A, Mumbai");
        s.setOriginLat(19.0760);
        s.setOriginLng(72.8777);
        s.setDestinationAddress("Retail Hub, Pune");
        s.setDestinationLat(18.5204);
        s.setDestinationLng(73.8567);
        s.setWeight(500.0);
        return s;
    }

    @BeforeEach
    void seed() {
        shipmentRepository.deleteAll();
        vehicleRepository.deleteAll();
        userRepository.deleteAll();

        client100 = userRepository.save(newUser("client100@test.local", "CLIENT"));
        client300 = userRepository.save(newUser("client300@test.local", "CLIENT"));
        driver200 = userRepository.save(newUser("driver200@test.local", "DRIVER"));
        driver999 = userRepository.save(newUser("driver999@test.local", "DRIVER"));

        vehicle10 = vehicleRepository.save(newVehicle("MH-01-XX-0010"));
        vehicle20 = vehicleRepository.save(newVehicle("MH-01-XX-0020"));

        assignedToDriver200 = shipmentRepository.save(
                newShipment(client100.getId(), driver200.getId(), vehicle10.getId(), "ASSIGNED"));
        inTransitOtherDriver = shipmentRepository.save(
                newShipment(client100.getId(), driver999.getId(), vehicle20.getId(), "IN_TRANSIT"));
        requestedForClient300 = shipmentRepository.save(
                newShipment(client300.getId(), driver200.getId(), vehicle10.getId(), "REQUESTED"));
    }

    @Test
    @DisplayName("findByIdAndDriverId enforces DRIVER ownership isolation")
    void driverOwnershipLookup() {
        var owner = shipmentRepository.findByIdAndDriverId(
                assignedToDriver200.getId(), driver200.getId());
        assertThat(owner).isPresent();
        assertThat(owner.get().getStatus()).isEqualTo("ASSIGNED");

        // Wrong driver -> empty (this is what yields the service-level 403)
        assertThat(shipmentRepository.findByIdAndDriverId(
                assignedToDriver200.getId(), 987654L)).isEmpty();
    }

    @Test
    @DisplayName("findByIdAndClientId enforces CLIENT data isolation")
    void clientIsolationLookup() {
        assertThat(shipmentRepository.findByIdAndClientId(
                assignedToDriver200.getId(), client100.getId())).isPresent();
        // Client 300 cannot see client 100's shipment
        assertThat(shipmentRepository.findByIdAndClientId(
                assignedToDriver200.getId(), client300.getId())).isEmpty();
    }

    @Test
    @DisplayName("findByVehicleIdAndStatusIn filters by vehicle and status set")
    void vehicleStatusFiltering() {
        List<Shipment> activeOnVehicle10 = shipmentRepository.findByVehicleIdAndStatusIn(
                vehicle10.getId(), List.of("ASSIGNED", "IN_TRANSIT"));

        assertThat(activeOnVehicle10).hasSize(1);
        assertThat(activeOnVehicle10.get(0).getId()).isEqualTo(assignedToDriver200.getId());

        assertThat(shipmentRepository.findByVehicleIdAndStatusIn(
                vehicle10.getId(), List.of("DELIVERED"))).isEmpty();
    }

    @Test
    @DisplayName("findByClientId paginates per-tenant")
    void clientPagination() {
        var page = shipmentRepository.findByClientId(client100.getId(), PageRequest.of(0, 10));
        assertThat(page.getContent())
                .extracting(Shipment::getId)
                .containsExactlyInAnyOrder(
                        assignedToDriver200.getId(), inTransitOtherDriver.getId());
        assertThat(page.getTotalElements()).isEqualTo(2);

        assertThat(shipmentRepository.findByClientId(client300.getId(), PageRequest.of(0, 10)))
                .extracting(Shipment::getId)
                .containsExactly(requestedForClient300.getId());
    }
}
