# Frontend Global Header Design Rule

Mọi AI Agent khi phát triển hoặc chỉnh sửa giao diện Frontend của dự án **SmartPC** (`frontend/src/App.tsx` hoặc các component layout liên quan) bắt buộc phải tuân thủ thiết kế **Bright Global Header 3 tầng**:

## Cấu trúc 3 tầng bắt buộc:
1. **Tầng 1 — Main Top Bar (`bg-white border-b border-slate-100`, `h-16`):**
   - **Trái:** Logo `SmartPC` (icon `Cpu` trên nền `bg-smart-blue p-2 rounded-xl text-white` + chữ `Smart` màu `text-smart-navy` và `PC` màu `text-smart-blue`).
   - **Giữa:** Thanh tìm kiếm toàn cục (`rounded-full bg-slate-50 border border-slate-200`) đồng bộ với tham số `?search=` trên URL, kèm nút submit `Tìm kiếm` (`bg-smart-blue text-white rounded-full`).
   - **Phải:** Cụm tiện ích gồm Tổng đài tư vấn (`1900 8899`), bộ chọn ngôn ngữ (`VN`), bộ chuyển đổi chế độ `Store` / `Admin`, nút Giỏ hàng có badge số lượng (`bg-smart-red`), và nút `Đăng nhập`.

2. **Tầng 2 — Secondary Navigation Bar (`bg-white border-b border-slate-200/70`, `h-11`):**
   - **Menu bên trái:** Gồm đúng 5 mục theo thứ tự:
     1. `Sản phẩm` (`/products`)
     2. `Danh mục linh kiện` (`/products?category=CPU`)
     3. `PC Builder` (`/#builder`, kèm icon `Wrench` màu `text-smart-blue` — **chỉ để tên `PC Builder`, tuyệt đối KHÔNG thêm `(AI)` và KHÔNG thêm badge/icon `PRO` bên cạnh**)
     4. `PC Profile` (`/#profile`, kèm icon `Bot` màu `text-smart-blue`)
     5. `Hỗ trợ kỹ thuật` (`/#support`, kèm icon `Headphones` màu `text-slate-500`)
   - **Bên phải:** Huy hiệu cam kết `Chính hãng 100%` và `Giao nhanh 2h`.

3. **Tầng 3 — Context Bar (Storefront vs Admin):**
   - **Storefront:** Thanh `Phổ biến:` (`bg-slate-50/90`) liệt kê 8 danh mục chuẩn (`CPU`, `GPU`, `MOTHERBOARD`, `RAM`, `SSD_M2`, `PSU`, `CASE`, `CPU_COOLER`), kèm badge `AI Compatibility Engine V4.2 Sẵn sàng` và `Bảo hành 36T 1 đổi 1 tận nơi`.
   - **Admin (`/admin/*`):** Thanh `Portal Quản Trị:` (`bg-amber-50/90 border-t border-amber-200/80`) chứa liên kết điều hướng nhanh các phân hệ Admin.
