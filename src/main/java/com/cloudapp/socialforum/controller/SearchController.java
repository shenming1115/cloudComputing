package com.cloudapp.socialforum.controller;

import com.cloudapp.socialforum.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private SearchService searchService;

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "all") String type) {
        
        try {
            Map<String, Object> results = searchService.search(query, type);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "users", Collections.emptyList(),
                "posts", Collections.emptyList(),
                "error", "Search failed: " + e.getMessage()
            ));
        }
    }
}
