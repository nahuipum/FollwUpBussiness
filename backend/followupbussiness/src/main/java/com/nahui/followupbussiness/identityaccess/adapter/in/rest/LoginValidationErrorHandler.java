package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import java.net.URI;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/** Keeps malformed and validation-rejected credential values out of logs and responses. */
@RestControllerAdvice(assignableTypes = LoginController.class)
public final class LoginValidationErrorHandler {
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    ResponseEntity<ProblemDetail> invalidRequest(Exception ignored, WebRequest request) {
        String correlationId = correlationId(request.getHeader("X-Correlation-Id"));
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request cannot be processed");
        problem.setType(URI.create("urn:fieldsales:auth:validation-failed"));
        problem.setProperty("code", "VALIDATION_FAILED");
        problem.setProperty("correlationId", correlationId);
        return ResponseEntity.badRequest()
                .header("Cache-Control", "no-store")
                .header("Pragma", "no-cache")
                .header("X-Correlation-Id", correlationId)
                .body(problem);
    }

    private static String correlationId(String supplied) {
        try {
            return supplied == null ? UUID.randomUUID().toString() : UUID.fromString(supplied).toString();
        } catch (IllegalArgumentException ignored) {
            return UUID.randomUUID().toString();
        }
    }
}
