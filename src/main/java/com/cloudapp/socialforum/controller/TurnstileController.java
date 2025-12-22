package com.cloudapp.socialforum.controller;

import com.cloudapp.socialforum.service.TurnstileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Turnstile Controller
 * Handles Cloudflare Turnstile token verification
 */
@RestController
@RequestMapping("/api/turnstile")
@CrossOrigin(origins = "*")
public class TurnstileController {

    @Autowired
    private TurnstileService turnstileService;

    /**
     * Verify Turnstile token
     * 
     * @param request Contains "token" field from Turnstile widget
     * @return Success or failure response
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyTurnstile(@RequestBody Map<String, String> request,
                                              @RequestHeader(value = "X-Forwarded-For", required = false) String remoteIp) {
        String token = request.get("token");
        
        if (token == null || token.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Turnstile token is required"
            ));
        }

        boolean isValid = turnstileService.verifyToken(token, remoteIp);

        if (isValid) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Turnstile verification successful"
            ));
        } else {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "Turnstile verification failed. Please try again."
            ));
        }
    }
}
