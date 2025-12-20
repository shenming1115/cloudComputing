package com.cloudapp.socialforum.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {
    
    @NotBlank(message = "Content is required")
    @Size(max = 5000, message = "Content cannot exceed 5000 characters")
    private String content;

    @Size(max = 500, message = "Image URL cannot exceed 500 characters")
    private String imageUrl;

    @Size(max = 500, message = "Video URL cannot exceed 500 characters")
    private String videoUrl;

    @Size(max = 20, message = "Media type cannot exceed 20 characters")
    private String mediaType; // "image", "video", "reel", "text"

    @NotNull(message = "User ID is required")
    private Long userId;
}

