package com.banking.accountservice.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Turns exceptions into consistent JSON error responses (RFC 9457 "Problem Details"):
 * <pre>{@code
 * {
 *   "type": "about:blank",
 *   "title": "Resource already exists",
 *   "status": 409,
 *   "detail": "Account already exists with email: asha@example.com",
 *   "instance": "/api/v1/accounts/create",
 *   "errorCode": "RESOURCE_ALREADY_EXISTS",
 *   "timestamp": "2026-11-19T10:15:30Z"
 * }
 * }</pre>
 * Validation failures add an {@code errors} map of field -> message.
 * Extending {@link ResponseEntityExceptionHandler} keeps Spring's standard handling
 * (bad JSON, wrong HTTP method, missing params, ...) in the same format.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    /** Expected business failures: logged at WARN, message is safe to show the client. */
    @ExceptionHandler(BusinessException.class)
    public ProblemDetail handleBusinessException(BusinessException ex, HttpServletRequest request) {
        log.warn("{} on {}: {}", ex.getErrorCode(), request.getRequestURI(), ex.getMessage());
        return problem(ex.getErrorCode(), ex.getMessage(), request.getRequestURI());
    }

    /**
     * A unique constraint fired in the database - e.g. two requests created the same email
     * at the same moment, after both passed the existsByEmail check.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation on {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return problem(ErrorCode.RESOURCE_ALREADY_EXISTS,
                "The request conflicts with existing data", request.getRequestURI());
    }

    /** Anything unexpected: full stack trace in the log, generic message to the client (no internals leaked). */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {}", request.getRequestURI(), ex);
        return problem(ErrorCode.INTERNAL_ERROR,
                "Something went wrong. Please try again later.", request.getRequestURI());
    }

    /** {@code @Valid} failures on a request body: returns every field error at once. */
    @Override
    protected @Nullable ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.merge(fieldError.getField(), String.valueOf(fieldError.getDefaultMessage()),
                    (first, second) -> first + "; " + second);
        }
        ex.getBindingResult().getGlobalErrors()
                .forEach(error -> errors.merge(error.getObjectName(), String.valueOf(error.getDefaultMessage()),
                        (first, second) -> first + "; " + second));

        String path = request instanceof ServletWebRequest servletRequest
                ? servletRequest.getRequest().getRequestURI()
                : null;
        ProblemDetail body = problem(ErrorCode.VALIDATION_FAILED, "One or more fields are invalid", path);
        body.setProperty("errors", errors);
        return ResponseEntity.status(ErrorCode.VALIDATION_FAILED.status()).headers(headers).body(body);
    }

    private static ProblemDetail problem(ErrorCode code, String detail, @Nullable String path) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(code.status(), detail);
        problem.setTitle(code.title());
        if (path != null) {
            problem.setInstance(URI.create(path));
        }
        problem.setProperty("errorCode", code.name());
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
