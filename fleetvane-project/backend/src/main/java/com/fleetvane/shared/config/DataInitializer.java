package com.fleetvane.shared.config;

import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.driver.entity.DriverProfile;
import com.fleetvane.driver.repository.DriverProfileRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"dev", "demo"})
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final com.fleetvane.fleet.repository.VehicleRepository vehicleRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           com.fleetvane.fleet.repository.VehicleRepository vehicleRepository,
                           DriverProfileRepository driverProfileRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("admin@fleetvane.com").isEmpty()) {
            User admin = new User(
                    "admin@fleetvane.com",
                    passwordEncoder.encode("Admin123!"),
                    "System Administrator",
                    "ADMIN"
            );
            userRepository.save(admin);
        }

        if (userRepository.findByEmail("manager@fleetvane.com").isEmpty()) {
            User manager = new User(
                    "manager@fleetvane.com",
                    passwordEncoder.encode("Manager123!"),
                    "Operations Manager",
                    "MANAGER"
            );
            userRepository.save(manager);
        }
        
        // Seed Vehicles for Fleet tracking demo
        if (vehicleRepository.count() == 0) {
            com.fleetvane.fleet.entity.Vehicle v1 = new com.fleetvane.fleet.entity.Vehicle();
            v1.setPlateNumber("MH-01-AB-1234");
            v1.setType("TRUCK");
            v1.setModel("Tata Prima");
            v1.setCapacity(15000.0);
            v1.setStatus("IN_USE");
            v1.setFuelType("DIESEL");
            v1.setLat(19.0760);
            v1.setLng(72.8777); // Mumbai
            v1.setHeading(45.0);
            
            com.fleetvane.fleet.entity.Vehicle v2 = new com.fleetvane.fleet.entity.Vehicle();
            v2.setPlateNumber("KA-03-CD-5678");
            v2.setType("VAN");
            v2.setModel("Mahindra Bolero");
            v2.setCapacity(2000.0);
            v2.setStatus("AVAILABLE");
            v2.setFuelType("ELECTRIC");
            v2.setLat(12.9716);
            v2.setLng(77.5946); // Bangalore
            v2.setHeading(90.0);
            
            com.fleetvane.fleet.entity.Vehicle v3 = new com.fleetvane.fleet.entity.Vehicle();
            v3.setPlateNumber("DL-04-EF-9012");
            v3.setType("TRUCK");
            v3.setModel("Ashok Leyland");
            v3.setCapacity(20000.0);
            v3.setStatus("IN_USE");
            v3.setFuelType("DIESEL");
            v3.setLat(28.7041);
            v3.setLng(77.1025); // Delhi
            v3.setHeading(180.0);
            
            vehicleRepository.save(v1);
            vehicleRepository.save(v2);
            vehicleRepository.save(v3);
        }

        if (userRepository.findByEmail("client@fleetvane.com").isEmpty()) {
            User client = new User(
                    "client@fleetvane.com",
                    passwordEncoder.encode("Client123!"),
                    "Demo Client",
                    "CLIENT"
            );
            userRepository.save(client);
        }

        if (userRepository.findByEmail("driver@fleetvane.com").isEmpty()) {
            User driver = new User(
                    "driver@fleetvane.com",
                    passwordEncoder.encode("Driver123!"),
                    "Demo Driver",
                    "DRIVER"
            );
            userRepository.save(driver);
        }

        if (driverProfileRepository.count() == 0) {
            User driver = userRepository.findByEmail("driver@fleetvane.com").orElse(null);
            Long firstVehicleId = vehicleRepository.findAll().stream()
                    .map(com.fleetvane.fleet.entity.Vehicle::getId)
                    .findFirst()
                    .orElse(null);
            if (driver != null) {
                DriverProfile profile = new DriverProfile(
                        driver.getId(),
                        "DL-DEMO-2026-001",
                        firstVehicleId,
                        true
                );
                driverProfileRepository.save(profile);
            }
        }
    }
}
