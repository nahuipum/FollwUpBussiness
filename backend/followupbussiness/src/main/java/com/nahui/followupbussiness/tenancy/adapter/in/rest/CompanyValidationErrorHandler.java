package com.nahui.followupbussiness.tenancy.adapter.in.rest;

import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice(assignableTypes = CompanyController.class)
public final class CompanyValidationErrorHandler {
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    ResponseEntity<?> invalid(Exception ignored, WebRequest request) {
        UUID correlation = request instanceof org.springframework.web.context.request.ServletWebRequest servlet
                ? CompanyController.correlationId(servlet.getRequest())
                : CompanyController.correlationId(request.getHeader("X-Correlation-Id"));
        return CompanyController.problem(org.springframework.http.HttpStatus.BAD_REQUEST, correlation);
    }
}
