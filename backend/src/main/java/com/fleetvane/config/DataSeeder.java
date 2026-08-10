package com.fleetvane.config;

import com.fleetvane.model.Delivery;
import com.fleetvane.model.Truck;
import com.fleetvane.model.User;
import com.fleetvane.repository.DeliveryRepository;
import com.fleetvane.repository.TruckRepository;
import com.fleetvane.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TruckRepository truckRepository;
    private final DeliveryRepository deliveryRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, TruckRepository truckRepository, DeliveryRepository deliveryRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.truckRepository = truckRepository;
        this.deliveryRepository = deliveryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            User manager = User.builder()
                    .email("manager@fleetvane.com")
                    .password(passwordEncoder.encode("password123"))
                    .name("Fleet Manager")
                    .role("FLEET_MANAGER")
                    .build();

            User driver1 = User.builder()
                    .email("driver1@fleetvane.com")
                    .password(passwordEncoder.encode("password123"))
                    .name("Driver One")
                    .role("DELIVERY_DRIVER")
                    .build();

            User driver2 = User.builder()
                    .email("driver2@fleetvane.com")
                    .password(passwordEncoder.encode("password123"))
                    .name("Driver Two")
                    .role("DELIVERY_DRIVER")
                    .build();

            User client = User.builder()
                    .email("client@fleetvane.com")
                    .password(passwordEncoder.encode("password123"))
                    .name("Client One")
                    .role("CLIENT")
                    .build();

            userRepository.saveAll(Arrays.asList(manager, driver1, driver2, client));

            Truck truck1 = Truck.builder()
                    .plateNumber("MH01AB1234")
                    .model("Tata Ace")
                    .status("IN_TRANSIT")
                    .lat(19.076)
                    .lng(72.8777)
                    .manager(manager)
                    .build();

            Truck truck2 = Truck.builder()
                    .plateNumber("MH02CD5678")
                    .model("Ashok Leyland Dost")
                    .status("IDLE")
                    .lat(19.082)
                    .lng(72.881)
                    .manager(manager)
                    .build();

            Truck truck3 = Truck.builder()
                    .plateNumber("MH03EF9012")
                    .model("Mahindra Bolero")
                    .status("OFFLINE")
                    .lat(19.09)
                    .lng(72.89)
                    .manager(manager)
                    .build();

            Truck truck4 = Truck.builder()
                    .plateNumber("MH04GH3456")
                    .model("Tata 407")
                    .status("DELAYED")
                    .lat(19.05)
                    .lng(72.85)
                    .manager(manager)
                    .build();

            Truck truck5 = Truck.builder()
                    .plateNumber("MH05IJ7890")
                    .model("Eicher Pro")
                    .status("IN_TRANSIT")
                    .lat(19.06)
                    .lng(72.86)
                    .manager(manager)
                    .build();

            truckRepository.saveAll(Arrays.asList(truck1, truck2, truck3, truck4, truck5));

            Delivery d1 = Delivery.builder()
                    .address("Andheri West, Mumbai")
                    .lat(19.1197)
                    .lng(72.8464)
                    .sequenceOrder(1)
                    .status("IN_PROGRESS")
                    .truck(truck1)
                    .build();

            Delivery d2 = Delivery.builder()
                    .address("Bandra East, Mumbai")
                    .lat(19.0596)
                    .lng(72.8400)
                    .sequenceOrder(1)
                    .status("PENDING")
                    .truck(truck2)
                    .build();

            deliveryRepository.saveAll(Arrays.asList(d1, d2));
        }
    }
}
