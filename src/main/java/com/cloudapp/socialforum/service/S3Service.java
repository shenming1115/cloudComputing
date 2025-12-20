package com.cloudapp.socialforum.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.IOException;
import java.util.UUID;

@Service
public class S3Service {

    private static final Logger logger = LoggerFactory.getLogger(S3Service.class);

    @Autowired
    private S3Client s3Client;

    @Value("${aws.s3.bucket-name:social-forum-media}")
    private String bucketName;

    @Value("${aws.s3.region:ap-southeast-2}")
    private String region;

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

            String fileUrl = String.format("https://%s.s3.%s.amazonaws.com/%s", 
                    bucketName, region, fileName);
            
            logger.info("File uploaded successfully: {}", fileUrl);
            return fileUrl;
            
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
