package com.nahui.followupbussiness.identityaccess.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(prefix = "followupbussiness.authentication", name = "web-origin")
@EnableConfigurationProperties(AuthenticationProperties.Values.class)
class AuthenticationCorsConfiguration {

    @Bean
    CorsConfigurationSource corsConfigurationSource(AuthenticationProperties.Values properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(properties.getWebOrigin()));
        configuration.setAllowCredentials(true);
        configuration.setAllowedMethods(List.of("POST", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Auth-Client", "X-Client-Instance-Id", "X-CSRF-Token", "X-Logout-Intent", "X-Correlation-Id"));
        configuration.setExposedHeaders(List.of("X-Correlation-Id"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/auth/**", configuration);
        return source;
    }
}
