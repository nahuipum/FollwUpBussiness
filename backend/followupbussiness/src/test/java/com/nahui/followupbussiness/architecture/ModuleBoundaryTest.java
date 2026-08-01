package com.nahui.followupbussiness.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class ModuleBoundaryTest {

    private static final String BASE_PACKAGE = "com.nahui.followupbussiness";
    private static final List<String> MODULES = List.of(
            "tenancy",
            "identityaccess",
            "workforce",
            "customers",
            "routing",
            "journeys",
            "tracking",
            "visits",
            "catalog",
            "sales",
            "reporting",
            "imports",
            "notifications",
            "audit",
            "outbox");

    @Test
    void adaptersRemainInternalToTheirModule() {
        JavaClasses productionClasses = new ClassFileImporter()
                .withImportOption(new ImportOption.DoNotIncludeTests())
                .importPackages(BASE_PACKAGE);

        for (String module : MODULES) {
            String modulePackage = BASE_PACKAGE + "." + module;
            ArchRule rule = noClasses()
                    .that().resideOutsideOfPackage(modulePackage + "..")
                    .should().dependOnClassesThat().resideInAPackage(modulePackage + ".adapter..");

            rule.check(productionClasses);
        }
    }
}
