package com.nahui.followupbussiness.identityaccess.config;
import com.nahui.followupbussiness.identityaccess.application.port.in.WebOriginPolicy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
@Configuration(proxyBeanMethods=false)
@EnableConfigurationProperties(AuthenticationProperties.Values.class)
public class WebOriginPolicyConfiguration { @Bean WebOriginPolicy webOriginPolicy(AuthenticationProperties.Values properties) { return origin -> properties.getWebOrigin() != null && properties.getWebOrigin().equals(origin); } }
