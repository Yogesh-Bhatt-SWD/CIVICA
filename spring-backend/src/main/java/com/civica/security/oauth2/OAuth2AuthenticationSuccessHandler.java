package com.civica.security.oauth2;

import com.civica.model.User;
import com.civica.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.oauth2.redirect-uri:http://localhost:5173/oauth-success}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        Object principal = authentication.getPrincipal();
        User user;

        if (principal instanceof CustomOAuth2User customOAuth2User) {
            user = customOAuth2User.getUser();
        } else {
            log.error("Principal is not CustomOAuth2User: {}", principal.getClass().getName());
            response.sendRedirect(UriComponentsBuilder.fromUriString(redirectUri)
                    .queryParam("error", "Invalid authentication principal")
                    .build().toUriString());
            return;
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getRole(), user.getName(), user.getEmail());
        log.info("OAuth2 login successful for user: {}, role: {}. Redirecting to frontend.", user.getEmail(), user.getRole());

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", token)
                .build().toUriString();

        response.sendRedirect(targetUrl);
    }
}
