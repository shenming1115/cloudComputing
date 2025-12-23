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
            User admin = userRepository.findByUsername(adminUsername).orElse(new User());
            
            boolean isNew = admin.getId() == null;
            
            if (!isNew && "ADMIN".equals(admin.getRole())) {
                logger.info("Admin user '{}' already exists and has correct role. Skipping initialization.", adminUsername);
                return;
            }

            // Create or Update admin user
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);
            // Only update password if it's a new user or explicitly requested (here we enforce it)
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ADMIN");
            if (admin.getBio() == null) {
                admin.setBio("System Administrator");
            }
            if (admin.getCreatedAt() == null) {
                admin.setCreatedAt(LocalDateTime.now(ZoneId.of("Asia/Kuala_Lumpur")));
            }

            userRepository.save(admin);

            logger.info("========================================");
            logger.info("ADMIN USER {} SUCCESSFULLY", isNew ? "CREATED" : "UPDATED");
            logger.info("Username: {}", adminUsername);
            logger.info("Role: ADMIN");
            logger.info("========================================");
        };
    }
}
