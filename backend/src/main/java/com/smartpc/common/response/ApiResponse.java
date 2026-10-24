package com.smartpc.common.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;

    @JsonProperty("status_code")
    private int statusCode;

    private String message;

    private T data;

    @JsonProperty("error_code")
    private String errorCode;

    private List<FieldErrorDTO> errors;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .statusCode(HttpStatus.OK.value())
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Thành công");
    }

    public static <T> ApiResponse<T> created(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .statusCode(HttpStatus.CREATED.value())
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(int statusCode, String errorCode, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .statusCode(statusCode)
                .errorCode(errorCode)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(int statusCode, String errorCode, String message, List<FieldErrorDTO> errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .statusCode(statusCode)
                .errorCode(errorCode)
                .message(message)
                .errors(errors)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(HttpStatus status, String errorCode, String message) {
        return error(status != null ? status.value() : HttpStatus.BAD_REQUEST.value(), errorCode, message);
    }

    public static <T> ApiResponse<T> error(HttpStatus status, String errorCode, String message, List<FieldErrorDTO> errors) {
        return error(status != null ? status.value() : HttpStatus.BAD_REQUEST.value(), errorCode, message, errors);
    }
}
