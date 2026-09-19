package com.fleetvane.auth.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Produces a deterministic digest for high-entropy invitation tokens.
 * Raw invitation tokens are sent only in the activation link and are never persisted.
 */
public final class InvitationTokenHasher {

    private InvitationTokenHasher() {
    }

    public static String sha256(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 must be available in the JVM", ex);
        }
    }
}
