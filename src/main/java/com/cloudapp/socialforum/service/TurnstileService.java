package com.cloudapp.socialforum.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Cloudflare Turnstile Verification Service
 * Verifies Turnstile tokens to prevent bot attacks on login/register endpoints
 * 
 * Environment Variables Required:
 * - TURNSTILE_SECRET_KEY: Secret key from Cloudflare dashboard
 */
@Service
public class TurnstileService {

    private static final String TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    private final WebClient webClient;
    private final String secretKey;

    public TurnstileService() {
        this.webClient = WebClient.builder().build();
        this.secretKey = System.getenv().getOrDefault("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA"); // Test key for localhost
    }

    /**
     * Verify Turnstile token from client
     * 
     * @param token Turnstile token from frontend
     * @param remoteIp Client IP address (optional)
     * @return true if token is valid, false otherwise
     */
    public boolean verifyToken(String token, String remoteIp) {
        try {
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("secret", secretKey);
            requestBody.put("response", token);
            if (remoteIp != null) {
                requestBody.put("remoteip", remoteIp);
            }

            String response = webClient.post()
                .uri(TURNSTILE_VERIFY_URL)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            // Parse response
            ObjectMapper mapper = new ObjectMapper();
            JsonNode jsonNode = mapper.readTree(response);
            return jsonNode.get("success").asBoolean();

        } catch (Exception e) {
            System.err.println("Turnstile verification failed: " + e.getMessage());
            return false; // Fail closed for security
        }
    }

    /**
     * Verify Turnstile token asynchronously
     */
    public Mono<Boolean> verifyTokenAsync(String token, String remoteIp) {
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("secret", secretKey);
        requestBody.put("response", token);
        if (remoteIp != null) {
            requestBody.put("remoteip", remoteIp);
        }

        return webClient.post()
            .uri(TURNSTILE_VERIFY_URL)
            .header("Content-Type", "application/json")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(String.class)
            .map(response -> {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    JsonNode jsonNode = mapper.readTree(response);
                    return jsonNode.get("success").asBoolean();
                } catch (Exception e) {
                    return false;
                }
            })
            .onErrorReturn(false);
    }
}
