package com.cloudapp.socialforum.controller;

import com.cloudapp.socialforum.service.S3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for S3 Pre-signed URL operations
 * Provides secure temporary URLs for uploading and viewing private S3 content
 */
@RestController
@RequestMapping("/api/s3")
public class S3Controller {

    @Autowired
    private S3Service s3Service;

    /**
     * Generate pre-signed URL for uploading media
     * POST /api/s3/presigned-upload
     * Body: { "folder": "images", "fileExtension": ".jpg", "contentType": "image/jpeg" }
     */
    @PostMapping("/presigned-upload")
    public ResponseEntity<?> generatePresignedUploadUrl(@RequestBody Map<String, String> request) {
        try {
            String folder = request.getOrDefault("folder", "images");
            String fileExtension = request.getOrDefault("fileExtension", ".jpg");
            String contentType = request.getOrDefault("contentType", "image/jpeg");

            String presignedUrl = s3Service.generatePresignedUploadUrl(folder, fileExtension, contentType);

            Map<String, Object> response = new HashMap<>();
            response.put("uploadUrl", presignedUrl);
            response.put("method", "PUT");
            response.put("expiresIn", "15 minutes");
            response.put("message", "Use PUT request to upload file to this URL");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to generate pre-signed upload URL: " + e.getMessage()));
        }
    }

    /**
     * Generate pre-signed URL for viewing/downloading media
     * POST /api/s3/presigned-download
     * Body: { "s3Key": "images/abc-123.jpg" }
     */
    @PostMapping("/presigned-download")
    public ResponseEntity<?> generatePresignedDownloadUrl(@RequestBody Map<String, String> request) {
        try {
            String s3Key = request.get("s3Key");
            
            if (s3Key == null || s3Key.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "s3Key is required"));
            }

            String presignedUrl = s3Service.generatePresignedDownloadUrl(s3Key);

            Map<String, Object> response = new HashMap<>();
            response.put("downloadUrl", presignedUrl);
            response.put("method", "GET");
            response.put("expiresIn", "1 hour");
            response.put("message", "Use GET request to access this URL");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to generate pre-signed download URL: " + e.getMessage()));
        }
    }

    /**
     * Convert S3 URL to pre-signed URL
     * POST /api/s3/convert-to-presigned
     * Body: { "s3Url": "https://bucket.s3.region.amazonaws.com/images/file.jpg" }
     */
    @PostMapping("/convert-to-presigned")
    public ResponseEntity<?> convertToPresignedUrl(@RequestBody Map<String, String> request) {
        try {
            String s3Url = request.get("s3Url");
            
            if (s3Url == null || s3Url.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "s3Url is required"));
            }

            String s3Key = s3Service.extractS3KeyFromUrl(s3Url);
            String presignedUrl = s3Service.generatePresignedDownloadUrl(s3Key);

            Map<String, Object> response = new HashMap<>();
            response.put("originalUrl", s3Url);
            response.put("s3Key", s3Key);
            response.put("presignedUrl", presignedUrl);
            response.put("expiresIn", "1 hour");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to convert URL: " + e.getMessage()));
        }
    }
}
