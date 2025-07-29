package com.axiom.server.exceptions;

import com.axiom.server.models.Error;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<Error> handleCustomException(CustomException ex) {
        logger.warn("Custom exception: {} - {}", ex.getCode(), ex.getMessage());

        Error error = ex.getFaultObject() != null
                ? ex.getFaultObject()
                : buildError(String.valueOf(ex.getCode()), ex.getMessage(), HttpStatus.valueOf(ex.getCode()));

        return ResponseEntity.status(ex.getCode()).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Error> handleGenericException(Exception ex) {
        logger.error("Unhandled exception: ", ex);

        Error error = Error.serverError(ex.getMessage()).hint("Maybe try that again? ☕");

        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private Error buildError(String code, String message, HttpStatus status) {
        return Error.custom(code, message, status.getReasonPhrase().toLowerCase());
    }
}
