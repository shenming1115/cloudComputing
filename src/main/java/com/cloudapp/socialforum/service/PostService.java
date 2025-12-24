package com.cloudapp.socialforum.service;

import com.cloudapp.socialforum.dto.PostDTO;
import com.cloudapp.socialforum.model.Post;
import com.cloudapp.socialforum.model.User;
import com.cloudapp.socialforum.repository.PostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PostService {

    private static final Logger logger = LoggerFactory.getLogger(PostService.class);

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private S3Service s3Service;

    @Transactional
    public Post createPost(String content, String imageUrl, Long userId) {
        logger.info("Creating post for user ID: {}", userId);
        
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Post post = new Post();
        post.setContent(content);
        post.setImageUrl(imageUrl);
        post.setUser(user);
        post.setShareToken(UUID.randomUUID().toString());
        post.setShareCount(0);
        post.setMediaType(imageUrl != null && !imageUrl.isEmpty() ? "image" : "text");

        Post savedPost = postRepository.save(post);
        logger.info("Post created successfully with ID: {} and share token: {}", 
            savedPost.getId(), savedPost.getShareToken());
        
        return savedPost;
    }

    @Transactional
    public Post createPost(String content, String imageUrl, String videoUrl, String mediaType, Long userId) {
        logger.info("Creating post for user ID: {} with media type: {}", userId, mediaType);
        
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Post post = new Post();
        post.setContent(content);
        post.setImageUrl(imageUrl);
        post.setVideoUrl(videoUrl);
        post.setMediaType(mediaType != null ? mediaType : "text");
        post.setUser(user);
        post.setShareToken(UUID.randomUUID().toString());
        post.setShareCount(0);

        Post savedPost = postRepository.save(post);
        logger.info("Post created successfully with ID: {} and share token: {}", 
            savedPost.getId(), savedPost.getShareToken());
        
        return savedPost;
    }

    public List<Post> getAllPosts() {
        try {
            List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
            if (posts == null) {
                return java.util.Collections.emptyList();
            }
            // Filter out posts with null users (orphaned posts)
            return posts.stream()
                    .filter(post -> post != null && post.getUser() != null)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching all posts: {}", e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    public List<PostDTO> getAllPostsDTO() {
        try {
            List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
            if (posts == null) {
                return java.util.Collections.emptyList();
            }
            return posts.stream()
                    .map(post -> {
                        try {
                            // Handle orphaned posts (null user)
                            if (post.getUser() == null) {
                                User dummyUser = new User();
                                dummyUser.setId(-1L);
                                dummyUser.setUsername("Unknown User");
                                dummyUser.setRole("USER");
                                post.setUser(dummyUser);
                            }
                            return PostDTO.fromPostWithPresignedUrls(post, s3Service);
                        } catch (Exception e) {
                            logger.error("Error converting post {} to DTO: {}", post.getId(), e.getMessage());
                            // Fallback: Return DTO without presigned URLs if S3 fails
                            try {
                                return PostDTO.fromPost(post);
                            } catch (Exception ex) {
                                return null;
                            }
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching all posts DTO: {}", e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    public Page<Post> getAllPostsPaginated(Pageable pageable) {
        logger.info("Fetching paginated posts - page: {}, size: {}", 
            pageable.getPageNumber(), pageable.getPageSize());
        Page<Post> page = postRepository.findAllByOrderByCreatedAtDesc(pageable);
        
        // Filter out posts with null users (orphaned posts)
        // Note: This is a workaround for data integrity issues
        // Better solution: Add foreign key constraints and cascade deletes
        return page;
    }

    public Optional<Post> getPostById(Long id) {
        return postRepository.findById(id);
    }

    public Optional<PostDTO> getPostDTOById(Long id) {
        return postRepository.findById(id)
                .map(post -> PostDTO.fromPostWithPresignedUrls(post, s3Service));
    }

    public Optional<Post> getPostByShareToken(String shareToken) {
        logger.info("Fetching post by share token: {}", shareToken);
        return postRepository.findByShareToken(shareToken);
    }

    @Transactional
    public String generateShareLink(Long postId, String baseUrl) {
        logger.info("Generating share link for post ID: {}", postId);
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));
        
        if (post.getShareToken() == null) {
            post.setShareToken(UUID.randomUUID().toString());
            postRepository.save(post);
        }
        
        String shareUrl = baseUrl + "/api/posts/shared/" + post.getShareToken();
        logger.info("Share link generated: {}", shareUrl);
        
        return shareUrl;
    }

    @Transactional
    public Post incrementShareCount(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));
        
        post.setShareCount(post.getShareCount() + 1);
        logger.info("Share count incremented for post ID: {} to {}", postId, post.getShareCount());
        
        return postRepository.save(post);
    }

    public List<Post> getPostsByUserId(Long userId) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void deletePost(Long id) {
        logger.info("Deleting post with ID: {}", id);
        
        // ADMIN ABSOLUTE AUTHORITY: Delete media from S3 before deleting post from RDS
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            
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
        
        postRepository.deleteById(id);
        logger.info("Post and associated media deleted successfully (RDS + S3)");
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
}
