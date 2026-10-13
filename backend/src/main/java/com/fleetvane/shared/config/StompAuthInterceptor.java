package com.fleetvane.shared.config;

import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.auth.service.JwtService;
import com.fleetvane.driver.repository.DriverProfileRepository;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shipment.repository.ShipmentRepository;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;
    private final DriverProfileRepository driverProfileRepository;

    public StompAuthInterceptor(JwtService jwtService,
                                UserRepository userRepository,
                                ShipmentRepository shipmentRepository,
                                DriverProfileRepository driverProfileRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.shipmentRepository = shipmentRepository;
        this.driverProfileRepository = driverProfileRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            accessor = StompHeaderAccessor.wrap(message);
        }
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authorization = accessor.getFirstNativeHeader("Authorization");
            if (authorization == null) {
                authorization = accessor.getFirstNativeHeader("authorization");
            }
            accessor.setUser(authenticate(authorization));
            accessor.setLeaveMutable(true);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            Authentication authentication = currentAuthentication(accessor);
            if (!isAllowed(authentication, accessor.getDestination())) {
                throw new MessagingException("Not authorized to subscribe to this destination");
            }
        }
        return message;
    }

    private Authentication authenticate(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            throw new MessagingException("A bearer token is required for WebSocket access");
        }
        try {
            String token = header.substring(7).trim();
            Long userId = jwtService.extractUserId(token);
            String role = jwtService.extractRole(token);
            User user = userId == null ? null : userRepository.findById(userId).orElse(null);
            if (user == null || !"ACTIVE".equalsIgnoreCase(user.getStatus())
                    && !"pending_activation".equalsIgnoreCase(user.getStatus())) {
                throw new MessagingException("WebSocket authentication failed");
            }
            return new UsernamePasswordAuthenticationToken(
                    String.valueOf(userId),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role), new SimpleGrantedAuthority(role))
            );
        } catch (RuntimeException ex) {
            throw new MessagingException("WebSocket authentication failed", ex);
        }
    }

    private Authentication currentAuthentication(StompHeaderAccessor accessor) {
        if (!(accessor.getUser() instanceof Authentication authentication)) {
            throw new MessagingException("WebSocket authentication is required");
        }
        return authentication;
    }

    private boolean isAllowed(Authentication authentication, String destination) {
        if (destination == null) return false;
        Long userId = Long.valueOf(authentication.getName());
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return false;

        if ("/topic/fleet.vehicles".equals(destination)) {
            return hasRole(authentication, "MANAGER") || hasRole(authentication, "ADMIN");
        }
        if (destination.startsWith("/topic/shipment.") && destination.endsWith(".tracking")) {
            String id = destination.substring("/topic/shipment.".length(),
                    destination.length() - ".tracking".length());
            try {
                Shipment shipment = shipmentRepository.findById(Long.valueOf(id)).orElse(null);
                if (shipment == null) return false;
                return hasRole(authentication, "ADMIN")
                        || (hasRole(authentication, "MANAGER")
                            && user.getCompanyId() != null
                            && user.getCompanyId().equals(shipment.getTransportCompanyId()))
                        || (hasRole(authentication, "CLIENT") && userId.equals(shipment.getClientId()))
                        || (hasRole(authentication, "DRIVER") && userId.equals(shipment.getDriverId()));
            } catch (NumberFormatException ex) {
                return false;
            }
        }
        if (destination.startsWith("/topic/driver.")) {
            try {
                Long driverId = Long.valueOf(destination.substring("/topic/driver.".length()));
                return hasRole(authentication, "ADMIN")
                        || (hasRole(authentication, "DRIVER")
                            && driverProfileRepository.findByUserId(userId)
                                .map(profile -> driverId.equals(profile.getUserId()))
                                .orElse(false));
            } catch (NumberFormatException ex) {
                return false;
            }
        }
        return false;
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> role.equals(authority.getAuthority())
                        || ("ROLE_" + role).equals(authority.getAuthority()));
    }
}
