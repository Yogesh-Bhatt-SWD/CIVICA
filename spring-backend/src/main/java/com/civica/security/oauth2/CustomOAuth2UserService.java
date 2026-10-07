package com.civica.security.oauth2;

import com.civica.model.User;
import com.civica.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String sub = oAuth2User.getAttribute("sub");

        log.info("Processing OAuth2 login for provider: {}, email: {}", registrationId, email);

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not provided by OAuth provider.");
        }

        User user = processUser(email, name, picture, registrationId, sub);
        return new CustomOAuth2User(user, oAuth2User.getAttributes());
    }

    public User processUser(String email, String name, String picture, String provider, String providerId) {
        String normalizedEmail = email.toLowerCase().trim();
        Optional<User> existingOpt = userRepository.findByEmail(normalizedEmail);

        if (existingOpt.isPresent()) {
            User existing = existingOpt.get();
            boolean updated = false;
            if (existing.getProviderId() == null && providerId != null) {
                existing.setProviderId(providerId);
                existing.setProvider(provider != null ? provider : "google");
                updated = true;
            }
            if ((existing.getAvatar() == null || existing.getAvatar().isBlank()) && picture != null) {
                existing.setAvatar(picture);
                updated = true;
            }
            if (updated) {
                userRepository.save(existing);
            }
            return existing;
        }

        User newUser = User.builder()
                .name(name != null && !name.isBlank() ? name.trim() : normalizedEmail.split("@")[0])
                .email(normalizedEmail)
                .role("citizen")
                .provider(provider != null ? provider : "google")
                .providerId(providerId)
                .avatar(picture != null ? picture : "")
                .createdAt(Instant.now())
                .build();

        return userRepository.save(newUser);
    }
}
