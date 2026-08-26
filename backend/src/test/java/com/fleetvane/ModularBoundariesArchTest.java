package com.fleetvane;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.library.dependencies.SlicesRuleDefinition;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

/**
 * Mechanically enforces the modular-monolith boundaries that the architecture
 * documents promise. If these tests fail, someone leaked an implementation
 * detail across a module seam — fix the design, don't loosen the rule.
 */
@AnalyzeClasses(packages = "com.fleetvane", importOptions = ImportOption.DoNotIncludeTests.class)
class ModularBoundariesArchTest {

    private static final String[] FLEET_INTERNALS = {
            "com.fleetvane.fleet.entity..", "com.fleetvane.fleet.repository..",
            "com.fleetvane.fleet.dto..", "com.fleetvane.fleet.service..",
            "com.fleetvane.fleet.controller.."
    };

    private static final String[] SHIPMENT_INTERNALS = {
            "com.fleetvane.shipment.entity..", "com.fleetvane.shipment.repository..",
            "com.fleetvane.shipment.dto..", "com.fleetvane.shipment.service..",
            "com.fleetvane.shipment.controller.."
    };

    @ArchTest
    static final ArchRule routingOnlyUsesPortsForFleet =
            noClasses().that().resideInAPackage("com.fleetvane.routing..")
                    .should().dependOnClassesThat().resideInAnyPackage(FLEET_INTERNALS)
                    .because("routing must reach fleet exclusively through FleetQueryPort");

    @ArchTest
    static final ArchRule routingOnlyUsesPortsForShipment =
            noClasses().that().resideInAPackage("com.fleetvane.routing..")
                    .should().dependOnClassesThat().resideInAnyPackage(SHIPMENT_INTERNALS)
                    .because("routing must reach shipment exclusively through ShipmentQueryPort");

    @ArchTest
    static final ArchRule fleetIsSealedFromShipment =
            noClasses().that().resideInAPackage("com.fleetvane.fleet..")
                    .should().dependOnClassesThat().resideInAnyPackage(
                            "com.fleetvane.shipment.entity..",
                            "com.fleetvane.shipment.repository..",
                            "com.fleetvane.shipment.dto..",
                            "com.fleetvane.shipment.service..",
                            "com.fleetvane.shipment.controller..")
                    .because("fleet and shipment are independent bounded contexts");

    @ArchTest
    static final ArchRule shipmentIsSealedFromFleet =
            noClasses().that().resideInAPackage("com.fleetvane.shipment..")
                    .should().dependOnClassesThat().resideInAnyPackage(
                            "com.fleetvane.fleet.entity..",
                            "com.fleetvane.fleet.repository..",
                            "com.fleetvane.fleet.dto..",
                            "com.fleetvane.fleet.service..",
                            "com.fleetvane.fleet.controller..")
                    .because("shipment and fleet are independent bounded contexts");

    @ArchTest
    static final ArchRule servicesNeverDependOnControllers =
            noClasses().that().areAnnotatedWith("org.springframework.stereotype.Service")
                    .should().dependOnClassesThat().areAnnotatedWith(
                            "org.springframework.web.bind.annotation.RestController")
                    .because("business logic must never call back into the web layer");

    @ArchTest
    static final ArchRule modulesFormNoCycles =
            SlicesRuleDefinition.slices().matching("com.fleetvane.(*)..")
                    .should().beFreeOfCycles();
}
