package com.fleetvane.auth.controller;

import com.fleetvane.auth.entity.InvitationToken;
import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.dto.ActivateAccountRequest;
import com.fleetvane.auth.dto.InviteDriverRequest;
import com.fleetvane.auth.repository.InvitationTokenRepository;
import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.auth.security.InvitationTokenHasher;
import com.fleetvane.shared.exception.BusinessException;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.validation.Valid;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.fleetvane.driver.entity.DriverProfile;
import com.fleetvane.driver.repository.DriverProfileRepository;

@RestController
@RequestMapping("/api/auth")
public class EmailAuthController {

    private static final Logger log = LoggerFactory.getLogger(EmailAuthController.class);

    private final UserRepository userRepository;
    private final InvitationTokenRepository tokenRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.system.sender.email:noreply@fleetvane.com}")
    private String senderEmail;

    @Value("${app.base.url:http://localhost:3000}")
    private String appBaseUrl;

    @Value("${spring.sendgrid.api-key:}")
    private String sendGridApiKey;

    public EmailAuthController(UserRepository userRepository, 
                               InvitationTokenRepository tokenRepository,
                               DriverProfileRepository driverProfileRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================================================================
    // 🏢 1. GENERATE & EMAIL 48-HOUR ACTIVATION LINK (Fleet Manager Action)
    // =========================================================================
    @PostMapping("/invite-driver")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ROLE_MANAGER', 'ADMIN', 'ROLE_ADMIN')")
    @Transactional
    public ResponseEntity<?> inviteDriver(@Valid @RequestBody InviteDriverRequest request) {
        User invitingManager = currentAuthenticatedUser();
        if (invitingManager.getCompanyId() == null) {
            throw new BusinessException("Your account is not assigned to a company", HttpStatus.FORBIDDEN);
        }

        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BusinessException("A user with this email already exists", HttpStatus.CONFLICT);
        }
        
        long driverCount = userRepository.countByCompanyIdAndRole(invitingManager.getCompanyId(), "DRIVER");
        if (driverCount >= 10) {
            throw new BusinessException("You have reached the maximum limit of 10 drivers per account.", HttpStatus.BAD_REQUEST);
        }

        // Create the Driver user profile shell in the database
        User driver = new User();
        driver.setName(request.name().trim());
        driver.setEmail(normalizedEmail);
        driver.setPhoneNumber(request.phoneNumber().trim());
        // Tenant ownership is always resolved from the authenticated manager, never the request body.
        driver.setCompanyId(invitingManager.getCompanyId());
        driver.setRole("DRIVER");
        
        boolean isDemo = (invitingManager.getCompanyId() != null && invitingManager.getCompanyId() == 1L);
        
        if (isDemo) {
            driver.setPasswordHash(passwordEncoder.encode("Driver123!"));
            driver.setStatus("ACTIVE");
        } else {
            driver.setPasswordHash(passwordEncoder.encode(secureRandom.nextInt() + "dummy"));
            driver.setStatus("PENDING_ACTIVATION");
        }
        
        driver = userRepository.save(driver);

        DriverProfile profile = new DriverProfile(
            driver.getId(),
            request.licenseNumber().trim(),
            request.vehicleId(),
            false
        );
        driverProfileRepository.save(profile);

        if (isDemo) {
            return ResponseEntity.ok(Map.of("message", "Demo Driver account created and instantly activated. Password is 'Driver123!'."));
        }

        // Generate a 32-byte secure random token (64 hex characters)
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String secureToken = HexFormat.of().formatHex(tokenBytes);

        // Save Token details with a firm 48-hour expiration timestamp
        InvitationToken inviteToken = new InvitationToken();
        inviteToken.setUser(driver);
        inviteToken.setTokenHash(InvitationTokenHasher.sha256(secureToken));
        inviteToken.setLinkExpiresAt(LocalDateTime.now().plusHours(48));
        tokenRepository.save(inviteToken);

        // Formulate the absolute validation URL link
        String activationUrl = appBaseUrl + "/activate?token=" + secureToken;
        
        System.out.println("=========================================================");
        System.out.println("🚀 DRIVER ACTIVATION LINK: " + activationUrl);
        System.out.println("=========================================================");

        // Send email via SendGrid
        if (sendGridApiKey != null && !sendGridApiKey.isEmpty()) {
            Email from = new Email(senderEmail);
            String subject = "You've been invited to FleetVane";
            Email to = new Email(driver.getEmail());
            String htmlBody = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;'>" +
                    "<div style='background-color: #2563eb; padding: 24px; text-align: center;'>" +
                    "<h1 style='color: white; margin: 0; font-size: 24px;'>FleetVane</h1>" +
                    "</div>" +
                    "<div style='padding: 32px; background-color: #ffffff;'>" +
                    "<h2 style='color: #0f172a; margin-top: 0;'>Welcome to the Fleet, " + driver.getName() + "</h2>" +
                    "<p style='color: #475569; font-size: 16px; line-height: 1.5;'>Your Fleet Manager has invited you to join the FleetVane platform as a driver. To complete your onboarding and access your driving portal, please activate your account.</p>" +
                    "<div style='text-align: center; margin: 32px 0;'>" +
                    "<a href='" + activationUrl + "' style='background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;'>Activate My Account</a>" +
                    "</div>" +
                    "<p style='color: #94a3b8; font-size: 14px; text-align: center;'>This secure link is valid for <strong>48 hours</strong>.</p>" +
                    "<hr style='border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;' />" +
                    "<p style='color: #94a3b8; font-size: 12px; text-align: center; margin: 0;'>If you did not expect this invitation, you can safely ignore this email.</p>" +
                    "</div>" +
                    "</div>";

            Content content = new Content("text/html", htmlBody);
            Mail mail = new Mail(from, subject, to, content);
            SendGrid sg = new SendGrid(sendGridApiKey);
            Request sgRequest = new Request();
            try {
                sgRequest.setMethod(Method.POST);
                sgRequest.setEndpoint("mail/send");
                sgRequest.setBody(mail.build());
                
                Response response = sg.api(sgRequest);
                log.info("Driver invitation email submitted for {} with status {}", driver.getId(), response.getStatusCode());
            } catch (Exception e) {
                log.error("Failed to submit driver invitation email for {}", driver.getId(), e);
            }
        } else {
            log.warn("SendGrid is not configured; invitation email for driver {} was not sent", driver.getId());
        }

        return ResponseEntity.ok(Map.of("message", "Driver provisioned. Verification link deployed."));
    }

    // =========================================================================
    // 🔓 2. COMPLETE ACCOUNT ACTIVATION VIA EMAIL LINK CLICK
    // =========================================================================
    @PostMapping("/activate-account")
    @Transactional
    public ResponseEntity<?> activateAccount(@Valid @RequestBody ActivateAccountRequest request) {
        String token = request.token();
        String password = request.password();

        Optional<InvitationToken> inviteOpt = tokenRepository.findByTokenHash(InvitationTokenHasher.sha256(token));
        if (inviteOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or corrupt security link."));
        }

        InvitationToken invite = inviteOpt.get();

        // Security Validation Gates
        if (invite.isUsed()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Link Expired — This account is already active."));
        }
        if (LocalDateTime.now().isAfter(invite.getLinkExpiresAt())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Link Expired — The 48-hour activation window has passed."));
        }

        // Commit Account Activation Changes atomically
        User driver = invite.getUser();
        driver.setPasswordHash(passwordEncoder.encode(password)); 
        driver.setStatus("ACTIVE");
        userRepository.save(driver);

        // Terminate Token Lifecycle instantly to prevent link recycling exploits
        invite.setUsed(true);
        tokenRepository.save(invite);

        return ResponseEntity.ok(Map.of("message", "Account successfully activated!"));
    }
    
    // =========================================================================
    // ✕ MISTAKEN RECIPIENT REJECTION (Self-Healing Cleanup Task)
    // =========================================================================
    @PostMapping("/reject-invitation")
    @Transactional
    public ResponseEntity<?> rejectInvitation(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        Optional<InvitationToken> inviteOpt = tokenRepository.findByTokenHash(InvitationTokenHasher.sha256(token));

        if (inviteOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Link is invalid or already processed."));
        }

        InvitationToken invite = inviteOpt.get();
        if (invite.isUsed()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot reject a fully activated profile."));
        }

        User driver = invite.getUser();
        userRepository.delete(driver); 
        log.info("Pending driver invitation rejected and removed for driver {}", driver.getId());
        return ResponseEntity.ok(Map.of("message", "Invitation successfully cancelled. Data cleared."));
    }
    // =========================================================================
    // ⏰ BACKGROUND WORKER (48-Hour Cleanup)
    // =========================================================================
    @Scheduled(cron = "0 0 * * * *") // Run hourly
    @Transactional
    public void cleanupExpiredInvitations() {
        List<InvitationToken> expiredTokens = tokenRepository.findAllByLinkExpiresAtBeforeAndIsUsedFalse(LocalDateTime.now());
        for (InvitationToken token : expiredTokens) {
            User driver = token.getUser();
            if ("PENDING_ACTIVATION".equalsIgnoreCase(driver.getStatus())) {
                userRepository.delete(driver);
                // Token is deleted via CASCADE
            }
        }
    }

    private User currentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException("Authentication is required", HttpStatus.UNAUTHORIZED);
        }
        try {
            Long userId = Long.valueOf(authentication.getName());
            return userRepository.findById(userId)
                    .orElseThrow(() -> new BusinessException("Authenticated user no longer exists", HttpStatus.UNAUTHORIZED));
        } catch (NumberFormatException ex) {
            throw new BusinessException("Authentication must use user ID as principal name", HttpStatus.UNAUTHORIZED);
        }
    }

    // =========================================================================
    // 🚀 DEMO MODE: Instant driver creation (no email verification)
    // Only works when the manager is a demo account (companyId == 1)
    // =========================================================================
    @PostMapping("/invite-driver/demo")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ROLE_MANAGER', 'ADMIN', 'ROLE_ADMIN')")
    @Transactional
    public ResponseEntity<?> createDemoDriver(@Valid @RequestBody InviteDriverRequest request) {
        User invitingManager = currentAuthenticatedUser();
        if (invitingManager.getCompanyId() == null) {
            throw new BusinessException("Your account is not assigned to a company", HttpStatus.FORBIDDEN);
        }

        // Only permit demo accounts (companyId 1 = seeded demo company)
        if (!Long.valueOf(1L).equals(invitingManager.getCompanyId())) {
            throw new BusinessException("Demo driver creation is only available for demo accounts", HttpStatus.FORBIDDEN);
        }

        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BusinessException("A user with this email already exists", HttpStatus.CONFLICT);
        }

        long driverCount = userRepository.countByCompanyIdAndRole(invitingManager.getCompanyId(), "DRIVER");
        if (driverCount >= 10) {
            throw new BusinessException("You have reached the maximum limit of 10 drivers per account.", HttpStatus.BAD_REQUEST);
        }

        // Create driver with default password (Driver123!) and immediately ACTIVE status
        User driver = new User();
        driver.setName(request.name().trim());
        driver.setEmail(normalizedEmail);
        driver.setPhoneNumber(request.phoneNumber() != null ? request.phoneNumber().trim() : "");
        driver.setCompanyId(invitingManager.getCompanyId());
        driver.setRole("DRIVER");
        driver.setPasswordHash(passwordEncoder.encode("Driver123!"));
        driver.setStatus("ACTIVE");
        driver = userRepository.save(driver);

        DriverProfile profile = new DriverProfile(
            driver.getId(),
            request.licenseNumber() != null ? request.licenseNumber().trim() : "DEMO-LICENSE",
            request.vehicleId(),
            false
        );
        driverProfileRepository.save(profile);

        log.info("Demo driver created instantly: {} (id={})", driver.getEmail(), driver.getId());

        return ResponseEntity.ok(Map.of(
            "message", "Demo driver account created successfully with default password: Driver123!",
            "driverId", driver.getId(),
            "email", driver.getEmail(),
            "defaultPassword", "Driver123!"
        ));
    }
}
