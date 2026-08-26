package com.fleetvane.shared.exception;

import jakarta.persistence.OptimisticLockException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

/**
 * Central RFC 7807 (Problem Details) mapping for every REST error surface.
 *
 * Guarantees:
 *  - Every response is application/problem+json with a stable shape.
 *  - 5xx bodies NEVER leak internal exception details; full stack goes to the log
 *    with the correlation ID from {@link org.slf4j.MDC} (wired by CorrelationIdFilter),
 *    and the correlationId travels to the client as an extension property.
 *  - Client faults (4xx) are logged at WARN without stack traces to keep logs signal-dense.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── 404 ──
    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFound(ResourceNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Resource Not Found", ex.getMessage());
    }

    // ── Domain/business rules (state machine violations, ownership, guardrails) ──
    @ExceptionHandler(BusinessException.class)
    public ProblemDetail handleBusinessException(BusinessException ex) {
        boolean clientFault = ex.getStatus().is4xxClientError();
        if (!clientFault) {
            log.error("Business exception escalated as server fault: {}", ex.getMessage());
        } else {
            log.warn("Business rule rejected request: {}", ex.getMessage());
        }
        return problem(ex.getStatus(), "Business Rule Violation", ex.getMessage());
    }

    // ── 400: malformed JSON body ──
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadableBody(HttpServletRequest req) {
        log.warn("Malformed request body on {} {}", req.getMethod(), req.getRequestURI());
        return problem(HttpStatus.BAD_REQUEST, "Malformed Request",
                "Request body is missing or is not valid JSON.");
    }

    // ── 400: bad parameter types (e.g. /shipments/abc where id is numeric) ──
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String detail = String.format("Parameter '%s' received invalid value '%s'.",
                ex.getName(), String.valueOf(ex.getValue()));
        log.warn(detail);
        return problem(HttpStatus.BAD_REQUEST, "Invalid Parameter", detail);
    }

    // ── 400: bean-validation failures -> structured errors[] extension ──
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> errors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        ex.getBindingResult().getGlobalErrors()
                .forEach(ge -> errors.putIfAbsent(ge.getObjectName(), ge.getDefaultMessage()));

        log.warn("Validation failed: {}", errors);
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, "Validation Failed",
                "One or more fields are invalid.");
        pd.setProperty("errors", errors);
        return pd;
    }

    // ── 400: constraint violations outside bean binding (params, manual validators) ──
    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> errors = new HashMap<>();
        for (ConstraintViolation<?> v : ex.getConstraintViolations()) {
            errors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage());
        }
        log.warn("Constraint violation: {}", errors);
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, "Constraint Violation",
                "One or more parameters are invalid.");
        pd.setProperty("errors", errors);
        return pd;
    }

    // ── 409: optimistic locking ──
    @ExceptionHandler({OptimisticLockException.class, ObjectOptimisticLockingFailureException.class})
    public ProblemDetail handleOptimisticLockingFailure(Exception ex) {
        log.warn("Concurrent modification detected: {}", ex.getMessage());
        return problem(HttpStatus.CONFLICT, "Concurrent Modification",
                "Resource was modified by another transaction. Please reload and try again.");
    }

    // ── 409: database integrity (unique/FK) — raw SQL/vendor text stays in logs ──
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolation(
            org.springframework.dao.DataIntegrityViolationException ex, HttpServletRequest req) {
        log.warn("Data integrity violation on {} {}: {}", req.getMethod(), req.getRequestURI(), ex.getMessage());
        return problem(HttpStatus.CONFLICT, "Data Conflict",
                "The request conflicts with existing data (duplicate key or referenced resource).");
    }

    // ── 403 ──
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return problem(HttpStatus.FORBIDDEN, "Access Denied",
                "You do not have permission to perform this action.");
    }

    // ── 500 catch-all: NEVER leak internals ──
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleAllOtherExceptions(Exception ex, HttpServletRequest req) {
        String correlationId = org.slf4j.MDC.get("correlationId");
        log.error("Unhandled exception on {} {} [correlationId={}]",
                req.getMethod(), req.getRequestURI(), correlationId, ex);

        ProblemDetail pd = problem(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                "An unexpected error occurred. Reference correlationId '" + correlationId +
                "' when contacting support.");
        if (correlationId != null) {
            pd.setProperty("correlationId", correlationId);
        }
        return pd;
    }

    private static ProblemDetail problem(HttpStatus status, String title, String detail) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(title);
        return pd;
    }
}
