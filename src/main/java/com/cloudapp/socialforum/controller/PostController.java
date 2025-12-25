package com.cloudapp.socialforum.controller;

import com.cloudapp.socialforum.dto.CreatePostRequest;
import com.cloudapp.socialforum.dto.PostDTO;
import com.cloudapp.socialforum.dto.SharePostResponse;
import com.cloudapp.socialforum.model.Post;
import com.cloudapp.socialforum.model.User;
import com.cloudapp.socialforum.service.PostService;
import com.cloudapp.socialforum.service.S3Service;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private S3Service s3Service;

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
        
        try {
            // Always use pagination logic for consistency, even if paginated=false is passed
            // This fixes the issue where "No posts yet" is shown because the else block was missing or empty
            if (page < 0 || size < 1 || size > 100) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid pagination parameters. Page must be >= 0, size must be between 1 and 100"));
            }
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<PostDTO> postsPage = postService.getAllPostsPaginatedDTO(pageable);
            
            // Filter out any null DTOs if conversion failed completely
            List<PostDTO> postsWithUrls = postsPage.getContent().stream()
                    .filter(dto -> dto != null)
                    .collect(java.util.stream.Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("posts", postsWithUrls);
            response.put("currentPage", postsPage.getNumber());
            response.put("totalItems", postsPage.getTotalElements());
            response.put("totalPages", postsPage.getTotalPages());
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch posts", "details", e.getMessage()));
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
    public ResponseEntity<List<PostDTO>> getPostsByUserId(@PathVariable Long userId) {
        List<PostDTO> posts = postService.getPostsDTOByUserId(userId);
        return ResponseEntity.ok(posts);
    }

    /**
     * DELETE /api/posts/{id}
     * RBAC: Admins can delete any post (content moderation)
     *       Post owners can delete their own posts
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        try {
            // Get authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Authentication required"));
            }

            // Get current user from authentication principal
            User currentUser = (User) authentication.getPrincipal();
            
            // Get the post
            Post post = postService.getPostById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + id));
            
            // Authorization check: ADMIN can delete any post, users can delete their own
            boolean isAdmin = currentUser.getRole().equals("ADMIN");
            boolean isOwner = post.getUser() != null && post.getUser().getId().equals(currentUser.getId());
            
            if (!isAdmin && !isOwner) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                            "error", "Access denied",
                            "message", "You can only delete your own posts unless you are an administrator."
                        ));
            }
            
            // Delete the post
            postService.deletePost(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Post deleted successfully");
            response.put("deletedBy", isAdmin ? "ADMIN" : "OWNER");
            response.put("username", currentUser.getUsername());
            response.put("postId", id);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete post: " + e.getMessage()));
        }
    }
}
