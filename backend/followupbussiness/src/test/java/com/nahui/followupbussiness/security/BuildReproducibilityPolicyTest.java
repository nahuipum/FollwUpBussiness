package com.nahui.followupbussiness.security;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

class BuildReproducibilityPolicyTest {

    private static final String MAVEN_3_9_16_SHA_256 =
            "5af3b743dd8b876b5c45da33b676251e5f1687712644abb4ee519ca56e1d89ce";

    @Test
    void mavenWrapperDistributionIsVersionedAndChecksumPinned() throws IOException {
        Path backend = backendRoot();
        Properties wrapper = new Properties();
        wrapper.load(new StringReader(Files.readString(
                backend.resolve(".mvn/wrapper/maven-wrapper.properties"),
                StandardCharsets.UTF_8)));

        assertThat(wrapper.getProperty("distributionUrl"))
                .isEqualTo("https://repo.maven.apache.org/maven2/org/apache/maven/"
                        + "apache-maven/3.9.16/apache-maven-3.9.16-bin.zip");
        assertThat(wrapper.getProperty("distributionSha256Sum"))
                .isEqualTo(MAVEN_3_9_16_SHA_256);
    }

    @Test
    void jarAndSbomUseTheSameFixedOutputTimestamp() throws IOException {
        String pom = Files.readString(backendRoot().resolve("pom.xml"), StandardCharsets.UTF_8);

        assertThat(pom)
                .contains("<project.build.outputTimestamp>2026-07-30T00:00:00Z"
                        + "</project.build.outputTimestamp>")
                .contains("<outputTimestamp>${project.build.outputTimestamp}</outputTimestamp>")
                .doesNotContain("<outputTimestamp>2026-07-27T00:00:00Z</outputTimestamp>");
    }

    private static Path backendRoot() {
        Path candidate = Path.of("").toAbsolutePath();
        while (candidate != null && !Files.isRegularFile(candidate.resolve("pom.xml"))) {
            candidate = candidate.getParent();
        }
        if (candidate == null) {
            throw new IllegalStateException("Backend Maven root was not found");
        }
        return candidate;
    }
}
