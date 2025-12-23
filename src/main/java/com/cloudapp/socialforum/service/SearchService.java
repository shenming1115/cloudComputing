package com.cloudapp.socialforum.service;

import com.cloudapp.socialforum.model.Post;
import com.cloudapp.socialforum.model.User;
import com.cloudapp.socialforum.repository.PostRepository;
import com.cloudapp.socialforum.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SearchService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    public Map<String, Object> search(String query, String type) {
        Map<String, Object> response = new HashMap<>();
        
        if (query == null || query.trim().isEmpty()) {
            response.put("users", Collections.emptyList());
            response.put("posts", Collections.emptyList());
            response.put("count", 0);
            return response;
        }

        try {
            switch (type.toLowerCase()) {
                case "people":
                    List<User> users = userRepository.searchUsers(query);
                    List<Map<String, Object>> userResults = mapUsers(users);
                    response.put("users", userResults);
                    response.put("posts", Collections.emptyList());
                    response.put("count", userResults.size());
                    break;
                    
                case "tags":
                    List<Post> tagPosts = postRepository.searchByTag(query);
                    List<Post> validTagPosts = filterValidPosts(tagPosts);
                    response.put("posts", validTagPosts);
                    response.put("users", Collections.emptyList());
                    response.put("count", validTagPosts.size());
                    break;
                    
                case "all":
                default:
                    List<Post> posts = postRepository.searchByContent(query);
                    List<User> allUsers = userRepository.searchUsers(query);
                    
                    List<Post> validPosts = filterValidPosts(posts);
                    List<Map<String, Object>> allUserResults = mapUsers(allUsers);
                    
                    response.put("posts", validPosts);
                    response.put("users", allUserResults);
                    response.put("count", validPosts.size() + allUserResults.size());
                    break;
            }
        } catch (Exception e) {
            // Log error but return empty results
            System.err.println("Search error: " + e.getMessage());
            response.put("users", Collections.emptyList());
            response.put("posts", Collections.emptyList());
            response.put("count", 0);
        }
        
        return response;
    }

    private List<Post> filterValidPosts(List<Post> posts) {
        if (posts == null) return Collections.emptyList();
        return posts.stream()
                .filter(post -> post != null && post.getUser() != null)
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> mapUsers(List<User> users) {
        if (users == null) return Collections.emptyList();
        return users.stream()
                .filter(user -> user != null)
                .map(this::mapUserToResult)
                .collect(Collectors.toList());
    }

    private Map<String, Object> mapUserToResult(User user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("username", user.getUsername());
        userMap.put("email", user.getEmail());
        userMap.put("avatarUrl", user.getAvatarUrl());
        userMap.put("bio", user.getBio());
        userMap.put("createdAt", user.getCreatedAt());
        userMap.put("role", user.getRole());
        return userMap;
    }
}
