package com.nahui.followupbussiness.identityaccess.adapter.out.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;

class RedisLogoutAbuseMonitorIntegrationTest {
    private static GenericContainer<?> redis;
    private static LettuceConnectionFactory connectionFactory;
    private static StringRedisTemplate template;

    @BeforeAll
    static void startRedis() {
        redis = new GenericContainer<>(DockerImageName.parse("redis:7.4-alpine")).withExposedPorts(6379);
        redis.start();
        connectionFactory = new LettuceConnectionFactory(new RedisStandaloneConfiguration(redis.getHost(), redis.getMappedPort(6379)));
        connectionFactory.afterPropertiesSet();
        template = new StringRedisTemplate(connectionFactory);
        template.afterPropertiesSet();
    }

    @AfterAll
    static void stopRedis() {
        if (connectionFactory != null) connectionFactory.destroy();
        if (redis != null) redis.stop();
    }

    @Test
    void realRedisKeepsLogoutAbuseCountersSeparatedForTheSameAccountAcrossTenants() {
        var monitor = new RedisLogoutAbuseMonitor(template, "01234567890123456789012345678901".getBytes());
        UUID account = UUID.randomUUID(), tenantA = UUID.randomUUID(), tenantB = UUID.randomUUID();

        assertThat(monitor.recordGlobal(account, tenantA).attemptsInWindow()).isEqualTo(1);
        assertThat(monitor.recordGlobal(account, tenantA).attemptsInWindow()).isEqualTo(2);
        assertThat(monitor.recordGlobal(account, tenantB).attemptsInWindow()).isEqualTo(1);

        Set<String> keys = template.keys("auth:logout:dedupe:*");
        assertThat(keys).hasSize(2).allMatch(key -> !key.contains(account.toString()));
    }
}
