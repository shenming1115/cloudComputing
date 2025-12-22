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
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<PostDTO> getAllPostsDTO() {
        return postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(post -> PostDTO.fromPostWithPresignedUrls(post, s3Service))
                .collect(Collectors.toList());
    }

    public Page<Post> getAllPostsPaginated(Pageable pageable) {
        logger.info("Fetching paginated posts - page: {}, size: {}", 
            pageable.getPageNumber(), pageable.getPageSize());
        return postRepository.findAllByOrderByCreatedAtDesc(pageable);
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
        postRepository.deleteById(id);
    }
}
