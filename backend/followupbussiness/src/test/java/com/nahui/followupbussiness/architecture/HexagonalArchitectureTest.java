package com.nahui.followupbussiness.architecture;

import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class HexagonalArchitectureTest {

    private static final String BASE_PACKAGE = "com.nahui.followupbussiness";

    @Test
    void domainDoesNotDependOnFrameworksOrOuterLayers() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAnyPackage(
                        "org.springframework..",
                        "jakarta.persistence..",
                        "org.hibernate..",
                        "..application..",
                        "..adapter..",
                        "..config..");

        rule.check(importedProductionClasses());
    }

    @Test
    void applicationDoesNotDependOnAdaptersOrConfiguration() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..application..")
                .should().dependOnClassesThat().resideInAnyPackage("..adapter..", "..config..");

        rule.check(importedProductionClasses());
    }

    @Test
    void adaptersDoNotDependOnConfiguration() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..adapter..")
                .should().dependOnClassesThat().resideInAPackage("..config..");

        rule.check(importedProductionClasses());
    }

    private static com.tngtech.archunit.core.domain.JavaClasses importedProductionClasses() {
        return new ClassFileImporter()
                .withImportOption(new ImportOption.DoNotIncludeTests())
                .importPackages(BASE_PACKAGE);
    }
}
