package com.cloudapp.socialforum.controller;

import com.cloudapp.socialforum.service.LikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/posts/{postId}/likes")
public class LikeController {

    @Autowired
    private LikeService likeService;

    @PostMapping
    public ResponseEntity<?> toggleLike(@PathVariable Long postId, @RequestParam Long userId) {
        try {
            Map<String, Object> response = likeService.toggleLike(postId, userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/count")
    public ResponseEntity<?> getLikeCount(@PathVariable Long postId) {
        long count = likeService.getLikeCount(postId);
        return ResponseEntity.ok(Map.of("likeCount", count));
    }

    @GetMapping("/status")
    public ResponseEntity<?> getLikeStatus(@PathVariable Long postId, @RequestParam Long userId) {
        boolean liked = likeService.isLikedByUser(postId, userId);
        long count = likeService.getLikeCount(postId);
        return ResponseEntity.ok(Map.of("liked", liked, "likeCount", count));
    }
}
