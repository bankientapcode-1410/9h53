# Hướng dẫn Prompt Dùng Cho Google Stitch (SmartPC)

Dưới đây là các câu lệnh (prompts) hoàn chỉnh được thiết kế theo đúng nhận diện thương hiệu **SmartPC** (Bảng màu: Navy đậm `#1A2332`, Xanh dương `#1A44D8`, Xanh ngọc `#00BCD4`, Nền sáng `#FFFFFF`/`#F8F9FA`, Đỏ CTA `#E30019`).

Các prompt này tương ứng chính xác với các màn hình mẫu (`screen0.png` — `screen6.png`) trong tài liệu thiết kế đặc tả `prj1.md`.

---

## 1. Màn hình Đăng nhập / Đăng ký (Screen 0 - `screen0.png`)
**Prompt:**
```text
Design a professional e-commerce login page for a Vietnamese PC hardware store called "SmartPC".

LAYOUT: Split-screen, 2 equal columns.

LEFT COLUMN (50%):
- Dark navy background (#1A2332)
- Large high-quality hero image showing assembled PC components: a GPU, motherboard with RGB RAM sticks, in dramatic lighting
- Below the image, 3 selling point items in a horizontal row with icons:
  ✅ "Tự Động Kiểm Tra Tương Thích"
  🤖 "Tư Vấn Nâng Cấp Bằng AI"
  🏅 "100% Linh Kiện Chính Hãng"
- Bottom thin bar with text: "Kho hàng sẵn sàng | Giao hỏa tốc 2H toàn quốc | Hỗ trợ Build PC: MIỄN PHÍ"

RIGHT COLUMN (50%):
- Clean white background (#FFFFFF)
- Two tabs at top: "🔗 Đăng nhập" (active, blue underline #1A44D8) and "✏️ Đăng ký mới"
- Title: "Chào mừng quay trở lại!" with subtitle
- Form fields: Email input with mail icon, Password input with lock icon and show/hide eye toggle
- Checkbox: "Ghi nhớ đăng nhập (30 ngày)" with link "Quên mật khẩu?" aligned right
- Large blue (#1A44D8) CTA button: "🔒 ĐĂNG NHẬP"
- Divider line with text "HOẶC TIẾP TỤC VỚI"
- Two outlined social login buttons side by side: "G Google" and "f Facebook"
- Bottom text: "Chưa có tài khoản? Đăng ký tài khoản mới ngay" (link in blue)

HEADER: Navy bar (#1A2332) with logo "SmartPC", nav items: Trang chủ, Sản phẩm, Danh mục, PC Builder, PC Profile, Hỗ trợ. Language selector "VN", cart icon, user icon.

FOOTER: 4-column footer.
```

---

## 2. Màn hình Trang Chủ (Screen 1 - `screen1.png`)
**Prompt:**
```text
Design a comprehensive Vietnamese e-commerce homepage for a PC hardware store called "SmartPC". Aspect ratio: 9:16 (tall).

HEADER (sticky, dark navy #1A2332):
- Logo "SmartPC", search bar with placeholder and "✨ AI prompt" button
- Cart icon with red badge "5", user avatar "Nguyễn Văn A"
- Navigation row below: 🏠 Trang chủ | 📦 Danh mục linh kiện ▾ | 🔧 PC Builder & Check Tương Thích | 💻 PC Profile của tôi

HERO SECTION:
- Left (60%): Dark gradient background (#1A2332) with large text "Build PC Gaming từ 15 Triệu". Below: stats "99.98% Tương thích chính xác socket | < 2ms Thời gian rule-check". Two CTA buttons (Primary Blue #1A44D8 and Outlined).
- Right (40%): Featured combo product card on white background.

3 FEATURE CARDS (horizontal row):
- AI Reasoning & Semantic Search | Hardware Rule Engine | PC Profile & Bottleneck Detection

CATEGORY ICON ROW: 6 rounded square icons (CPU, GPU, RAM, SSD, Mainboard, Nguồn & Vỏ Case).

TRENDING PRODUCTS SECTION:
- 4-column product card grid on light background (#F8F9FA). Each card: product image, name, star rating, key spec tags (Socket, TDP), price, "🛒 Thêm giỏ" and "🔧 + PC Builder" buttons.

AI ASSISTANT HUB SECTION (dark navy background #1A2332):
- Gemini sparkle icon (#00BCD4) with title "Hỏi Chuyên Gia AI Phần Cứng"
- Large search input with button "Gửi câu hỏi cho AI ✨"
- Quick prompt chip suggestions below.

FOOTER: Dark footer (#1A2332) with 4 columns.
```

---

