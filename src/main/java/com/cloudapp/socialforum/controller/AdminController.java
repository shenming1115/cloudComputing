package com.cloudapp.socialforum.controller;

import com.cloudapp.socialforum.model.User;
import com.cloudapp.socialforum.model.Post;
import com.cloudapp.socialforum.model.Comment;
import com.cloudapp.socialforum.repository.PostRepository;
import com.cloudapp.socialforum.repository.UserRepository;
import com.cloudapp.socialforum.repository.CommentRepository;
import com.cloudapp.socialforum.service.S3Service;
import com.cloudapp.socialforum.service.UserService;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private S3Service s3Service;
    
    @Autowired
    private MeterRegistry meterRegistry;

    @Value("${aws.s3.bucket-name:social-forum-media}")
    private String bucketName;

    // --- User Management ---

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<Map<String, Object>> userDtos = users.stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("email", user.getEmail());
            map.put("role", user.getRole());
            map.put("createdAt", user.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(userDtos);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            // ADMIN ABSOLUTE AUTHORITY: Physical deletion from both RDS and S3
            // This will cascade delete all user's posts, comments, likes from RDS
            // AND delete all associated media files from S3
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of(
                "message", "User and all associated data deleted successfully (RDS + S3)",
                "userId", id
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete user: " + e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/promote")
    public ResponseEntity<?> promoteUser(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
            user.setRole("ADMIN");
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User promoted to ADMIN"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to promote user: " + e.getMessage()));
        }
    }

    // --- Post Management ---
    @GetMapping("/posts")
    public ResponseEntity<?> getAllPosts() {
        List<Post> posts = postRepository.findAll();
        // Map to DTO
        return ResponseEntity.ok(posts);
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        try {
            // ADMIN ABSOLUTE AUTHORITY: Physical deletion from both RDS and S3
            // This will delete the post from RDS AND delete associated media from S3
            Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
            
            // Use PostService which handles both RDS and S3 deletion
            postRepository.deleteById(id);
            
            // Manual S3 cleanup as backup
            if (post.getImageUrl() != null && !post.getImageUrl().isEmpty()) {
                try {
                    String key = extractS3KeyFromUrl(post.getImageUrl());
                    if (key != null && !key.isEmpty()) {
                        s3Service.deleteObject(key);
                    }
                } catch (Exception e) {
                    System.err.println("S3 cleanup warning: " + e.getMessage());
                }
            }
            
            if (post.getVideoUrl() != null && !post.getVideoUrl().isEmpty()) {
                try {
                    String key = extractS3KeyFromUrl(post.getVideoUrl());
                    if (key != null && !key.isEmpty()) {
                        s3Service.deleteObject(key);
                    }
                } catch (Exception e) {
                    System.err.println("S3 cleanup warning: " + e.getMessage());
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "message", "Post and associated media deleted successfully (RDS + S3)",
                "postId", id
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete post: " + e.getMessage()));
        }
    }
    
    /**
     * Extract S3 key from URL for deletion
     */
    private String extractS3KeyFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        
        String cleanUrl = url.contains("?") ? url.substring(0, url.indexOf("?")) : url;
        
        if (cleanUrl.contains(".amazonaws.com/")) {
            int keyStart = cleanUrl.lastIndexOf(".amazonaws.com/") + 15;
            return cleanUrl.substring(keyStart);
        } else if (cleanUrl.contains(".cloudfront.net/")) {
            int keyStart = cleanUrl.lastIndexOf(".cloudfront.net/") + 16;
            return cleanUrl.substring(keyStart);
        } else if (cleanUrl.contains("/")) {
            return cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);
        }
        
        return cleanUrl;
    }

    // --- Comment Management ---
    @GetMapping("/comments")
    public ResponseEntity<?> getAllComments() {
        List<Comment> comments = commentRepository.findAll();
        return ResponseEntity.ok(comments);
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id) {
        try {
            commentRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete comment: " + e.getMessage()));
        }
    }

    // --- S3 Storage Control ---

    @GetMapping("/s3/files")
    public ResponseEntity<?> listS3Files() {
        List<String> files = s3Service.listObjects();
        List<Map<String, String>> fileDtos = files.stream().map(key -> {
            Map<String, String> map = new HashMap<>();
            map.put("key", key);
            map.put("url", s3Service.generatePresignedDownloadUrl(key));
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(fileDtos);
    }

    @DeleteMapping("/s3/files")
    public ResponseEntity<?> deleteS3File(@RequestParam String key) {
        try {
            s3Service.deleteObject(key);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete file: " + e.getMessage()));
        }
    }

    @PostMapping("/s3/sync")
    public ResponseEntity<?> syncS3() {
        // 1. Get all files from S3
        List<String> s3Files = s3Service.listObjects();
        
        // 2. Get all image URLs from DB
        List<Post> posts = postRepository.findAll();
        Set<String> dbFiles = posts.stream()
            .filter(p -> p.getImageUrl() != null)
            .map(p -> {
                String url = p.getImageUrl();
                String key = url.substring(url.lastIndexOf("/") + 1);
                if (key.contains("?")) key = key.substring(0, key.indexOf("?"));
                return "images/" + key; // Assuming standard folder structure
            })
            .collect(Collectors.toSet());

        // 3. Find orphans (in S3 but not in DB)
        List<String> orphans = s3Files.stream()
            .filter(key -> !dbFiles.contains(key) && key.startsWith("images/")) // Only check images folder
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "totalS3Files", s3Files.size(),
            "totalDbImages", dbFiles.size(),
            "orphans", orphans
        ));
    }

    @PostMapping("/s3/cleanup")
    public ResponseEntity<?> cleanupOrphans(@RequestBody List<String> keys) {
        int deleted = 0;
        for (String key : keys) {
            try {
                s3Service.deleteObject(key);
                deleted++;
            } catch (Exception e) {
                // ignore
            }
        }
        return ResponseEntity.ok(Map.of("message", "Deleted " + deleted + " orphan files"));
    }

    // --- System Monitoring ---

    @GetMapping("/stats")
    public ResponseEntity<?> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Database Stats
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        long totalComments = commentRepository.count();
        
        stats.put("totalUsers", totalUsers);
        stats.put("totalPosts", totalPosts);
        stats.put("totalComments", totalComments);
        stats.put("userCount", totalUsers); // Alias for frontend
        stats.put("postCount", totalPosts); // Alias for frontend
        
        // CPU & Memory from Actuator
        try {
            Double cpuUsage = meterRegistry.get("system.cpu.usage").gauge().value();
            // Format as percentage string
            String cpuLoad = String.format("%.1f%%", cpuUsage * 100);
            stats.put("cpuLoad", cpuLoad);
            stats.put("systemCpu", cpuUsage);
            
            Double memoryUsed = meterRegistry.get("jvm.memory.used").gauge().value();
            stats.put("jvmMemory", memoryUsed);
            
            // Active Threads (approximate)
            stats.put("activeThreads", Thread.activeCount());
            
        } catch (Exception e) {
            stats.put("cpuLoad", "0.0%");
            stats.put("systemCpu", 0.0);
            stats.put("jvmMemory", 0.0);
            stats.put("activeThreads", 0);
        }

        // AWS Metadata (Mock if local)
        Map<String, String> awsMetadata = new HashMap<>();
        awsMetadata.put("region", "ap-southeast-2");
        awsMetadata.put("instanceId", System.getenv("EC2_INSTANCE_ID") != null ? System.getenv("EC2_INSTANCE_ID") : "i-local-dev");
        awsMetadata.put("availabilityZone", System.getenv("EC2_AVAILABILITY_ZONE") != null ? System.getenv("EC2_AVAILABILITY_ZONE") : "ap-southeast-2a");
        stats.put("awsMetadata", awsMetadata);

        // Mock DB Connections (Simulated)
        stats.put("dbConnections", 5 + (int)(Math.random() * 5));
        
        // AI Status
        stats.put("aiStatus", "ONLINE");

        return ResponseEntity.ok(stats);
    }

    @PostMapping("/maintenance/gc")
    public ResponseEntity<?> forceGc() {
        System.gc();
        return ResponseEntity.ok(Map.of("message", "Garbage Collection triggered"));
    }
}
