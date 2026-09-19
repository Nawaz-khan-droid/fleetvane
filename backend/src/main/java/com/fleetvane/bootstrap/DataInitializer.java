package com.fleetvane.bootstrap;

import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.driver.entity.DriverProfile;
import com.fleetvane.driver.repository.DriverProfileRepository;
import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shipment.repository.ShipmentRepository;
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
    }

    private void seedUsers() {
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = new User(adminEmail, passwordEncoder.encode(adminPassword), "System Administrator", "ADMIN");
            admin.setCompanyId(1L);
            admin.setStatus("ACTIVE");
            userRepository.save(admin);
        } else {
            User admin = userRepository.findByEmail(adminEmail).get();
            admin.setCompanyId(1L);
            admin.setStatus("ACTIVE");
            userRepository.save(admin);
        }
        if (userRepository.findByEmail(managerEmail).isEmpty()) {
            User manager = new User(managerEmail, passwordEncoder.encode(managerPassword), "Operations Manager", "MANAGER");
            manager.setCompanyId(1L);
            manager.setStatus("ACTIVE");
            userRepository.save(manager);
        } else {
            User manager = userRepository.findByEmail(managerEmail).get();
            manager.setCompanyId(1L);
            manager.setStatus("ACTIVE");
            userRepository.save(manager);
        }
        if (userRepository.findByEmail(clientEmail).isEmpty()) {
            User client = new User(clientEmail, passwordEncoder.encode(clientPassword), "Demo Client", "CLIENT");
            client.setCompanyId(1L);
            client.setStatus("ACTIVE");
            userRepository.save(client);
        } else {
            User client = userRepository.findByEmail(clientEmail).get();
            client.setCompanyId(1L);
            client.setStatus("ACTIVE");
            userRepository.save(client);
        }
        String[] driverEmails = {"driver1@fleetvane.com", "driver2@fleetvane.com", "driver3@fleetvane.com"};
        String[] driverNames = {"Rajesh Kumar", "Priya Sharma", "Amit Singh"};
        for (int i = 0; i < driverEmails.length; i++) {
            if (userRepository.findByEmail(driverEmails[i]).isEmpty()) {
                User driver = new User(driverEmails[i], passwordEncoder.encode("Driver123!"), driverNames[i], "DRIVER");
                driver.setCompanyId(1L);
                driver.setStatus("ACTIVE");
                userRepository.save(driver);
            } else {
                User driver = userRepository.findByEmail(driverEmails[i]).get();
                driver.setCompanyId(1L);
                driver.setStatus("ACTIVE");
                userRepository.save(driver);
            }
        }
    }

    private void seedVehicles() {
        if (vehicleRepository.count() > 0) {
            vehicleRepository.findAll().forEach(v -> {
                if (v.getCompanyId() == null) {
                    v.setCompanyId(1L);
                    vehicleRepository.save(v);
                }
            });
            return;
        }

        Vehicle v1 = createVehicle("MH-01-AB-1234", "TRUCK", "Tata Prima", 15000.0, 30.0, "DIESEL", "IN_USE", 19.0760, 72.8777, 45.0, 1L);
        v1.setCompanyId(1L);
        Vehicle v2 = createVehicle("KA-03-CD-5678", "VAN", "Mahindra Bolero", 2000.0, 8.0, "ELECTRIC", "AVAILABLE", 12.9716, 77.5946, 90.0, 3L);
        v2.setCompanyId(1L);
        Vehicle v3 = createVehicle("DL-04-EF-9012", "TRUCK", "Ashok Leyland", 20000.0, 40.0, "DIESEL", "IN_USE", 28.7041, 77.1025, 180.0, 2L);
        v3.setCompanyId(1L);
        Vehicle v4 = createVehicle("TN-05-GH-3456", "VAN", "Eicher Pro", 3500.0, 12.0, "DIESEL", "AVAILABLE", 13.0827, 80.2707, 270.0, 5L);
        v4.setCompanyId(1L);
        Vehicle v5 = createVehicle("WB-06-IJ-7890", "TRUCK", "Tata Ace", 1500.0, 6.0, "PETROL", "AVAILABLE", 22.5726, 88.3639, 135.0, 6L);
        v5.setCompanyId(1L);

        vehicleRepository.saveAll(List.of(v1, v2, v3, v4, v5));
    }

    private Vehicle createVehicle(String plate, String type, String model, Double capacity, Double volume,
                                   String fuel, String status, Double lat, Double lng, Double heading, Long depotId) {
        Vehicle v = new Vehicle();
        v.setPlateNumber(plate);
        v.setType(type);
        v.setModel(model);
        v.setCapacity(capacity);
        v.setMaxVolumeM3(volume);
        v.setCurrentWeightKg(0.0);
        v.setCurrentVolumeM3(0.0);
        v.setFuelType(fuel);
        v.setStatus(status);
        v.setLat(lat);
        v.setLng(lng);
        v.setHeading(heading);
        v.setDepotId(depotId);
        return v;
    }

    private void seedDrivers() {
        if (driverProfileRepository.count() > 0) return;

        List<Vehicle> vehicles = vehicleRepository.findAll();
        String[] emails = {"driver1@fleetvane.com", "driver2@fleetvane.com", "driver3@fleetvane.com"};
        String[] licenses = {"MH-DL-2024-001", "KA-DL-2024-002", "DL-DL-2024-003"};

        for (int i = 0; i < emails.length && i < vehicles.size(); i++) {
            User user = userRepository.findByEmail(emails[i]).orElse(null);
            if (user != null) {
                DriverProfile profile = new DriverProfile(user.getId(), licenses[i], vehicles.get(i).getId(), true);
                driverProfileRepository.save(profile);
            }
        }
    }

    private void seedShipments() {
        if (shipmentRepository.count() > 0) return;

        Long clientId = userRepository.findByEmail(clientEmail).map(User::getId).orElse(1L);

        List<Vehicle> vehicles = vehicleRepository.findAll();
        Long v1 = vehicles.size() > 0 ? vehicles.get(0).getId() : null;
        Long v2 = vehicles.size() > 1 ? vehicles.get(1).getId() : null;
        Long v3 = vehicles.size() > 2 ? vehicles.get(2).getId() : null;
        Long v4 = vehicles.size() > 3 ? vehicles.get(3).getId() : null;
        Long v5 = vehicles.size() > 4 ? vehicles.get(4).getId() : null;

        List<User> drivers = userRepository.findAll().stream().filter(u -> "DRIVER".equals(u.getRole())).toList();
        Long d1 = drivers.size() > 0 ? drivers.get(0).getId() : null;
        Long d2 = drivers.size() > 1 ? drivers.get(1).getId() : null;
        Long d3 = drivers.size() > 2 ? drivers.get(2).getId() : null;
        Long d4 = drivers.size() > 3 ? drivers.get(3).getId() : null;
        Long d5 = drivers.size() > 4 ? drivers.get(4).getId() : null;

        // Mumbai cluster shipments
        saveShipment(clientId, "REQUESTED", "Mumbai Warehouse", 19.0596, 72.8295, "Pune Distribution Center", 18.5204, 73.8567, 800.0, 120, 80, 60);
        saveShipment(clientId, "ASSIGNED", "Mumbai Port", 19.0370, 72.8534, "Navi Mumbai Hub", 19.0330, 73.0297, 1200.0, 150, 100, 80, v1, d2);
        saveShipment(clientId, "IN_TRANSIT", "Andheri Depot", 19.1136, 72.8697, "Thane Office", 19.2183, 72.9781, 500.0, 80, 60, 40, v3, d1);

        // Bangalore cluster shipments
        saveShipment(clientId, "REQUESTED", "Whitefield Tech Park", 12.9698, 77.7500, "Electronic City", 12.8456, 77.6602, 300.0, 60, 40, 30);
        saveShipment(clientId, "DELIVERED", "Koramangala Hub", 12.9352, 77.6245, "Indiranagar Depot", 12.9784, 77.6408, 150.0, 50, 40, 30, v2, d2);
        saveShipment(clientId, "IN_TRANSIT", "HSR Layout", 12.9116, 77.6389, "BTM Extension", 12.9165, 77.6103, 650.0, 90, 70, 50, v2, d2);

        // Delhi cluster shipments
        saveShipment(clientId, "REQUESTED", "Connaught Place", 28.6315, 77.2167, "Gurgaon Cyber Hub", 28.4595, 77.0266, 2000.0, 200, 150, 100);
        saveShipment(clientId, "ASSIGNED", "Nehru Place", 28.5494, 77.2530, "Noida Sector 62", 28.6270, 77.3720, 1500.0, 180, 120, 90, v3, d3);
        saveShipment(clientId, "IN_TRANSIT", "Chandni Chowk", 28.6506, 77.2303, "Faridabad Industrial", 28.4089, 77.3178, 900.0, 110, 80, 60, v3, d3);
        saveShipment(clientId, "DELIVERED", "Karol Bagh", 28.6519, 77.1905, "Dwarka Sector 10", 28.5800, 77.0450, 400.0, 70, 50, 40, v3, d3);

        // Chennai + Kolkata
        saveShipment(clientId, "REQUESTED", "Chennai T. Nagar", 13.0418, 80.2341, "Chennai Port", 13.0850, 80.2950, 1100.0, 130, 90, 70);
        saveShipment(clientId, "ASSIGNED", "Kolkata Salt Lake", 22.5804, 88.4168, "Howrah Station", 22.5850, 88.3460, 750.0, 100, 70, 50, v5, d5 != null ? d5 : d1);
    }

    private void saveShipment(Long clientId, String status, String originAddr, Double oLat, Double oLng,
                               String destAddr, Double dLat, Double dLng, Double weight, int l, int w, int h) {
        saveShipment(clientId, status, originAddr, oLat, oLng, destAddr, dLat, dLng, weight, l, w, h, null, null);
    }

    private void saveShipment(Long clientId, String status, String originAddr, Double oLat, Double oLng,
                               String destAddr, Double dLat, Double dLng, Double weight, int l, int w, int h,
                               Long vehicleId, Long driverId) {
        Shipment s = new Shipment();
        s.setClientId(clientId);
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
