# Detailed Design First Rule

Tất cả AI Agent khi làm việc trong dự án này bắt buộc phải tạo hoặc cập nhật tài liệu Thiết kế Chi tiết (Detailed Design - DD) trong thư mục `docs/detail-design/` (ví dụ: `docs/detail-design/dd-ucX-<feature>.md`) trước khi thực hiện viết bất kỳ mã nguồn nào (Backend, Frontend, Database, Scripts).

## Quy chuẩn bắt buộc:
1. Đọc và bám sát kiến trúc tổng thể trong `sdd.md`.
2. **Giữ tài liệu DD gọn nhẹ (Hub-and-Spoke):**
   - Với phân hệ nhỏ ($\le$ 400 dòng): viết 1 file DD đơn đầy đủ các mục (Sơ đồ Lớp, Sơ đồ Tuần tự, Logic chi tiết/Validation/Algorithms, REST API Spec, Database/Index DDL, Test Scenarios).
   - Với phân hệ lớn (> 400 dòng hoặc $\ge$ 3 chức năng độc lập): tách thành **Master DD** (`dd-ucX-<module>.md`, ~150–250 dòng chứa kiến trúc chung, Shared Contracts và Bảng Điều phối) + các **Sub-DD** theo chức năng (`ucX-<module>/dd-ucX-<chuc-nang>.md`, ~150–350 dòng kèm **Agent Context Card** ở đầu file). Khi mở rộng tính năng, tạo Sub-DD mới và refer từ Master DD thay vì nối dài file cũ.
3. **Lập Wave Plan gọn (chỉ khi là Master DD + Sub-DD):** Với phân hệ chia **Master DD + Sub-DD**, lập `docs/implementation-plan/plan-ucX-<module>.md` (~40–80 dòng) chỉ để chia `Wave 0 -> Wave 1..N -> Final Wave`, khóa quyền ghi file dùng chung (`Shared-File Write Lock`) và theo dõi trạng thái — **không lặp lại** `Owned Files` hay bẻ micro-task `DB->Service->FE`. Bỏ qua bước lập plan cho **DD Đơn ($\le$ 400 dòng)** hoặc sửa cục bộ 1 Sub-DD. Cập nhật link DD (+ Wave Plan nếu có) trong `sdd.md`.
4. **Điều phối Scoped Subagent (khi dùng agent nhỏ theo Sub-DD):** Agent chính giữ vai trò Coordinator đọc `sdd.md` + Master DD + Wave Plan; Subagent chỉ đọc Sub-DD được giao, `Shared Contracts` liên quan và sửa đúng `Owned Files` theo `Shared-File Write Lock` của Wave (tránh đụng file dùng chung như `ErrorCode.java`, `App.tsx`, `types/index.ts`).
5. Chỉ tiến hành lập trình khi thiết kế chi tiết đã hoàn thiện; nếu phát hiện bất hợp lý khi code phải dừng để cập nhật DD/Sub-DD trước.
