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
        
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Query parameter is required"));
        }

        Map<String, Object> response = new HashMap<>();
        
        switch (type.toLowerCase()) {
            case "people":
                List<User> users = userRepository.searchUsers(query);
                List<Map<String, Object>> userResults = users.stream()
                        .map(user -> {
                            Map<String, Object> userMap = new HashMap<>();
                            userMap.put("id", user.getId());
                            userMap.put("username", user.getUsername());
                            userMap.put("email", user.getEmail());
                            userMap.put("avatarUrl", user.getAvatarUrl());
                            userMap.put("bio", user.getBio());
                            userMap.put("createdAt", user.getCreatedAt());
                            return userMap;
                        })
                        .collect(Collectors.toList());
                response.put("users", userResults);
                response.put("count", userResults.size());
                break;
                
            case "tags":
                List<Post> tagPosts = postRepository.searchByTag(query);
                response.put("posts", tagPosts);
                response.put("count", tagPosts.size());
                break;
                
            case "all":
            default:
                List<Post> posts = postRepository.searchByContent(query);
                List<User> allUsers = userRepository.searchUsers(query);
                
                List<Map<String, Object>> allUserResults = allUsers.stream()
                        .map(user -> {
                            Map<String, Object> userMap = new HashMap<>();
                            userMap.put("id", user.getId());
                            userMap.put("username", user.getUsername());
                            userMap.put("email", user.getEmail());
                            userMap.put("avatarUrl", user.getAvatarUrl());
                            userMap.put("bio", user.getBio());
                            userMap.put("createdAt", user.getCreatedAt());
                            return userMap;
                        })
                        .collect(Collectors.toList());
                
                response.put("posts", posts);
                response.put("users", allUserResults);
                response.put("postCount", posts.size());
                response.put("userCount", allUserResults.size());
                response.put("totalCount", posts.size() + allUserResults.size());
                break;
        }
        
        return ResponseEntity.ok(response);
    }
}
