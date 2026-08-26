package com.fleetvane.shared.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private HttpServletRequest request(String method, String uri) {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getMethod()).thenReturn(method);
        when(req.getRequestURI()).thenReturn(uri);
        return req;
    }

    @AfterEach
    void cleanMdc() {
        MDC.remove("correlationId");
    }

    @Test
    @DisplayName("BusinessException maps to its own HTTP status")
    void businessExceptionMapsOwnStatus() {
        ProblemDetail pd = handler.handleBusinessException(
                new BusinessException("Shipment must be ASSIGNED first", HttpStatus.CONFLICT));

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(pd.getDetail()).contains("ASSIGNED");
        assertThat(pd.getTitle()).isEqualTo("Business Rule Violation");
    }

    @Test
    @DisplayName("Data integrity violations return 409 WITHOUT leaking SQL/vendor details")
    void dataIntegrityDoesNotLeak() {
        String internal = "insert into shipments ... FK_SHIPMENT_CLIENT constraint [23503-232]";
        ProblemDetail pd = handler.handleDataIntegrityViolation(
                new org.springframework.dao.DataIntegrityViolationException(internal),
                request("POST", "/api/vehicles"));

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(pd.getDetail()).doesNotContain("insert into");
        assertThat(pd.getDetail()).doesNotContain("23503");
        assertThat(pd.getDetail()).doesNotContain(internal);
    }

    @Test
    @DisplayName("500 catch-all is generic, logs stack internally, and carries correlationId")
    void serverErrorIsGenericAndTraceable() {
        MDC.put("correlationId", "req_test_123");
        RuntimeException internal = new RuntimeException("secret internal state: super-secret-value");

        ProblemDetail pd = handler.handleAllOtherExceptions(internal, request("GET", "/api/shipments"));

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        // No leak of the internal message
        assertThat(pd.getDetail()).doesNotContain("super-secret-value");
        // Traceability present in both body extension and detail reference
        assertThat(pd.getProperties()).containsEntry("correlationId", "req_test_123");
        assertThat(pd.getDetail()).contains("req_test_123");

        MDC.remove("correlationId");
        ProblemDetail anon = handler.handleAllOtherExceptions(internal, request("GET", "/api/shipments"));
        assertThat(anon.getDetail()).doesNotContain("super-secret-value");
        assertThat(anon.getProperties()).isNull(); // no extension properties without a correlationId
    }

    @Test
    @DisplayName("Bean validation failures produce structured errors[] map")
    void validationProducesStructuredErrors() throws NoSuchMethodException {
        BeanPropertyBindingResult bindingResult =
                new BeanPropertyBindingResult(new Object(), "createShipmentRequest");
        bindingResult.addError(new FieldError("createShipmentRequest", "originAddress", "must not be blank"));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ProblemDetail pd = handler.handleValidationExceptions(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(pd.getProperties()).isNotNull();
        @SuppressWarnings("unchecked")
        var errors = (java.util.Map<String, String>) pd.getProperties().get("errors");
        assertThat(errors).containsEntry("originAddress", "must not be blank");
    }

    @Test
    @DisplayName("Malformed JSON body maps to 400 with safe message")
    void malformedBodyMapsTo400() {
        ProblemDetail pd = handler.handleUnreadableBody(request("POST", "/api/shipments"));
        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(pd.getDetail()).contains("not valid JSON");
    }
}
