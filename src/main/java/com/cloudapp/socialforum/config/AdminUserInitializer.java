package com.cloudapp.socialforum.config;

import com.cloudapp.socialforum.model.User;
import com.cloudapp.socialforum.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Admin User Initializer
 * Creates default admin user on application startup if it doesn't exist
 */
@Configuration
public class AdminUserInitializer {

    private static final Logger logger = LoggerFactory.getLogger(AdminUserInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Bean
    public ApplicationRunner initializeAdminUser() {
        return args -> {
            String adminUsername = "admin123";
            String adminPassword = "pxTUxZPBBmgk3XD";
            String adminEmail = "admin@socialforum.com";

            // Check if admin user already exists
            if (userRepository.findByUsername(adminUsername).isPresent()) {
                logger.info("Admin user '{}' already exists. Skipping initialization.", adminUsername);
                return;
            }

            // Create admin user
            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ADMIN");
            admin.setBio("System Administrator");
            admin.setCreatedAt(LocalDateTime.now(ZoneId.of("Asia/Kuala_Lumpur")));

            userRepository.save(admin);

            logger.info("========================================");
            logger.info("ADMIN USER CREATED SUCCESSFULLY");
            logger.info("Username: {}", adminUsername);
            logger.info("Password: {}", adminPassword);
            logger.info("Role: ADMIN");
            logger.info("========================================");
        };
    }
}