## 3. Nhóm Màn hình Tìm kiếm AI (Screen 2a, 2b, 2c - `screen2a.png`, `screen2b.png`, `screen2c.png`)
**Prompt:**
```text
Design an AI-powered search results page for a Vietnamese PC hardware store "SmartPC". User searched: "Card đồ họa chơi game tầm 8 triệu".

HEADER: Dark navy header (#1A2332).

AI ANALYSIS PANEL (light blue box #EFF6FF, border #BFDBFE):
- "AI hiểu: 'VGA gaming, budget ≤ 8tr, đồ họa NV/AMD'"
- AI advisory paragraph explaining GPU recommendations with Gemini sparkle icon.
- Extracted condition tags (Category, Budget, Purpose, etc).

FILTER BAR (horizontal chips):
- Brand chips: [Tất cả] [Nvidia] [AMD] [Intel]
- Price dropdown: "Dưới 8 triệu ▾"
- VRAM chips: [8GB] [12GB] [16GB]
- Sort dropdown: "✨ AI Phù hợp nhất ▾"

PRODUCT RESULTS (vertical list cards on light background):
- Card 1: TOP PICK (95% AI match). Product image of ASUS RTX 4060, full name, rating, specs. Price 7.990.000đ. AI explanation box explaining why it matches. Blue CTA buttons "Thêm vào giỏ hàng" (#1A44D8) and "Thêm vào PC Builder".
- Card 2: BEST VALUE (89% match). AMD Radeon RX 7600.
- Card 3: VRAM LARGE (88% match). MSI RTX 3060 12GB.
```

---

## 4. Màn hình Chi tiết Sản phẩm (Screen 3 - `screen3.png`)
**Prompt:**
```text
Design a product detail page for an NVIDIA GeForce RTX 4060 8GB GPU on "SmartPC". Layout: 2.5 columns on light background.

LEFT COLUMN (45% — Gallery):
- Large product image on white background, "ADA LOVELACE" and "DLSS 3 Ready" badges.
- 5 thumbnail images below. Trust badges (Chính hãng 100%, Bảo hành 36T).

CENTER COLUMN (35% — Purchase Info):
- Full name: "Card Màn Hình NVIDIA GeForce RTX 4060 8GB GDDR6 (Bản Dual Fan)"
- Rating: ★★★★★ 5.0 (234 reviews)
- Price: "7.990.000đ" with crossed out original price and "-10%" badge.
- Stock: "✅ Còn hàng sẵn xuất". Quantity selector (+/-).
- Two large CTA buttons: Primary Blue "🛒 Thêm vào giỏ hàng" (#1A44D8) and "🔧 Thêm vào PC Builder".

RIGHT COLUMN (20% — Compatibility Widget):
- Title: "⚙️ Kiểm tra tương thích phần cứng"
- Check results:
  🟢 "Chuẩn khe cắm PCIe: HOÀN TOÀN TƯƠNG THÍCH"
  🟡 "Kích thước khoang vỏ Case: VỪA VẶN KHÔNG"
  🔴 "Công suất nguồn đề xuất: CẦN NÂNG CẤP KHUYẾN NGHỊ"

BELOW FOLD:
- Left: Technical Specs Table (zebra striping #F9FAFB)
- Right: AI Hardware Rating box with benchmark FPS scores (Cyberpunk 2077, CS2, Wukong).
```

---

## 5. Màn hình PC Builder & Kiểm tra tương thích (Screen 4 - `screen4.png`)
**Prompt:**
```text
Design a PC Builder & Compatibility Checker tool page for "SmartPC".

HEADER & TITLE: "XÂY DỰNG CẤU HÌNH MÁY TÍNH & KIỂM TRA TƯƠNG THÍCH" with Rule Engine status.

DASHBOARD SUMMARY BAR (4 metric cards in a row on light background):
1. TỔNG CHI PHÍ CẤU HÌNH: 25.460.000đ
2. TỔNG TDP ƯỚC TÍNH: 280W (bar chart + recommendation ≥550W)
3. TRẠNG THÁI RULE ENGINE: 1 Xung đột vật lý nghiêm trọng (red badge #EA4335)
4. GEMINI BALANCE INDEX: 78/100

COMPONENT LIST SECTION (left 65%):
Row-by-row (CPU, Mainboard, RAM, VGA, SSD, PSU, Case, Cooler).
- CPU: Intel Core i7-13700K (selected).
- Mainboard: ASUS ROG Strix X670E-F with RED ERROR BANNER "❌ XUNG ĐỘT SOCKET". Quick fix suggestions below.
- RAM, VGA, SSD selected with green compatibility badges (#34A853).
- PSU: Highlighted yellow box "BẮT BUỘC CHỌN | Khuyến nghị: ≥ 550W".

RIGHT SIDEBAR (35%) — "Chẩn Đoán Hardware Rule Engine":
- Error section detailing socket mismatch with Quick Fix list.
- Warning section about PSU capacity.
- Gemini AI Hardware Advisor panel with bottleneck analysis.

STICKY BOTTOM BAR: Progress (5/8 linh kiện), Total Price, "Thêm tất cả vào giỏ hàng" blue button (#1A44D8).
```

