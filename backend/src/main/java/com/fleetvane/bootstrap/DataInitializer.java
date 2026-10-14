package com.fleetvane.bootstrap;

import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.driver.entity.DriverProfile;
import com.fleetvane.driver.repository.DriverProfileRepository;
import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shipment.repository.ShipmentRepository;
import com.fleetvane.shared.entity.Company;
import com.fleetvane.shared.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@Profile({"dev", "demo"})
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final ShipmentRepository shipmentRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String managerEmail;
    private final String managerPassword;
    private final String clientEmail;
    private final String clientPassword;

    public DataInitializer(UserRepository userRepository,
                           VehicleRepository vehicleRepository,
                           DriverProfileRepository driverProfileRepository,
                           ShipmentRepository shipmentRepository,
                           CompanyRepository companyRepository,
                           PasswordEncoder passwordEncoder,
                           @Value("${fleetvane.demo.admin-email:admin@fleetvane.com}") String adminEmail,
                           @Value("${fleetvane.demo.admin-password:Admin123!}") String adminPassword,
                           @Value("${fleetvane.demo.manager-email:manager@fleetvane.com}") String managerEmail,
                           @Value("${fleetvane.demo.manager-password:Manager123!}") String managerPassword,
                           @Value("${fleetvane.demo.client-email:client@fleetvane.com}") String clientEmail,
                           @Value("${fleetvane.demo.client-password:Client123!}") String clientPassword) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.shipmentRepository = shipmentRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.managerEmail = managerEmail;
        this.managerPassword = managerPassword;
        this.clientEmail = clientEmail;
        this.clientPassword = clientPassword;
    }

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedVehicles();
        seedDrivers();
        seedShipments();
        synchronizeActiveAssignments();
    }

    private void seedUsers() {
        Company transportCompany;
        Company shipperCompany;

        if (companyRepository.count() == 0) {
            transportCompany = companyRepository.save(new Company("Demo Transport Logistics", "TRANSPORT"));
            shipperCompany = companyRepository.save(new Company("Acme Corp", "SHIPPER"));
        } else {
            transportCompany = companyRepository.findByType("TRANSPORT").stream().findFirst().orElseGet(() -> companyRepository.save(new Company("Demo Transport Logistics", "TRANSPORT")));
            shipperCompany = companyRepository.findByType("SHIPPER").stream().findFirst().orElseGet(() -> companyRepository.save(new Company("Acme Corp", "SHIPPER")));
        }

        Long transportId = transportCompany.getId();
        Long shipperId = shipperCompany.getId();

        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = new User(adminEmail, passwordEncoder.encode(adminPassword), "System Administrator", "ADMIN");
            admin.setCompanyId(transportId);
            admin.setStatus("ACTIVE");
            userRepository.save(admin);
        } else {
            User admin = userRepository.findByEmail(adminEmail).get();
            admin.setCompanyId(transportId);
            admin.setStatus("ACTIVE");
            userRepository.save(admin);
        }
        if (userRepository.findByEmail(managerEmail).isEmpty()) {
            User manager = new User(managerEmail, passwordEncoder.encode(managerPassword), "Operations Manager", "MANAGER");
            manager.setCompanyId(transportId);
            manager.setStatus("ACTIVE");
            userRepository.save(manager);
        } else {
            User manager = userRepository.findByEmail(managerEmail).get();
            manager.setCompanyId(transportId);
            manager.setStatus("ACTIVE");
            userRepository.save(manager);
        }
        if (userRepository.findByEmail(clientEmail).isEmpty()) {
            User client = new User(clientEmail, passwordEncoder.encode(clientPassword), "Demo Client", "CLIENT");
            client.setCompanyId(shipperId);
            client.setStatus("ACTIVE");
            userRepository.save(client);
        } else {
            User client = userRepository.findByEmail(clientEmail).get();
            client.setCompanyId(shipperId);
            client.setStatus("ACTIVE");
            userRepository.save(client);
        }
        String[] driverEmails = {"driver1@fleetvane.com", "driver2@fleetvane.com", "driver3@fleetvane.com"};
        String[] driverNames = {"Rajesh Kumar", "Priya Sharma", "Amit Singh"};
        for (int i = 0; i < driverEmails.length; i++) {
            if (userRepository.findByEmail(driverEmails[i]).isEmpty()) {
                User driver = new User(driverEmails[i], passwordEncoder.encode("Driver123!"), driverNames[i], "DRIVER");
                driver.setCompanyId(transportId);
                driver.setStatus("ACTIVE");
                userRepository.save(driver);
            } else {
                User driver = userRepository.findByEmail(driverEmails[i]).get();
                driver.setCompanyId(transportId);
                driver.setStatus("ACTIVE");
                userRepository.save(driver);
            }
        }
    }

    private void seedVehicles() {
        Long transportId = companyRepository.findByType("TRANSPORT").stream().findFirst().map(Company::getId).orElse(1L);

        // Ensure 5 demo vehicles exist with accurate MMR locations
        createOrUpdateVehicle("MH-01-AB-1234", "TRUCK", "Tata Prima", 15000.0, 30.0, "DIESEL", "IN_USE", 19.0370, 72.8534, 45.0, 1L, transportId);
        createOrUpdateVehicle("MH-02-CD-5678", "VAN", "Mahindra Bolero", 2000.0, 8.0, "ELECTRIC", "IN_USE", 19.0660, 72.8680, 90.0, 3L, transportId);
        createOrUpdateVehicle("MH-04-EF-9012", "TRUCK", "Ashok Leyland", 20000.0, 40.0, "DIESEL", "IN_USE", 19.2967, 73.0631, 180.0, 2L, transportId);
        createOrUpdateVehicle("MH-46-GH-3456", "VAN", "Eicher Pro", 3500.0, 12.0, "DIESEL", "IN_USE", 18.9490, 72.9510, 270.0, 5L, transportId);
        createOrUpdateVehicle("MH-12-IJ-7890", "TRUCK", "Tata Ace", 1500.0, 6.0, "PETROL", "IN_USE", 18.7560, 73.8550, 135.0, 6L, transportId);
    }

    private void createOrUpdateVehicle(String plate, String type, String model, Double capacity, Double volume,
                                       String fuel, String status, Double lat, Double lng, Double heading, Long depotId, Long transportId) {
        Vehicle v = vehicleRepository.findAll().stream()
                .filter(veh -> plate.equalsIgnoreCase(veh.getPlateNumber()))
                .findFirst()
                .orElse(null);

        if (v == null) {
            v = new Vehicle();
            v.setPlateNumber(plate);
        }
        v.setType(type);
        v.setModel(model);
        v.setCapacity(capacity);
        v.setMaxVolumeM3(volume);
        v.setCurrentWeightKg(0.0);
        v.setCurrentVolumeM3(0.0);
        v.setFuelType(fuel);
        v.setStatus(status);
        // If vehicle drifted out to Nagpur (lat > 20) or was uninitialized, snap back to MMR
        if (v.getLat() == null || v.getLat() > 20.0 || v.getLng() == null || v.getLng() > 75.0) {
            v.setLat(lat);
            v.setLng(lng);
        }
        v.setHeading(heading);
        v.setDepotId(depotId);
        v.setCompanyId(transportId);
        vehicleRepository.save(v);
    }

    private void seedDrivers() {
        List<Vehicle> vehicles = vehicleRepository.findAll().stream()
                .filter(v -> v.getPlateNumber() != null && v.getPlateNumber().startsWith("MH-"))
                .sorted((a, b) -> a.getId().compareTo(b.getId()))
                .toList();

        String[] emails = {"driver1@fleetvane.com", "driver2@fleetvane.com", "driver3@fleetvane.com"};
        String[] licenses = {"MH-DL-2024-001", "KA-DL-2024-002", "DL-DL-2024-003"};

        for (int i = 0; i < emails.length && i < vehicles.size(); i++) {
            User user = userRepository.findByEmail(emails[i]).orElse(null);
            if (user != null) {
                Long vehicleId = vehicles.get(i).getId();
                DriverProfile profile = driverProfileRepository.findByUserId(user.getId()).orElse(null);
                if (profile == null) {
                    profile = new DriverProfile(user.getId(), licenses[i], vehicleId, true);
                } else {
                    profile.setVehicleId(vehicleId);
                    profile.setIsAvailable(true);
                    if (profile.getLicenseNumber() == null) {
                        profile.setLicenseNumber(licenses[i]);
                    }
                }
                driverProfileRepository.save(profile);
            }
        }
    }

    private void seedShipments() {
        Long clientId = userRepository.findByEmail(clientEmail).map(User::getId).orElse(1L);
        Long transportId = companyRepository.findByType("TRANSPORT").stream().findFirst().map(com.fleetvane.shared.entity.Company::getId).orElse(1L);

        List<Vehicle> vehicles = vehicleRepository.findAll().stream()
                .filter(v -> v.getPlateNumber() != null && v.getPlateNumber().startsWith("MH-"))
                .sorted((a, b) -> a.getId().compareTo(b.getId()))
                .toList();
        if (vehicles.isEmpty()) return;

        Long v1 = vehicles.size() > 0 ? vehicles.get(0).getId() : null;
        Long v2 = vehicles.size() > 1 ? vehicles.get(1).getId() : null;
        Long v3 = vehicles.size() > 2 ? vehicles.get(2).getId() : null;
        Long v4 = vehicles.size() > 3 ? vehicles.get(3).getId() : null;
        Long v5 = vehicles.size() > 4 ? vehicles.get(4).getId() : null;

        List<User> drivers = userRepository.findAll().stream().filter(u -> "DRIVER".equals(u.getRole())).toList();
        Long d1 = drivers.size() > 0 ? drivers.get(0).getId() : null;
        Long d2 = drivers.size() > 1 ? drivers.get(1).getId() : null;
        Long d3 = drivers.size() > 2 ? drivers.get(2).getId() : null;

        // Disconnect any legacy out-of-region shipments (Nagpur/Delhi/Bangalore/Kolkata) from demo vehicles
        List<Shipment> existing = shipmentRepository.findAll();
        for (Shipment s : existing) {
            String origin = s.getOriginAddress() != null ? s.getOriginAddress() : "";
            String dest = s.getDestinationAddress() != null ? s.getDestinationAddress() : "";
            if (origin.contains("Nagpur") || dest.contains("Nagpur")
                    || origin.contains("Delhi") || dest.contains("Delhi")
                    || origin.contains("Bangalore") || dest.contains("Bangalore")
                    || origin.contains("Kolkata") || dest.contains("Kolkata")
                    || origin.contains("Whitefield") || dest.contains("Whitefield")
                    || origin.contains("Connaught") || dest.contains("Connaught")
                    || origin.contains("HSR") || dest.contains("HSR")
                    || origin.contains("Nehru Place") || dest.contains("Nehru Place")
                    || origin.contains("Chandni Chowk") || dest.contains("Chandni Chowk")
                    || origin.contains("Salt Lake") || dest.contains("Salt Lake")
                    || (s.getDeliveryLatitude() != null && s.getDeliveryLatitude() > 20.0)) {
                if (s.getVehicleId() != null || !"DELIVERED".equals(s.getStatus())) {
                    s.setVehicleId(null);
                    s.setDriverId(null);
                    s.setStatus("DELIVERED");
                    shipmentRepository.save(s);
                }
            }
        }

        // Ensure each of the 5 demo vehicles has exactly one realistic active IN_TRANSIT consignment in MMR
        if (v1 != null && shipmentRepository.findByVehicleIdAndStatusIn(v1, List.of("ASSIGNED", "IN_TRANSIT")).isEmpty()) {
            saveShipment(clientId, "IN_TRANSIT", "Mumbai Port Container Terminal", 19.0370, 72.8534, "Navi Mumbai APMC Freight Hub", 19.0770, 72.9980, 4200.0, 150, 100, 80, v1, d1, transportId, "Heavy Machinery");
        }
        if (v2 != null && shipmentRepository.findByVehicleIdAndStatusIn(v2, List.of("ASSIGNED", "IN_TRANSIT")).isEmpty()) {
            saveShipment(clientId, "IN_TRANSIT", "Bandra Kurla Complex (BKC)", 19.0660, 72.8680, "Andheri SEEPZ IT Zone", 19.1230, 72.8740, 650.0, 80, 60, 40, v2, d2, transportId, "Electronics & Hardware");
        }
        if (v3 != null && shipmentRepository.findByVehicleIdAndStatusIn(v3, List.of("ASSIGNED", "IN_TRANSIT")).isEmpty()) {
            saveShipment(clientId, "IN_TRANSIT", "Bhiwandi Logistics Park", 19.2967, 73.0631, "Thane Wagle Industrial Estate", 19.1860, 72.9560, 7800.0, 200, 150, 100, v3, d3, transportId, "Textiles & Apparel");
        }
        if (v4 != null && shipmentRepository.findByVehicleIdAndStatusIn(v4, List.of("ASSIGNED", "IN_TRANSIT")).isEmpty()) {
            saveShipment(clientId, "IN_TRANSIT", "JNPT Port Terminal Nhava Sheva", 18.9490, 72.9510, "Panvel Express Freight Depot", 18.9902, 73.1277, 1100.0, 90, 70, 50, v4, d1, transportId, "Pharmaceuticals");
        }
        if (v5 != null && shipmentRepository.findByVehicleIdAndStatusIn(v5, List.of("ASSIGNED", "IN_TRANSIT")).isEmpty()) {
            saveShipment(clientId, "IN_TRANSIT", "Chakan Auto Industrial Hub", 18.7560, 73.8550, "Hinjewadi Tech Park Phase 1", 18.5910, 73.7380, 850.0, 110, 80, 60, v5, d2, transportId, "Automotive Components");
        }

        // Ensure pending REQUESTED shipments exist for live route optimization demonstration
        boolean hasPending = shipmentRepository.findByStatus("REQUESTED").size() >= 2;
        if (!hasPending) {
            saveShipment(clientId, "REQUESTED", "Dadar Commercial Center", 19.0178, 72.8478, "Kurla West Logistics Hub", 19.0726, 72.8845, 500.0, 70, 50, 40, null, null, transportId, "Consumer Retail");
            saveShipment(clientId, "REQUESTED", "Goregaon NESCO Exhibition Hub", 19.1550, 72.8550, "Borivali Western Depot", 19.2307, 72.8567, 920.0, 100, 70, 50, null, null, transportId, "FMCG Products");
            saveShipment(clientId, "REQUESTED", "Vashi Sector 17 Commercial Hub", 19.0660, 72.9980, "Airoli Knowledge Park", 19.1579, 72.9989, 450.0, 60, 40, 30, null, null, transportId, "Medical Supplies");
        }

        // Ensure at least one delivered historical record with complete proof exists
        boolean hasDelivered = shipmentRepository.findByStatus("DELIVERED").size() >= 1;
        if (!hasDelivered) {
            saveShipment(clientId, "DELIVERED", "Colaba Cargo Depot", 18.9067, 72.8147, "Worli Seaface Business Hub", 19.0166, 72.8166, 320.0, 50, 40, 30, v1, d1, transportId, "Express Documents");
        }
    }

    private void synchronizeActiveAssignments() {
        shipmentRepository.findAll().stream()
                .filter(s -> ("ASSIGNED".equals(s.getStatus())
                        || "DISPATCHED".equals(s.getStatus())
                        || "IN_TRANSIT".equals(s.getStatus()))
                        && s.getVehicleId() != null)
                .forEach(s -> {
                    vehicleRepository.findById(s.getVehicleId()).ifPresent(vehicle -> {
                        vehicle.setStatus("IN_USE");
                        vehicleRepository.save(vehicle);
                    });
                    if (s.getDriverId() != null) {
                        driverProfileRepository.findByUserId(s.getDriverId()).ifPresent(dp -> {
                            dp.setVehicleId(s.getVehicleId());
                            dp.setIsAvailable(true);
                            driverProfileRepository.save(dp);
                        });
                    }
                });
    }

    private void saveShipment(Long clientId, String status, String originAddr, Double oLat, Double oLng,
                               String destAddr, Double dLat, Double dLng, Double weight, int l, int w, int h) {
        Long transportId = companyRepository.findByType("TRANSPORT").stream().findFirst().map(com.fleetvane.shared.entity.Company::getId).orElse(1L);
        saveShipment(clientId, status, originAddr, oLat, oLng, destAddr, dLat, dLng, weight, l, w, h, null, null, transportId);
    }

    private void saveShipment(Long clientId, String status, String originAddr, Double oLat, Double oLng,
                               String destAddr, Double dLat, Double dLng, Double weight, int l, int w, int h,
                               Long vehicleId, Long driverId) {
        Long transportId = companyRepository.findByType("TRANSPORT").stream().findFirst().map(com.fleetvane.shared.entity.Company::getId).orElse(1L);
        saveShipment(clientId, status, originAddr, oLat, oLng, destAddr, dLat, dLng, weight, l, w, h, vehicleId, driverId, transportId);
    }

    private void saveShipment(Long clientId, String status, String originAddr, Double oLat, Double oLng,
                               String destAddr, Double dLat, Double dLng, Double weight, int l, int w, int h,
                               Long vehicleId, Long driverId, Long transportCompanyId) {
        saveShipment(clientId, status, originAddr, oLat, oLng, destAddr, dLat, dLng, weight, l, w, h, vehicleId, driverId, transportCompanyId, "General Freight");
    }

    private void saveShipment(Long clientId, String status, String originAddr, Double oLat, Double oLng,
                               String destAddr, Double dLat, Double dLng, Double weight, int l, int w, int h,
                               Long vehicleId, Long driverId, Long transportCompanyId, String category) {
        Shipment s = new Shipment();
        s.setClientId(clientId);
        s.setTransportCompanyId(transportCompanyId);
        s.setStatus(status);
        s.setOriginAddress(originAddr);
        s.setPickupLatitude(oLat);
        s.setPickupLongitude(oLng);
        s.setDestinationAddress(destAddr);
        s.setDeliveryLatitude(dLat);
        s.setDeliveryLongitude(dLng);
        s.setWeight(weight);
        s.setLengthCm((double) l);
        s.setWidthCm((double) w);
        s.setHeightCm((double) h);
        s.setVolumeM3((l * w * h) / 1_000_000.0);
        s.setVehicleId(vehicleId);
        s.setDriverId(driverId);
        s.setCategory(category != null ? category : "General Freight");
        if ("ASSIGNED".equals(status) || "IN_TRANSIT".equals(status)) {
            s.setAssignedAt(Instant.now().minus(2, ChronoUnit.HOURS));
        }
        if ("IN_TRANSIT".equals(status)) {
            s.setPickedUpAt(Instant.now().minus(1, ChronoUnit.HOURS));
        }
        if ("DELIVERED".equals(status)) {
            s.setAssignedAt(Instant.now().minus(24, ChronoUnit.HOURS));
            s.setPickedUpAt(Instant.now().minus(20, ChronoUnit.HOURS));
            s.setDeliveredAt(Instant.now().minus(4, ChronoUnit.HOURS));
        }
        shipmentRepository.save(s);
    }
}
