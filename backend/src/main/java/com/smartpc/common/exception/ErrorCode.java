package com.smartpc.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // General & System Error Codes
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Dữ liệu đầu vào không hợp lệ"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên yêu cầu"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Yêu cầu xác thực tài khoản"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ"),

    // Product & Category Subsystem (UC5 & UC1a)
    PROD_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin sản phẩm hoặc sản phẩm đã ngừng kinh doanh"),
    PROD_CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "Danh mục không tồn tại"),
    PROD_CATEGORY_NOT_LEAF(HttpStatus.BAD_REQUEST, "Gắn sản phẩm vào danh mục nhóm hoặc danh mục chưa có schema thông số kỹ thuật"),
    PROD_INVALID_SPECS(HttpStatus.BAD_REQUEST, "Thông số kỹ thuật linh kiện không hợp lệ đối với danh mục này"),
    PROD_INVALID_FILTER(HttpStatus.BAD_REQUEST, "Tham số lọc, sắp xếp hoặc phân trang không hợp lệ"),
    PROD_CONCURRENT_MODIFICATION(HttpStatus.CONFLICT, "Sản phẩm đã được người khác cập nhật. Vui lòng tải lại dữ liệu mới nhất"),
    PROD_CATEGORY_CODE_EXISTS(HttpStatus.CONFLICT, "Mã danh mục đã tồn tại trong hệ thống"),
    PROD_CATEGORY_CODE_IMMUTABLE(HttpStatus.BAD_REQUEST, "Mã danh mục là bất biến, không được phép thay đổi"),
    PROD_CATEGORY_CIRCULAR_REF(HttpStatus.BAD_REQUEST, "Không thể chọn danh mục này làm cha vì sẽ tạo vòng lặp quan hệ"),
    PROD_CATEGORY_INVALID_PARENT(HttpStatus.BAD_REQUEST, "Cây danh mục tối đa 2 cấp hoặc danh mục cha đang chứa sản phẩm"),
    PROD_CATEGORY_HAS_CHILDREN(HttpStatus.CONFLICT, "Không thể xóa danh mục đang chứa danh mục con"),
    PROD_CATEGORY_HAS_PRODUCTS(HttpStatus.CONFLICT, "Không thể xóa danh mục đang có sản phẩm liên kết"),
    PROD_CATEGORY_IN_USE_BY_RULES(HttpStatus.CONFLICT, "Không thể xóa danh mục đang được tham chiếu bởi luật tương thích"),
    PROD_OUT_OF_STOCK(HttpStatus.CONFLICT, "Sản phẩm đã hết hàng hoặc không đủ số lượng tồn kho"),
    PROD_SYNC_IN_PROGRESS(HttpStatus.CONFLICT, "Sản phẩm đang trong quá trình đồng bộ vector, vui lòng thử lại sau ít phút"),
    PROD_BATCH_TOO_LARGE(HttpStatus.BAD_REQUEST, "Số lượng sản phẩm yêu cầu đồng bộ vượt quá giới hạn tối đa cho phép"),
    PROD_AI_GATEWAY_ERROR(HttpStatus.BAD_GATEWAY, "Không thể kết nối đến dịch vụ AI Embedding"),
    PROD_AI_GATEWAY_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "Dịch vụ AI Embedding phản hồi quá chậm (quá thời gian chờ)");

    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }

    public String getCode() {
        return this.name();
    }
}
