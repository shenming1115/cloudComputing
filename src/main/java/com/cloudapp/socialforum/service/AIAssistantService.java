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
        - OAuth2 integration with Google for seamless login
        
        Security Features:
        - BCrypt password hashing with salt (strength 12)
        - JWT tokens with HS256 algorithm (24-hour expiration)
        - Role-Based Access Control (USER/ADMIN roles)
        - Cloudflare Turnstile bot protection
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
        this.apiKey = System.getenv("AI_SECRET_KEY");
    }

    /**
     * Get AI Assistant response with platform context
     * 
     * @param userMessage User's question or prompt
     * @param username Username for personalization (optional)
     * @return AI response text
     */
    public Mono<String> getAIResponse(String userMessage, String username) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("systemPrompt", SYSTEM_PROMPT);
        requestBody.put("userMessage", userMessage);
        if (username != null) {
            requestBody.put("context", Map.of("username", username));
        }

        var requestSpec = webClient.post()
            .uri(workerUrl)
            .header("Content-Type", "application/json");

        // Add X-AI-Secret header if configured (REQUIRED for security)
        if (apiKey != null && !apiKey.isEmpty()) {
            requestSpec = requestSpec.header("X-AI-Secret", apiKey);
        }

        return requestSpec
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
