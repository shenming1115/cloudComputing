package com.cloudapp.socialforum.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SharePostResponse {
    private Long postId;
    private String shareToken;
    private String shareUrl;
    private Integer shareCount;
    private String message;
}
