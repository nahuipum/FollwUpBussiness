package com.nahui.followupbussiness.security;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

class RepositorySecretsPolicyTest {

    private static final Set<String> SECRET_SUFFIXES = Set.of(
            ".pem", ".key", ".p12", ".pfx", ".jks", ".keystore", ".pkcs8", ".pkcs12");

    @Test
    void localSecretFilesAreIgnoredByGit() throws Exception {
        Path root = repositoryRoot();
        List<String> expectedIgnoredPaths = List.of(
                ".env",
                "backend/followupbussiness/.env.local",
                "backend/followupbussiness/secrets-local/runtime.txt",
                "backend/followupbussiness/.secrets/runtime.txt",
                "backend/followupbussiness/local-signing.key",
                "backend/followupbussiness/local-keystore.p12");

        Process process = new ProcessBuilder("git", "check-ignore", "--no-index", "--stdin")
                .directory(root.toFile())
                .start();
        process.getOutputStream().write(String.join("\n", expectedIgnoredPaths)
                .concat("\n")
                .getBytes(StandardCharsets.UTF_8));
        process.getOutputStream().close();

        List<String> ignoredPaths = process.inputReader(StandardCharsets.UTF_8).lines().toList();
        String errorOutput = process.errorReader(StandardCharsets.UTF_8).lines().collect(Collectors.joining("\n"));

        assertEquals(0, process.waitFor(), errorOutput);
        assertThat(ignoredPaths).containsExactlyElementsOf(expectedIgnoredPaths);
    }

    @Test
    void repositoryDoesNotTrackLocalSecretFiles() throws Exception {
        Path root = repositoryRoot();
        Process process = new ProcessBuilder("git", "ls-files")
                .directory(root.toFile())
                .start();
        List<String> trackedFiles = process.inputReader(StandardCharsets.UTF_8).lines().toList();
        String errorOutput = process.errorReader(StandardCharsets.UTF_8).lines().collect(Collectors.joining("\n"));

        assertEquals(0, process.waitFor(), errorOutput);
        assertThat(trackedFiles).noneMatch(RepositorySecretsPolicyTest::looksLikeLocalSecretFile);
    }

    @Test
    void environmentExampleContainsOnlyDocumentedNonSecretPlaceholders() throws IOException {
        List<String> lines = Files.readAllLines(repositoryRoot().resolve(".env.example"), StandardCharsets.UTF_8);
        Map<String, String> properties = lines.stream()
                .map(String::trim)
                .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                .map(line -> line.split("=", 2))
                .collect(Collectors.toMap(parts -> parts[0], parts -> parts[1]));

        assertThat(properties)
                .containsEntry("FIELD_SALES_SECURITY_LOCAL_SECRET",
                        "replace_with_32_plus_random_local_characters");

        properties.forEach((name, value) -> {
            if (isSecretVariable(name)) {
                assertThat(value)
                        .as("%s must contain a deliberate development-only placeholder", name)
                        .isIn("change_me_local_only", "replace_with_32_plus_random_local_characters");
            }
        });
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

    private static boolean looksLikeLocalSecretFile(String trackedPath) {
        String normalized = trackedPath.replace('\\', '/').toLowerCase(Locale.ROOT);
        String fileName = normalized.substring(normalized.lastIndexOf('/') + 1);

        boolean environmentFile = fileName.equals(".env")
                || (fileName.startsWith(".env.") && !fileName.endsWith(".example"));
        boolean secretDirectory = Arrays.stream(normalized.split("/"))
                .anyMatch(part -> part.equals(".secrets") || part.equals("secrets-local"));
        boolean secretSuffix = SECRET_SUFFIXES.stream().anyMatch(normalized::endsWith);
        boolean privateConfiguration = fileName.equals("secrets.yml")
                || fileName.equals("secrets.yaml")
                || fileName.equals("secrets.properties");

        return environmentFile || secretDirectory || secretSuffix || privateConfiguration;
    }

    private static boolean isSecretVariable(String name) {
        return name.contains("PASSWORD") || name.contains("SECRET") || name.contains("TOKEN") || name.contains("KEY");
    }
}
