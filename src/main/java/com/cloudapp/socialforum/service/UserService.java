package com.cloudapp.socialforum.service;

import com.cloudapp.socialforum.model.User;
import com.cloudapp.socialforum.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
@Transactional(readOnly = true)
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
        "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$"
    );

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private com.cloudapp.socialforum.repository.PostRepository postRepository;
    
    @Autowired
    private S3Service s3Service;

    @Transactional
    public User registerUser(String username, String email, String password) {
        logger.info("Registering new user: {}", username);
        
        // Validate inputs
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }
        
        // Validate password strength
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException(
                "Password must be at least 8 characters long and contain at least one digit, " +
                "one lowercase letter, one uppercase letter, and one special character (@#$%^&+=!)"
            );
        }
        
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("USER"); // Default role
        
        User savedUser = userRepository.save(user);
        logger.info("User registered successfully with ID: {} and role: {}", savedUser.getId(), savedUser.getRole());
        
        return savedUser;
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public boolean validateUser(String identifier, String password) {
        // identifier can be username or email
        Optional<User> user = userRepository.findByUsername(identifier);
        if (!user.isPresent()) {
            user = userRepository.findByEmail(identifier);
        }
        return user.isPresent() && passwordEncoder.matches(password, user.get().getPassword());
    }

    public Optional<User> findByUsernameOrEmail(String username, String email) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            return user;
        }
        return userRepository.findByEmail(email);
    }

    @Transactional
    public void deleteUser(Long userId) {
        logger.info("Deleting user with ID: {}", userId);
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        
        // ADMIN ABSOLUTE AUTHORITY: Delete all user's media from S3 before deleting user
        try {
            var userPosts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
            for (var post : userPosts) {
                // Delete image from S3 if exists
                if (post.getImageUrl() != null && !post.getImageUrl().isEmpty()) {
                    try {
                        String key = extractS3KeyFromUrl(post.getImageUrl());
                        if (key != null && !key.isEmpty()) {
                            s3Service.deleteObject(key);
                            logger.info("Deleted S3 image: {}", key);
                        }
                    } catch (Exception e) {
                        logger.error("Failed to delete S3 image: {}", e.getMessage());
                    }
                }
                
                // Delete video from S3 if exists
                if (post.getVideoUrl() != null && !post.getVideoUrl().isEmpty()) {
                    try {
                        String key = extractS3KeyFromUrl(post.getVideoUrl());
                        if (key != null && !key.isEmpty()) {
                            s3Service.deleteObject(key);
                            logger.info("Deleted S3 video: {}", key);
                        }
                    } catch (Exception e) {
                        logger.error("Failed to delete S3 video: {}", e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error during S3 cleanup for user {}: {}", userId, e.getMessage());
        }
        
        // JPA CascadeType.ALL on User entity will handle posts, comments, likes in RDS
        userRepository.deleteById(userId);
        logger.info("User and all associated data deleted successfully (RDS + S3)");
    }
    
    /**
     * Extract S3 key from URL for deletion
     */
    private String extractS3KeyFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        
        // Handle presigned URLs - strip query parameters
        String cleanUrl = url.contains("?") ? url.substring(0, url.indexOf("?")) : url;
        
        // Extract key from various URL formats
        if (cleanUrl.contains(".amazonaws.com/")) {
            int keyStart = cleanUrl.lastIndexOf(".amazonaws.com/") + 15;
            return cleanUrl.substring(keyStart);
        } else if (cleanUrl.contains(".cloudfront.net/")) {
            int keyStart = cleanUrl.lastIndexOf(".cloudfront.net/") + 16;
            return cleanUrl.substring(keyStart);
        } else if (cleanUrl.contains("/")) {
            // Assume it's already a key or path
            return cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);
        }
        
        return cleanUrl;
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
