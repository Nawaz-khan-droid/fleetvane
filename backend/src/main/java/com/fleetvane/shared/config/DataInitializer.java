package com.fleetvane.shared.config;

import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"dev", "demo"})
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
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
    }
}
