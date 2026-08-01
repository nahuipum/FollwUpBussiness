package com.nahui.followupbussiness.security;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

class CiSecurityPipelinePolicyTest {

    private static final Pattern ACTION_REFERENCE =
            Pattern.compile("(?m)^\\s*uses:\\s+([^\\s#]+)");

    @Test
    void workflowPinsToolchainBuildArchitectureAndScaGate() throws IOException {
        String workflow = read(".github/workflows/backend-en010-remediation-ci.yml");

        assertThat(workflow)
                .contains("runs-on: ubuntu-24.04")
                .contains("java-version: \"21\"")
                .contains("./mvnw --batch-mode --no-transfer-progress clean verify")
                .contains("-Dtest=HexagonalArchitectureTest,ModuleBoundaryTest test")
                .contains("version: v0.70.0")
                .contains("scan-type: sbom")
                .contains("severity: HIGH,CRITICAL")
                .contains("ignore-unfixed: \"false\"")
                .contains("exit-code: \"1\"")
                .contains("retention-days: 30")
                .contains("target/followupbussiness-0.0.1-SNAPSHOT.jar")
                .contains("target/sbom/application.cdx.json")
                .contains("target/surefire-reports/**")
                .contains("target/ci-evidence/**")
                .doesNotContain("${{ secrets.")
                .doesNotContain(".trivyignore")
                .doesNotContain("ortools", "EN-015");
    }

    @Test
    void everyExternalActionUsesAnImmutableCommitSha() throws IOException {
        Matcher references = ACTION_REFERENCE.matcher(
                read(".github/workflows/backend-en010-remediation-ci.yml"));
        int count = 0;
        while (references.find()) {
            count++;
            assertThat(references.group(1))
                    .as("action reference %s", references.group(1))
                    .matches("[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+@[0-9a-f]{40}");
        }
        assertThat(count).isEqualTo(5);
    }

    @Test
    void scaPolicyRejectsSilentExceptionsAndSeparatesExcludedEnablers() throws IOException {
        String policy = read("docs/security/EN-010-sca-policy.md");

        assertThat(policy)
                .contains("Cualquier vulnerabilidad `HIGH` o `CRITICAL`")
                .contains("tenga o no corrección")
                .contains("disponible, hace fallar el pipeline")
                .contains("No se admite `.trivyignore`")
                .contains("el job falla")
                .contains("máximo de 30 días")
                .contains("excluye expresamente EN-018, OR-Tools y EN-015");
    }

    private static String read(String relativePath) throws IOException {
        return Files.readString(repositoryRoot().resolve(relativePath), StandardCharsets.UTF_8);
    }

    private static Path repositoryRoot() {
        Path candidate = Path.of("").toAbsolutePath();
        while (candidate != null && !Files.exists(candidate.resolve(".git"))) {
            candidate = candidate.getParent();
        }
        if (candidate == null) {
            throw new IllegalStateException("Git repository root was not found");
        }
        return candidate;
    }
}