---

## 6. Nhóm Màn hình Giỏ hàng & Thanh toán (Screen 5a, 5b, 5c - `screen5a.png`, `screen5b.png`, `screen5c.png`)
**Prompt:**
```text
Design a shopping cart and one-page checkout flow for "SmartPC".

CART PAGE (screen5a.png):
- Step indicator: ① Giỏ hàng & Rule Engine (active) ——→ ② Thanh toán ——→ ③ Hoàn tất
- Yellow Warning Banner at top: "CẢNH BÁO XUNG ĐỘT TƯƠNG THÍCH PHẦN CỨNG" regarding RAM bus speed.
- Left column (65%): List of 3 items (GPU, CPU, RAM) with thumbnail, specs tags, price, and quantity selector. Cross-sell section below "Mua kèm giảm sốc".
- Right column (35%): Sticky Order Summary. Subtotal, Shipping, Coupon input, Total "18.990.000đ". Blue button "Tiến hành thanh toán →".

CHECKOUT PAGE (One-page - screen5b.png):
- Left column (60%): Delivery Info form (Name, Phone, Address). Payment Methods radio buttons (COD, VietQR, Ví điện tử, Trả góp 0%). Rule Engine confirmation badge "PASSED - AN TOÀN" (green).
- Right column (40%): Sticky sidebar with order summary (3 mini-cards for products), total price, and large RED CTA button "ĐẶT HÀNG NGAY" (#E30019).

ORDER CONFIRMATION (screen5c.png):
- Success hero section (green #34A853) with checkmark: "ĐẶT HÀNG THÀNH CÔNG!".
- Order info bar (Order ID #ORD-xxx, Date, Total, COD, Status PENDING).
- Left: List of 3 components ordered.
- Right: Delivery info and vertical timeline "Lộ trình xử lý đơn hàng".
- Banner suggesting: "Lưu 3 linh kiện này vào PC Profile của bạn?".
```

---

## 7. Màn hình PC Profile & Đề xuất nâng cấp (Screen 6 - `screen6.png`)
**Prompt:**
```text
Design a PC Profile and AI-powered upgrade suggestion page for "SmartPC".

TITLE SECTION: "HỒ SƠ HỆ THỐNG: PC Gaming của tôi" with "AI Verified Profile" badge.

DASHBOARD CARDS (4 cards in a row):
- CHỈ SỐ CÂN BẰNG: 61/100
- MỨC NGHẼN ĐỒ HỌA GPU: 28.4%
- TẢI ĐIỆN ÁP ƯỚC TÍNH: 310W / 550W
- TIỀM NĂNG NÂNG CẤP: 94/100

LEFT SECTION (55%) — "Cấu hình hiện tại & Phân khúc" (6 Components):
- CPU: i5-12400F — Tier bar 62% (yellow/amber)
- GPU: GTX 1660 Super — Tier bar 50% (RED fill, pulsing) with "⚠️ Yếu nhất hệ thống" warning (Bottleneck)
- RAM, SSD, Mainboard, PSU listed with specs and tier bars.

RIGHT SECTION (45%) — Bottleneck Analysis:
- "Phân tích điểm nghẽn hệ thống" panel with red alert: GPU Bottleneck.
- FPS Comparison bars: Cyberpunk 2077 (Hiện tại 42 FPS → Sau nâng cấp 85+ FPS), Black Myth: Wukong (38 → 75+ FPS).

UPGRADE ROADMAP SECTION:
- "Lộ trình nâng cấp tối ưu (Rule Engine Verified)".
- Priority 1: GPU RTX 4060 8GB (7.990.000đ). Shows compatibility checks (PSU OK, PCIe OK, Case OK). Blue "+ Thêm món này vào giỏ" button.
- Priority 2: SSD 1TB Samsung 990 Pro.
- Priority 3: RAM DDR4 32GB 3600MHz.
- Combo Deal Bar at bottom: "Gói Nâng Cấp Toàn Diện (Combo 3 Món)" showing discounted bundle price and "Thêm tất cả vào Giỏ hàng" button.
```
