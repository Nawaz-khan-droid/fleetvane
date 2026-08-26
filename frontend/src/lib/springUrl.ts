/**
 * Single source of truth for direct browser -> Spring Boot calls (Track B).
 * Overridable per environment; defaults to the local dev backend.
 */
export const SPRING_URL =
  process.env.NEXT_PUBLIC_SPRING_BOOT_URL || 'http://localhost:8080';
