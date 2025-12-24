package com.cloudapp.socialforum.dto;

import com.cloudapp.socialforum.model.Post;
import com.cloudapp.socialforum.model.User;
import com.cloudapp.socialforum.service.S3Service;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostDTO {
    private Long id;
    private String content;
    private String imageUrl;
    private String videoUrl;
    private String mediaType;
    private String shareToken;
    private Integer shareCount;
    
    @JsonIgnoreProperties({"password"})
    private User user;
    
    private Integer commentsCount;
    private Integer likesCount;
    private LocalDateTime createdAt;

    /**
     * Convert Post entity to DTO
     * Note: URLs are S3 keys at this stage, will be converted to pre-signed URLs in service layer
     */
    public static PostDTO fromPost(Post post) {
        PostDTO dto = new PostDTO();
        dto.setId(post.getId());
        dto.setContent(post.getContent());
        dto.setImageUrl(post.getImageUrl());
        dto.setVideoUrl(post.getVideoUrl());
        dto.setMediaType(post.getMediaType());
        dto.setShareToken(post.getShareToken());
        dto.setShareCount(post.getShareCount());
        dto.setUser(post.getUser());
        dto.setCommentsCount(post.getComments() != null ? post.getComments().size() : 0);
        dto.setLikesCount(post.getLikes() != null ? post.getLikes().size() : 0);
        dto.setCreatedAt(post.getCreatedAt());
        return dto;
    }

    /**
     * Convert Post entity to DTO with pre-signed URLs for media access
     * S3 bucket is PRIVATE, all media access requires temporary pre-signed URLs
     */
    public static PostDTO fromPostWithPresignedUrls(Post post, S3Service s3Service) {
        PostDTO dto = fromPost(post);
        
        // Convert S3 keys to pre-signed URLs (valid for 1 hour)
        if (dto.getImageUrl() != null && !dto.getImageUrl().isEmpty()) {
            dto.setImageUrl(s3Service.generatePresignedDownloadUrl(dto.getImageUrl()));
        }
        
        if (dto.getVideoUrl() != null && !dto.getVideoUrl().isEmpty()) {
            dto.setVideoUrl(s3Service.generatePresignedDownloadUrl(dto.getVideoUrl()));
        }
        
        return dto;
    }
}
