package com.cloudapp.socialforum.service;

import com.cloudapp.socialforum.model.Like;
import com.cloudapp.socialforum.model.Post;
import com.cloudapp.socialforum.model.User;
import com.cloudapp.socialforum.repository.LikeRepository;
import com.cloudapp.socialforum.repository.PostRepository;
import com.cloudapp.socialforum.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class LikeService {

    private static final Logger logger = LoggerFactory.getLogger(LikeService.class);

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Map<String, Object> toggleLike(Long postId, Long userId) {
        logger.info("Toggle like for post ID: {} by user ID: {}", postId, userId);
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Map<String, Object> response = new HashMap<>();
        
        if (likeRepository.existsByUserIdAndPostId(userId, postId)) {
            // Unlike
            likeRepository.deleteByUserIdAndPostId(userId, postId);
            long likeCount = likeRepository.countByPostId(postId);
            
            response.put("liked", false);
            response.put("likeCount", likeCount);
            response.put("message", "Post unliked successfully");
            
            logger.info("Post {} unliked by user {}. New like count: {}", postId, userId, likeCount);
        } else {
            // Like
            Like like = new Like();
            like.setPost(post);
            like.setUser(user);
            likeRepository.save(like);
            
            long likeCount = likeRepository.countByPostId(postId);
            
            response.put("liked", true);
            response.put("likeCount", likeCount);
            response.put("message", "Post liked successfully");
            
            logger.info("Post {} liked by user {}. New like count: {}", postId, userId, likeCount);
        }
        
        return response;
    }

    public long getLikeCount(Long postId) {
        return likeRepository.countByPostId(postId);
    }

    public boolean isLikedByUser(Long postId, Long userId) {
        return likeRepository.existsByUserIdAndPostId(userId, postId);
    }
}
