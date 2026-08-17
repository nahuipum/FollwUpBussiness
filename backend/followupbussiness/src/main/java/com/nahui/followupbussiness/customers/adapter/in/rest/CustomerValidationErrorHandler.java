package com.nahui.followupbussiness.customers.adapter.in.rest;

import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice(assignableTypes = CustomerController.class)
public final class CustomerValidationErrorHandler {
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class, IllegalArgumentException.class})
    ResponseEntity<?> invalid(Exception ignored, WebRequest request) {
        UUID correlation = request instanceof ServletWebRequest servlet ? CustomerController.correlationId(servlet.getRequest()) : UUID.randomUUID();
        return CustomerController.problem(org.springframework.http.HttpStatus.BAD_REQUEST, correlation);
    }
}
