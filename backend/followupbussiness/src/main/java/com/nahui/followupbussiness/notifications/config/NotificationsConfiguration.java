package com.nahui.followupbussiness.notifications.config;
import com.nahui.followupbussiness.notifications.adapter.out.persistence.JdbcInstallationRevocationAdapter;
import com.nahui.followupbussiness.notifications.application.RevokeInstallationsForSessionService;
import com.nahui.followupbussiness.notifications.application.port.in.RevokeInstallationsForSession;
import org.springframework.context.annotation.*; import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
@Configuration(proxyBeanMethods=false) public class NotificationsConfiguration { @Bean @ConditionalOnBean(JdbcTemplate.class) RevokeInstallationsForSession revokeInstallationsForSession(JdbcTemplate j){return new RevokeInstallationsForSessionService(new JdbcInstallationRevocationAdapter(j));} }
