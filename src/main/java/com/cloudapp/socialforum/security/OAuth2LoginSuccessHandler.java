package com.cloudapp.socialforum.security;

import com.cloudapp.socialforum.model.User;
import com.cloudapp.socialforum.repository.UserRepository;
import com.cloudapp.socialforum.dto.AuthResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

/**
 * OAuth2 Login Success Handler
 * Handles successful Google OAuth2 authentication by:
 * 1. Creating/updating user in database
 * 2. Generating JWT token
 * 3. Redirecting to frontend with token
 */
@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // Extract user info from Google OAuth2 response
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String googleId = oAuth2User.getAttribute("sub");

        // Find or create user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(email.split("@")[0] + "_" + System.currentTimeMillis());
            newUser.setPassword("OAUTH2_USER"); // OAuth users don't have passwords
            newUser.setRole("USER");
            newUser.setBio("Signed in with Google");
            newUser.setCreatedAt(LocalDateTime.now());
            return userRepository.save(newUser);
        });

        // Update last login
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole());

        // Redirect to frontend with token
        String redirectUrl = String.format("/html/index.html?oauth_token=%s&username=%s&email=%s&role=%s",
            URLEncoder.encode(token, StandardCharsets.UTF_8),
            URLEncoder.encode(user.getUsername(), StandardCharsets.UTF_8),
            URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8),
            URLEncoder.encode(user.getRole(), StandardCharsets.UTF_8)
        );

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
