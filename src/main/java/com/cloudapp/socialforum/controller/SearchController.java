package com.cloudapp.socialforum.controller;

import com.cloudapp.socialforum.model.Post;
import com.cloudapp.socialforum.model.User;
import com.cloudapp.socialforum.repository.PostRepository;
import com.cloudapp.socialforum.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "all") String type) {
        
        try {
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Query parameter is required"));
            }

            Map<String, Object> response = new HashMap<>();
            
            switch (type.toLowerCase()) {
                case "people":
                    List<User> users = userRepository.searchUsers(query);
                    List<Map<String, Object>> userResults = users.stream()
                            .filter(user -> user != null) // Safety check
                            .map(user -> {
                                Map<String, Object> userMap = new HashMap<>();
                                userMap.put("id", user.getId());
                                userMap.put("username", user.getUsername());
                                userMap.put("email", user.getEmail());
                                userMap.put("avatarUrl", user.getAvatarUrl());
                                userMap.put("bio", user.getBio());
                                userMap.put("createdAt", user.getCreatedAt());
                                userMap.put("role", user.getRole());
                                return userMap;
                            })
                            .collect(Collectors.toList());
                    response.put("users", userResults);
                    response.put("count", userResults.size());
                    break;
                    
                case "tags":
                    List<Post> tagPosts = postRepository.searchByTag(query);
                    // Filter out posts with null users
                    List<Post> validTagPosts = tagPosts.stream()
                            .filter(post -> post != null && post.getUser() != null)
                            .collect(Collectors.toList());
                    response.put("posts", validTagPosts);
                    response.put("count", validTagPosts.size());
                    break;
                    
                case "all":
                default:
                    List<Post> posts = postRepository.searchByContent(query);
                    List<User> allUsers = userRepository.searchUsers(query);
                    
                    // Filter out posts with null users
                    List<Post> validPosts = posts.stream()
                            .filter(post -> post != null && post.getUser() != null)
                            .collect(Collectors.toList());
                    
                    List<Map<String, Object>> allUserResults = allUsers.stream()
                            .filter(user -> user != null) // Safety check
                            .map(user -> {
                                Map<String, Object> userMap = new HashMap<>();
                                userMap.put("id", user.getId());
                                userMap.put("username", user.getUsername());
                                userMap.put("email", user.getEmail());
                                userMap.put("avatarUrl", user.getAvatarUrl());
                                userMap.put("bio", user.getBio());
                                userMap.put("createdAt", user.getCreatedAt());
                                userMap.put("role", user.getRole());
                                return userMap;
                            })
                            .collect(Collectors.toList());
                    
                    response.put("posts", validPosts);
                    response.put("users", allUserResults);
                    response.put("postCount", validPosts.size());
                    response.put("userCount", allUserResults.size());
                    response.put("totalCount", validPosts.size() + allUserResults.size());
                    break;
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Search failed: " + e.getMessage()));
        }
    }
}
