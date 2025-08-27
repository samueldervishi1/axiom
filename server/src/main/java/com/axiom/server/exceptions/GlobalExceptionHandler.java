package com.axiom.server.exceptions;

import com.axiom.server.models.Error;
import com.axiom.server.services.LoggingService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.sql.SQLException;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final LoggingService loggingService;

    public GlobalExceptionHandler(LoggingService loggingService) {
        this.loggingService = loggingService;
    }

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<Error> handleCustomException(CustomException ex, HttpServletRequest request) {
        String errorId = generateErrorId();

        if (ex.getCode() >= 500) {
            logger.error("Server error [{}]: {} - Path: {}", errorId, ex.getMessage(), request.getRequestURI());
            if (loggingService != null) {
                loggingService.logError("GlobalExceptionHandler", "handleCustomException",
                        "Server error: " + ex.getMessage(), ex);
            }
        } else {
            logger.warn("Client error [{}]: {} - Path: {}", errorId, ex.getMessage(), request.getRequestURI());
        }

        Error error = ex.getFaultObject() != null
                ? ex.getFaultObject()
                : buildError(String.valueOf(ex.getCode()), ex.getMessage(), HttpStatus.valueOf(ex.getCode()));

        return ResponseEntity.status(ex.getCode()).body(error);
    }

    @ExceptionHandler(SQLException.class)
    public ResponseEntity<Error> handleSQLException(SQLException ex, HttpServletRequest request) {
        String errorId = generateErrorId();

        logger.error("Database error [{}]: {} - Path: {}", errorId, ex.getMessage(), request.getRequestURI());
        if (loggingService != null) {
            loggingService.logError("GlobalExceptionHandler", "handleSQLException",
                    "Database error: " + ex.getMessage(), ex);
        }

        Error error = Error.serverError("Database operation failed").hint("Maybe try that again? ☕");
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Error> handleValidationException(MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        String errorId = generateErrorId();

        String message = ex.getBindingResult().getFieldErrors().stream().findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage()).orElse("Validation failed");

        logger.warn("Validation error [{}]: {} - Path: {}", errorId, message, request.getRequestURI());

        Error error = Error.badRequest("Validation failed: " + message).hint("Check your input and try again");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Error> handleMissingParameter(MissingServletRequestParameterException ex,
            HttpServletRequest request) {
        String errorId = generateErrorId();
        String message = "Missing required parameter: " + ex.getParameterName();

        logger.warn("Missing parameter [{}]: {} - Path: {}", errorId, message, request.getRequestURI());

        Error error = Error.badRequest(message).hint("Check the required parameters");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Error> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {
        String errorId = generateErrorId();
        assert ex.getRequiredType() != null;
        String message = "Invalid parameter type for '" + ex.getName() + "'. Expected: "
                + ex.getRequiredType().getSimpleName();

        logger.warn("Type mismatch [{}]: {} - Path: {}", errorId, message, request.getRequestURI());

        Error error = Error.badRequest(message).hint("Check parameter types");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Error> handleJsonParseException(HttpMessageNotReadableException ex,
            HttpServletRequest request) {
        String errorId = generateErrorId();
        String message = "Malformed JSON request";

        logger.warn("JSON parse error [{}]: {} - Path: {}", errorId, ex.getMessage(), request.getRequestURI());

        Error error = Error.badRequest(message).hint("Check your JSON format");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Error> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request) {
        String errorId = generateErrorId();
        String message = "Method " + ex.getMethod() + " not supported for this endpoint";

        logger.warn("Method not supported [{}]: {} - Path: {}", errorId, message, request.getRequestURI());

        Error error = Error.custom("405", message, "error").hint("Check the HTTP method");
        return new ResponseEntity<>(error, HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Error> handleMaxUploadSizeExceeded(HttpServletRequest request) {
        String errorId = generateErrorId();
        String message = "File size exceeds maximum allowed limit";

        logger.warn("File size exceeded [{}]: {} - Path: {}", errorId, message, request.getRequestURI());

        Error error = Error.custom("413", message, "error").hint("Try a smaller file");
        return new ResponseEntity<>(error, HttpStatus.PAYLOAD_TOO_LARGE);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Error> handleGenericException(Exception ex, HttpServletRequest request) {
        String errorId = generateErrorId();

        logger.error("Unexpected error [{}]: {} - Path: {}", errorId, ex.getMessage(), request.getRequestURI(), ex);
        if (loggingService != null) {
            loggingService.logError("GlobalExceptionHandler", "handleGenericException",
                    "Unexpected error: " + ex.getMessage(), ex);
        }

        Error error = Error.serverError("An unexpected error occurred").hint("Maybe try that again? ☕");
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private Error buildError(String code, String message, HttpStatus status) {
        return Error.custom(code, message, status.getReasonPhrase().toLowerCase());
    }

    private String generateErrorId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}
