package com.nahui.followupbussiness.identityaccess;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

class BootstrapOpenApiPolicyTest {

    @Test
    void openApiContainsNoPlatformSuperadminBootstrapOperation() throws IOException {
        List<String> lines = Files.readAllLines(
                repositoryRoot().resolve("docs/api/openapi.yaml"),
                StandardCharsets.UTF_8);
        List<String> paths = new ArrayList<>();
        List<String> operationIds = new ArrayList<>();
        boolean insidePaths = false;

        for (String line : lines) {
            if (line.equals("paths:")) {
                insidePaths = true;
                continue;
            }
            if (insidePaths && line.equals("components:")) {
                break;
            }
            if (!insidePaths) {
                continue;
            }
            if (line.startsWith("  /") && line.endsWith(":")) {
                String normalizedPath = line.trim();
                paths.add(normalizedPath.substring(0, normalizedPath.length() - 1));
            }
            String trimmed = line.trim();
            if (trimmed.startsWith("operationId:")) {
                operationIds.add(trimmed.substring("operationId:".length()).trim());
            }
        }

        List<String> bootstrapPaths = paths.stream()
                .filter(path -> path.toLowerCase(Locale.ROOT).contains("bootstrap"))
                .toList();
        List<String> bootstrapOperations = operationIds.stream()
                .filter(operation -> operation.toLowerCase(Locale.ROOT).contains("bootstrap"))
                .toList();

        assertThat(bootstrapPaths).containsExactly("/mobile/bootstrap");
        assertThat(bootstrapOperations).containsExactly("getMobileBootstrap");
        assertThat(paths).noneMatch(BootstrapOpenApiPolicyTest::isPrivilegedBootstrapPath);
    }

    private static boolean isPrivilegedBootstrapPath(String path) {
        String normalized = path.toLowerCase(Locale.ROOT);
        return normalized.equals("/bootstrap")
                || (normalized.contains("bootstrap")
                && (normalized.contains("superadmin") || normalized.contains("platform")));
    }

    private static Path repositoryRoot() {
        Path candidate = Path.of("").toAbsolutePath();
        while (candidate != null && !Files.isDirectory(candidate.resolve(".git"))) {
            candidate = candidate.getParent();
        }
        if (candidate == null) {
            throw new IllegalStateException("Git repository root was not found");
        }
        return candidate;
    }
}
