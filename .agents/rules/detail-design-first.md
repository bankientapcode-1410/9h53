# Detailed Design First Rule

Tất cả AI Agent khi làm việc trong dự án này bắt buộc phải tạo hoặc cập nhật tài liệu Thiết kế Chi tiết (Detailed Design - DD) trong thư mục `docs/detail-design/` (ví dụ: `docs/detail-design/dd-ucX-<feature>.md`) trước khi thực hiện viết bất kỳ mã nguồn nào (Backend, Frontend, Database, Scripts).

## Quy chuẩn bắt buộc:
1. Đọc và bám sát kiến trúc tổng thể trong `sdd.md`.
2. Tạo/cập nhật tài liệu DD trong `docs/detail-design/` đầy đủ các mục: Sơ đồ Lớp, Sơ đồ Tuần tự, Logic chi tiết/Validation/Algorithms, REST API Spec, Database/Index DDL, Test Scenarios.
3. Cập nhật link tham chiếu tài liệu DD trong `sdd.md`.
4. Chỉ tiến hành lập trình khi thiết kế chi tiết đã hoàn thiện.
