package com.nahui.followupbussiness.security;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class En011ClosurePipelinePolicyTest {

    @Test
    void workflowDefinesTheApprovedBuildAndScaGate() throws IOException {
        String workflow = read(".github/workflows/backend-en011-closure-ci.yml");

        assertThat(workflow)
                .contains("runs-on: ubuntu-24.04", "java-version: \"21\"")
                .contains("./mvnw --batch-mode --no-transfer-progress clean verify")
                .contains("BaseRoleCatalogMigrationTest", "HexagonalArchitectureTest")
                .contains("version: v0.70.0", "scan-type: sbom")
                .contains("trivy-sca-full.json", "trivy-policy-high-critical.txt")
                .contains("trivy --version --format json", "VulnerabilityDB")
                .contains("sca-observed-at.txt", "severity: HIGH,CRITICAL")
                .contains("ignore-unfixed: \"false\"", "exit-code: \"1\"")
                .contains("SAST_CONFIG_MISSING", "effective-pom-en011.xml")
                .contains("dependency-tree-en011.txt", "deliverables.sha256")
                .contains("sha256sum --check", "TRIVY_GATE_HIGH_CRITICAL=PASS")
                .contains("continue-on-error: true")
                .contains("if: steps.trivy_gate.outcome != 'success'")
                .doesNotContain("${{ secrets.", ".trivyignore");
    }

    @Test
    void workflowUploadsOnlyTheAuthorizedPayloadForThirtyDays() throws IOException {
        String workflow = read(".github/workflows/backend-en011-closure-ci.yml");

        assertThat(workflow)
                .contains("actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02")
                .contains("retention-days: 30", "if-no-files-found: error")
                .contains("path: backend/followupbussiness/target/en011-artifact")
                .contains("target/surefire-reports", "target/failsafe-reports")
                .contains("trivy-gate-status.txt", "trivy-version-db.json")
                .contains("candidate-manifest.txt", "sast-status.txt")
                .contains("Unauthorized artifact path", "Potential secret detected")
                .contains("Forbidden sensitive filename", "PRIVATE KEY")
                .contains("grep -I -R -n -E -i -e")
                .contains("include-hidden-files: false")
                .doesNotContain("path: backend/followupbussiness/target/**")
                .doesNotContain("printenv", "env >");
    }

    @Test
    void policySeparatesInventoryFromScaAndDeclaresSastGap() throws IOException {
        assertThat(read("docs/security/EN-011-sca-policy.md"))
                .contains("El SBOM es inventario y no se declara como resultado SCA")
                .contains("SAST_CONFIG_MISSING")
                .contains("Cualquier vulnerabilidad `HIGH` o `CRITICAL`")
                .contains("No se admite `.trivyignore`")
                .contains("retención de 30 días")
                .contains("allowlist cerrada", "actions/upload-artifact");
    }

    private static String read(String relativePath) throws IOException {
        Path root = Path.of("").toAbsolutePath();
        while (root != null && !Files.exists(root.resolve(".git"))) {
            root = root.getParent();
        }
        if (root == null) {
            throw new IllegalStateException("Git repository root was not found");
        }
        return Files.readString(root.resolve(relativePath), StandardCharsets.UTF_8);
    }
}
