package com.cloudapp.socialforum.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * AI Assistant Service - Cloudflare Worker Integration
 * 
 * This service integrates with a Cloudflare Worker that implements:
 * - Race condition between GPT and Gemini for ultra-low latency
 * - Context-aware AI responses using platform knowledge base
 * - System prompt injection with SocialApp platform details
 * 
 * Environment Variables Required:
 * - CLOUDFLARE_WORKER_URL: Your Cloudflare Worker endpoint URL
 * - AI_WORKER_API_KEY: Optional API key for worker authentication
 */
@Service
public class AIAssistantService {

    private final WebClient webClient;
    private final String workerUrl;
    private final String apiKey;

    // Platform Context for AI Knowledge Base Injection
    private static final String SYSTEM_PROMPT = """
        You are "SocialApp Assistant", an expert AI helper for this specific social media platform.
        
        Language Capabilities:
        - You are fluent in English, Chinese (华文), and Malay (Bahasa Melayu).
        - Always reply in the same language as the user's message unless requested otherwise.
        - If the user asks to switch languages, do so immediately.
        
        Platform Identity: SocialApp - A secure, cloud-native social media platform built on AWS.
        
        Platform Features:
        - Users can share text posts, images, and videos
        - All media content is securely stored in private AWS S3 buckets
        - Users can interact through likes, comments, and shares
        - Advanced search functionality with filters
        - Real-time content moderation by administrators
        
        Moderation Rules:
        - Administrators have full power to maintain community standards
        - Admins can delete any post or comment that violates guidelines
        - User reports are reviewed within 24 hours
        - Content moderation follows strict privacy and fairness policies
        
        Privacy Promise:
        - All user media (images/videos) is stored in fully private AWS S3 buckets
        - Access to media files requires temporary pre-signed URLs (15 min for upload, 1 hour for view)
        - No public access to any user data without proper authentication
        - JWT-based authentication ensures stateless security
        Security Features:
        - BCrypt password hashing with salt (strength 12)
        - JWT tokens with HS256 algorithm (24-hour expiration)
        - Role-Based Access Control (USER/ADMIN roles)
        - S3 pre-signed URLs for private bucket access
        
        Your Role:
        - Help users understand platform features
        - Provide tips for creating engaging content
        - Explain privacy and security features
        - Guide users through content moderation policies
        - Suggest best practices for social media engagement
        
        Always be friendly, helpful, and concise in your responses.
        """;

    public AIAssistantService() {
        this.webClient = WebClient.builder().build();
        this.workerUrl = System.getenv().getOrDefault("AI_WORKER_URL", 
            "https://social-forum-a1.shenming0387.workers.dev/");
        this.apiKey = null; // No longer using API key - Demo Mode
        
        // Debug logging
        System.out.println("=== AI Service Initialized (Demo Mode) ===");
        System.out.println("Worker URL: " + this.workerUrl);
        System.out.println("Demo Mode: No authentication required");
        System.out.println("==========================================");
    }

    /**
     * Get AI Assistant response with platform context
     * 
     * @param userMessage User's question or prompt
     * @param username Username for personalization (optional)
     * @return AI response text
     */
    public Mono<String> getAIResponse(String userMessage, String username) {
        // Demo Mode: Simple JSON with only message field (Worker expects "message")
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("message", userMessage);

        // No authentication headers - Demo Mode
        return webClient.post()
            .uri(workerUrl)
            .header("Content-Type", "application/json")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(String.class)
            .map(response -> {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    JsonNode jsonNode = mapper.readTree(response);
                    return jsonNode.has("response") 
                        ? jsonNode.get("response").asText() 
                        : jsonNode.toString();
                } catch (Exception e) {
                    return response; // Return raw response if JSON parsing fails
                }
            })
            .doOnError(error -> {
                System.err.println("AI Worker Error: " + error.getClass().getName());
                System.err.println("Error Message: " + error.getMessage());
                error.printStackTrace();
            })
            .onErrorReturn("Sorry, the AI assistant is temporarily unavailable. Please try again later.");
    }

    /**
     * Get AI content suggestions for post creation
     * 
     * @param topic Post topic or partial content
     * @return AI-generated suggestions
     */
    public Mono<String> getContentSuggestions(String topic) {
        String enhancedPrompt = String.format(
            "Based on the topic '%s', provide 3 engaging post ideas for SocialApp. " +
            "Each idea should be concise (max 280 characters) and include relevant hashtags.",
            topic
        );
        return getAIResponse(enhancedPrompt, null);
    }

    /**
     * Get AI help for content moderation
     * 
     * @param content Content to analyze
     * @return Moderation recommendations
     */
    public Mono<String> analyzeContent(String content) {
        String moderationPrompt = String.format(
            "As a content moderator for SocialApp, analyze this content: '%s'. " +
            "Does it violate community guidelines? Provide a brief assessment.",
            content
        );
        return getAIResponse(moderationPrompt, null);
    }

    /**
     * Get platform-specific help
     * 
     * @param question User's question
     * @return Contextual help response
     */
    public Mono<String> getPlatformHelp(String question) {
        return getAIResponse(question, null);
    }
}
