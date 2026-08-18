package com.nahui.followupbussiness.workforce.config;

import com.nahui.followupbussiness.workforce.adapter.out.persistence.JdbcSellerStore;
import com.nahui.followupbussiness.workforce.application.SellerReferenceService;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/** Minimal public-workforce wiring usable by customers without loading workforce commands. */
@Configuration(proxyBeanMethods = false)
public class SellerReferenceConfiguration {
 @Bean SellerReferenceUseCase sellerReferenceUseCase(JdbcTemplate jdbc) { return new SellerReferenceService(new JdbcSellerStore(jdbc)); }
}
