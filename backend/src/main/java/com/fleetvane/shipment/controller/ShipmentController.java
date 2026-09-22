package com.fleetvane.shipment.controller;

import com.fleetvane.shipment.dto.CreateShipmentRequest;
import com.fleetvane.shipment.dto.ShipmentDto;
import com.fleetvane.shipment.dto.ProofOfDeliveryRequest;
import com.fleetvane.shipment.service.ShipmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final com.fleetvane.auth.repository.UserRepository userRepository;

    public ShipmentController(ShipmentService shipmentService, com.fleetvane.auth.repository.UserRepository userRepository) {
        this.shipmentService = shipmentService;
        this.userRepository = userRepository;
    }

    private Long getCurrentCompanyId(Authentication auth) {
        String userIdStr = auth.getName();
        return userRepository.findById(Long.parseLong(userIdStr)).map(com.fleetvane.auth.entity.User::getCompanyId).orElse(null);
    }

    public record UpdateStatusRequest(String status, ProofOfDeliveryRequest pod) {}
    public record AssignRequest(Long vehicleId, Long driverId) {}

    @GetMapping
    public Page<ShipmentDto> getShipments(
            Pageable pageable,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long driverId,
            Authentication auth) {
        String role = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).findFirst().orElse("");
        Long userId = Long.parseLong(auth.getName());
        return shipmentService.getAllShipments(pageable, status, clientId, driverId, role, userId, getCurrentCompanyId(auth));
    }

    @GetMapping("/{id}")
    public ShipmentDto getShipment(@PathVariable Long id, Authentication auth) {
        String role = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).findFirst().orElse("");
        Long userId = Long.parseLong(auth.getName());
        return shipmentService.getShipmentById(id, role, userId, getCurrentCompanyId(auth));
    }

    @PostMapping({"", "/create"})
    public ShipmentDto createShipment(@RequestBody CreateShipmentRequest request, Authentication auth) {
        Long clientId = Long.parseLong(auth.getName());
        return shipmentService.createShipment(request, clientId);
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN', 'ROLE_MANAGER', 'ROLE_ADMIN')")
    public ShipmentDto assignShipment(@PathVariable Long id, @RequestBody AssignRequest request) {
        return shipmentService.assignShipment(id, request.vehicleId(), request.driverId());
    }

    @PutMapping("/{id}/status")
    public ShipmentDto updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request, Authentication auth) {
        String role = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).findFirst().orElse("");
        Long userId = Long.parseLong(auth.getName());
        return shipmentService.updateStatus(id, request.status(), request.pod(), role, userId);
    }

    /**
     * Verifies the QR token for a shipment pickup.
     * Used by the driver (at pickup location) and can be scanned by client to verify driver identity.
     */
    @PostMapping("/{id}/qr/verify")
    public ShipmentDto verifyQrToken(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        String token = body.get("token");
        if (token == null || token.isBlank()) {
            throw new com.fleetvane.shared.exception.BusinessException("QR token is required", org.springframework.http.HttpStatus.BAD_REQUEST);
        }
        return shipmentService.verifyQrToken(id, token);
    }
}
