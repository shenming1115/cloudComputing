package com.cloudapp.socialforum.controller;

import com.cloudapp.socialforum.service.S3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Autowired
    private S3Service s3Service;

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = s3Service.uploadImage(file);
            Map<String, Object> response = new HashMap<>();
            response.put("url", imageUrl);
            response.put("message", "Image uploaded successfully");
            response.put("type", "image");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    @PostMapping("/video")
    public ResponseEntity<?> uploadVideo(@RequestParam("file") MultipartFile file) {
        try {
            String videoUrl = s3Service.uploadVideo(file);
            Map<String, Object> response = new HashMap<>();
            response.put("url", videoUrl);
            response.put("message", "Video uploaded successfully");
            response.put("type", "video");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload video: " + e.getMessage()));
        }
    }

    @PostMapping("/reel")
    public ResponseEntity<?> uploadReel(@RequestParam("file") MultipartFile file) {
        try {
            String reelUrl = s3Service.uploadReel(file);
            Map<String, Object> response = new HashMap<>();
            response.put("url", reelUrl);
            response.put("message", "Reel uploaded successfully");
            response.put("type", "reel");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload reel: " + e.getMessage()));
        }
    }
}
