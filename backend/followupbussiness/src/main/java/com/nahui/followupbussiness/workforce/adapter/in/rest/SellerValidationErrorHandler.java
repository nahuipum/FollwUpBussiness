package com.nahui.followupbussiness.workforce.adapter.in.rest;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice(assignableTypes = SellerController.class)
public final class SellerValidationErrorHandler {
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    ResponseEntity<?> invalid(Exception ignored, WebRequest request) {
        UUID correlation = request instanceof ServletWebRequest servlet
                ? SellerController.correlationId(servlet.getRequest())
                : correlationId(request.getHeader("X-Correlation-Id"));
        return SellerController.problem(HttpStatus.BAD_REQUEST, correlation);
    }

    private static UUID correlationId(String supplied) {
        try {
            return UUID.fromString(supplied);
        } catch (Exception ignored) {
            return UUID.randomUUID();
        }
    }
}
