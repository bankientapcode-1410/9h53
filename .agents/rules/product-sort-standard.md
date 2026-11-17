# Product Sort Standard Rule

Mọi AI Agent khi phát triển, chỉnh sửa hoặc review tính năng sắp xếp danh sách sản phẩm/linh kiện trong dự án **SmartPC** (bao gồm Frontend UI, API Query, Validator, Service và Tài liệu Thiết kế Chi tiết DD/SDD — VD: Catalog UC1a/UC5, PC Builder UC2...) **bắt buộc** phải tuân thủ chuẩn bộ sắp xếp dưới đây.

## Bộ lựa chọn & Thứ tự bắt buộc (chỉ gồm đúng 4 giá trị):
1. `newest` — **Mới nhất** (mặc định; `created_at DESC, product_id ASC`)
2. `oldest` — **Cũ nhất** (`created_at ASC, product_id ASC`)
3. `price_asc` — **Giá tăng dần** (`price ASC, product_id ASC`)
4. `price_desc` — **Giá giảm dần** (`price DESC, product_id ASC`)

## Quy định bắt buộc:
1. **Chỉ 4 lựa chọn:** Tuyệt đối **KHÔNG** thêm bất kỳ tiêu chí sắp xếp nào khác ngoài 4 giá trị trên (không dùng `benchmark_desc` / `Hiệu năng cao nhất`, `popular_desc` / `Bán chạy`, `AI Phù hợp nhất`, `rating_desc`...).
2. **Đúng thứ tự cố định:** Mọi dropdown/selector sắp xếp trên Frontend (`SortDropdown`, `ComponentPickerModal`, v.v.) và đặc tả/validator tương ứng phải liệt kê đúng thứ tự: **Mới nhất → Cũ nhất → Giá tăng dần → Giá giảm dần** (`newest` → `oldest` → `price_asc` → `price_desc`).
3. **Nhãn hiển thị (UI Label):** Dùng nhãn chuẩn theo đúng thứ tự trên: `Mới nhất`, `Cũ nhất`, `Giá tăng dần`, `Giá giảm dần`.
4. **Mặc định & URL Query:** Khi không truyền `sort` hoặc chọn `newest`, mặc định là `newest`; khi đồng bộ URL query trên Frontend có thể lược bỏ `?sort=newest` để giữ URL gọn.
5. **Validation & Stability:** Backend phải whitelist đúng `{newest, oldest, price_asc, price_desc}` (trả `PROD_INVALID_FILTER` `400` nếu sai) và luôn kèm khóa phụ `product_id ASC` để phân trang ổn định.
