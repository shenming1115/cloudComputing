package com.cloudapp.socialforum.controller;

import com.cloudapp.socialforum.dto.CreatePostRequest;
import com.cloudapp.socialforum.dto.PostDTO;
import com.cloudapp.socialforum.dto.SharePostResponse;
import com.cloudapp.socialforum.model.Post;
import com.cloudapp.socialforum.service.PostService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @PostMapping
    public ResponseEntity<?> createPost(@Valid @RequestBody CreatePostRequest request) {
        Post post;
        if (request.getVideoUrl() != null || request.getMediaType() != null) {
            post = postService.createPost(
                request.getContent(), 
                request.getImageUrl(), 
                request.getVideoUrl(),
                request.getMediaType(),
                request.getUserId()
            );
        } else {
            post = postService.createPost(
                request.getContent(), 
                request.getImageUrl(), 
                request.getUserId()
            );
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    @GetMapping
    public ResponseEntity<?> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean paginated) {
        
        if (paginated) {
            if (page < 0 || size < 1 || size > 100) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid pagination parameters. Page must be >= 0, size must be between 1 and 100"));
            }
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Post> postsPage = postService.getAllPostsPaginated(pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("posts", postsPage.getContent());
            response.put("currentPage", postsPage.getNumber());
            response.put("totalPages", postsPage.getTotalPages());
            response.put("totalElements", postsPage.getTotalElements());
            response.put("hasNext", postsPage.hasNext());
            response.put("hasPrevious", postsPage.hasPrevious());
            
            return ResponseEntity.ok(response);
        } else {
            List<PostDTO> posts = postService.getAllPostsDTO();
            return ResponseEntity.ok(posts);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable Long id) {
        return postService.getPostDTOById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<?> generateShareLink(
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            String baseUrl = String.format("%s://%s:%d",
                request.getScheme(),
                request.getServerName(),
                request.getServerPort());
            
            String shareUrl = postService.generateShareLink(id, baseUrl);
            Post post = postService.incrementShareCount(id);
            
            SharePostResponse response = new SharePostResponse(
                post.getId(),
                post.getShareToken(),
                shareUrl,
                post.getShareCount(),
                "Share link generated successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/shared/{shareToken}")
    public ResponseEntity<?> getPostByShareToken(@PathVariable String shareToken) {
        return postService.getPostByShareToken(shareToken)
                .map(post -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("post", post);
                    response.put("message", "Post retrieved via share link");
                    response.put("shareCount", post.getShareCount());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Post not found with share token: " + shareToken)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Post>> getPostsByUserId(@PathVariable Long userId) {
        List<Post> posts = postService.getPostsByUserId(userId);
        return ResponseEntity.ok(posts);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        if (!postService.getPostById(id).isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Post not found with ID: " + id));
        }
        postService.deletePost(id);
        return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
    }
}
