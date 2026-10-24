package com.smartpc.common.exception;

import com.smartpc.common.response.FieldErrorDTO;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.List;

@Getter
public class BusinessException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus httpStatus;
    private final List<FieldErrorDTO> errors;

    public BusinessException(String errorCode, String message) {
        this(errorCode, HttpStatus.BAD_REQUEST, message, Collections.emptyList());
    }

    public BusinessException(String errorCode, HttpStatus httpStatus, String message) {
        this(errorCode, httpStatus, message, Collections.emptyList());
    }

    public BusinessException(String errorCode, int httpStatusCode, String message) {
        this(errorCode, HttpStatus.valueOf(httpStatusCode), message, Collections.emptyList());
    }

    public BusinessException(String errorCode, List<FieldErrorDTO> errors) {
        this(errorCode, HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ", errors);
    }

    public BusinessException(String errorCode, HttpStatus httpStatus, String message, List<FieldErrorDTO> errors) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus != null ? httpStatus : HttpStatus.BAD_REQUEST;
        this.errors = errors != null ? errors : Collections.emptyList();
    }

    public BusinessException(ErrorCode errorCode) {
        this(errorCode.getCode(), errorCode.getHttpStatus(), errorCode.getDefaultMessage(), Collections.emptyList());
    }

    public BusinessException(ErrorCode errorCode, String customMessage) {
        this(errorCode.getCode(), errorCode.getHttpStatus(), customMessage, Collections.emptyList());
    }

    public BusinessException(ErrorCode errorCode, List<FieldErrorDTO> errors) {
        this(errorCode.getCode(), errorCode.getHttpStatus(), errorCode.getDefaultMessage(), errors);
    }

    public BusinessException(ErrorCode errorCode, String customMessage, List<FieldErrorDTO> errors) {
        this(errorCode.getCode(), errorCode.getHttpStatus(), customMessage, errors);
    }
}
