package com.nahui.followupbussiness.identityaccess.config;

import com.nahui.followupbussiness.identityaccess.adapter.in.security.RestAccessDeniedHandler;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.RestAuthenticationEntryPoint;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticationFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;

@Configuration(proxyBeanMethods = false)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@EnableConfigurationProperties(LocalSecuritySecretsProperties.class)
public class SecurityConfiguration {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler,
            ObjectProvider<InboundJwtAuthenticator> inboundJwtAuthenticator) throws Exception {

        RequestMatcher authenticatedCsrfRequest = request -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            return authentication != null
                    && authentication.isAuthenticated()
                    && CsrfFilter.DEFAULT_CSRF_MATCHER.matches(request);
        };

        http
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/actuator/prometheus").permitAll()
                        .requestMatchers("/auth/login").permitAll()
                        .requestMatchers("/auth/password-recovery-requests").permitAll()
                        .requestMatchers("/auth/password-resets").permitAll()
                        .requestMatchers("/auth/refresh").permitAll()
                        .requestMatchers("/auth/logout").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/platform/companies").hasAuthority("PLATFORM_SUPERADMIN")
                        .requestMatchers("/api/v1/internal/outbox/dlq/*/reprocess").hasAuthority("PLATFORM_SUPERADMIN")
                        .anyRequest().authenticated())
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/v1/internal/outbox/dlq/*/reprocess")
                        .requireCsrfProtectionMatcher(authenticatedCsrfRequest))
                .cors(Customizer.withDefaults())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .anonymous(Customizer.withDefaults());

        InboundJwtAuthenticator authenticator = inboundJwtAuthenticator.getIfAvailable();
        if (authenticator != null) {
            http.addFilterBefore(new InboundJwtAuthenticationFilter(authenticator, authenticationEntryPoint), AnonymousAuthenticationFilter.class);
        }

        return http.build();
    }
}
