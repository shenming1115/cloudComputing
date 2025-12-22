package com.cloudapp.socialforum.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

/**
 * S3 Service with Pre-signed URL support for secure private bucket access
 * All media is stored in a PRIVATE S3 bucket (Block All Public Access enabled)
 * Access is granted via temporary pre-signed URLs
 */
@Service
public class S3Service {

    private static final Logger logger = LoggerFactory.getLogger(S3Service.class);

    @Autowired
    private S3Client s3Client;

    @Autowired
    private S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name:social-forum-media}")
    private String bucketName;

    @Value("${aws.s3.region:ap-southeast-2}")
    private String region;

    /**
     * Generate pre-signed URL for uploading a file (PUT)
     * Valid for 15 minutes
     */
    public String generatePresignedUploadUrl(String folder, String fileExtension, String contentType) {
        String fileName = folder + "/" + UUID.randomUUID().toString() + fileExtension;
        
        logger.info("Generating pre-signed upload URL for: {}", fileName);

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
        
        String presignedUrl = presignedRequest.url().toString();
        logger.info("Pre-signed upload URL generated: {} (valid for 15 minutes)", fileName);
        
        return presignedUrl;
    }

    /**
     * Generate pre-signed URL for downloading/viewing a file (GET)
     * Valid for 1 hour
     */
    public String generatePresignedDownloadUrl(String s3Key) {
        logger.info("Generating pre-signed download URL for: {}", s3Key);

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(1))
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        
        String presignedUrl = presignedRequest.url().toString();
        logger.info("Pre-signed download URL generated for: {} (valid for 1 hour)", s3Key);
        
        return presignedUrl;
    }

    /**
     * Extract S3 key from S3 URL
     * Converts: https://bucket.s3.region.amazonaws.com/folder/file.jpg -> folder/file.jpg
     */
    public String extractS3KeyFromUrl(String s3Url) {
        if (s3Url == null || s3Url.isEmpty()) {
            return null;
        }
        
        // Handle both formats:
        // https://bucket.s3.region.amazonaws.com/folder/file.jpg
        // https://s3.region.amazonaws.com/bucket/folder/file.jpg
        
        if (s3Url.contains(bucketName + ".s3.")) {
            // Format 1: bucket.s3.region.amazonaws.com/key
            int keyStart = s3Url.indexOf(".amazonaws.com/") + 15;
            return s3Url.substring(keyStart);
        } else if (s3Url.contains(".amazonaws.com/" + bucketName + "/")) {
            // Format 2: s3.region.amazonaws.com/bucket/key
            int keyStart = s3Url.indexOf(bucketName + "/") + bucketName.length() + 1;
            return s3Url.substring(keyStart);
        }
        
        return s3Url; // Return as-is if format not recognized
    }

    /**
     * Legacy method: Direct upload (kept for backward compatibility)
     * For production, prefer using pre-signed URLs from frontend
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Generate unique filename
        String fileName = folder + "/" + UUID.randomUUID().toString() + fileExtension;
        
        logger.info("Uploading file to S3: {} (size: {} bytes)", fileName, file.getSize());

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(file.getContentType())
                    .build();

            PutObjectResponse response = s3Client.putObject(putObjectRequest, 
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Return S3 key instead of public URL (since bucket is private)
            String s3Key = fileName;
            
            logger.info("File uploaded successfully: {}", s3Key);
            return s3Key;
            
        } catch (Exception e) {
            logger.error("Failed to upload file to S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    public String uploadImage(MultipartFile file) throws IOException {
        return uploadFile(file, "images");
    }

    public String uploadVideo(MultipartFile file) throws IOException {
        return uploadFile(file, "videos");
    }

    public String uploadReel(MultipartFile file) throws IOException {
        return uploadFile(file, "reels");
    }
}
