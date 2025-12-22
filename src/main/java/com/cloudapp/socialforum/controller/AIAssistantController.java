package com.cloudapp.socialforum.controller;

import com.cloudapp.socialforum.service.AIAssistantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * AI Assistant Controller
 * Provides AI-powered features using Cloudflare Worker integration
 * 
 * Features:
 * - AI chat assistant with platform context
 * - Content suggestions for post creation (AI Boost)
 * - Content moderation analysis
 * - Platform help and guidance
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIAssistantController {

    @Autowired
    private AIAssistantService aiAssistantService;

    /**
     * AI Boost - Get content suggestions for post creation
     * 
     * POST /api/ai/boost
     * Body: { "topic": "your topic or partial content" }
     * 
     * @return AI-generated content suggestions
     */
    @PostMapping("/boost")
    public Mono<ResponseEntity<Map<String, Object>>> getAIBoost(@RequestBody Map<String, String> request) {
        String topic = request.get("topic");
        
        if (topic == null || topic.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Topic is required");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }

        return aiAssistantService.getContentSuggestions(topic)
            .map(suggestions -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("suggestions", suggestions);
                response.put("message", "AI suggestions generated successfully");
                return ResponseEntity.ok(response);
            })
            .onErrorReturn(ResponseEntity.status(500).body(new HashMap<String, Object>() {{
                put("success", false);
                put("message", "Failed to generate AI suggestions");
            }}));
    }

    /**
     * AI Chat - General platform assistant
     * 
     * POST /api/ai/chat
     * Body: { "message": "your question" }
     * 
     * @return AI response with platform context
     */
    @PostMapping("/chat")
    public Mono<ResponseEntity<Map<String, Object>>> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        
        if (message == null || message.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Message is required");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }

        // Get username from security context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;

        return aiAssistantService.getAIResponse(message, username)
            .map(response -> {
                Map<String, Object> responseMap = new HashMap<>();
                responseMap.put("success", true);
                responseMap.put("response", response);
                responseMap.put("message", "AI response generated successfully");
                return ResponseEntity.ok(responseMap);
            })
            .onErrorReturn(ResponseEntity.status(500).body(new HashMap<String, Object>() {{
                put("success", false);
                put("message", "Failed to get AI response");
            }}));
    }

    /**
     * Content Analysis - For moderation assistance (ADMIN only)
     * 
     * POST /api/ai/analyze
     * Body: { "content": "content to analyze" }
     * 
     * @return Moderation recommendations
     */
    @PostMapping("/analyze")
    public Mono<ResponseEntity<Map<String, Object>>> analyzeContent(@RequestBody Map<String, String> request) {
        String content = request.get("content");
        
        if (content == null || content.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Content is required");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }

        return aiAssistantService.analyzeContent(content)
            .map(analysis -> {
                Map<String, Object> responseMap = new HashMap<>();
                responseMap.put("success", true);
                responseMap.put("analysis", analysis);
                responseMap.put("message", "Content analysis completed");
                return ResponseEntity.ok(responseMap);
            })
            .onErrorReturn(ResponseEntity.status(500).body(new HashMap<String, Object>() {{
                put("success", false);
                put("message", "Failed to analyze content");
            }}));
    }

    /**
     * Platform Help - Get help with platform features
     * 
     * POST /api/ai/help
     * Body: { "question": "your question about the platform" }
     * 
     * @return Contextual help response
     */
    @PostMapping("/help")
    public Mono<ResponseEntity<Map<String, Object>>> getHelp(@RequestBody Map<String, String> request) {
        String question = request.get("question");
        
        if (question == null || question.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Question is required");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }

        return aiAssistantService.getPlatformHelp(question)
            .map(helpResponse -> {
                Map<String, Object> responseMap = new HashMap<>();
                responseMap.put("success", true);
                responseMap.put("help", helpResponse);
                responseMap.put("message", "Help response generated");
                return ResponseEntity.ok(responseMap);
            })
            .onErrorReturn(ResponseEntity.status(500).body(new HashMap<String, Object>() {{
                put("success", false);
                put("message", "Failed to get help response");
            }}));
    }
}
