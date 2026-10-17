# BẢN THIẾT KẾ CHI TIẾT REPOSITORY (SMARTPC REPOSITORY DESIGN)

Tài liệu này đặc tả toàn diện kiến trúc repository, cấu trúc mã nguồn, quy chuẩn phát triển và hướng dẫn hiện thực hóa dự án **SmartPC** dựa trên tài liệu đặc tả `prj1.md`.

---

## 1. Quyết định Kiến trúc Repository (Architectural Decision Records - ADR)

### ADR-01: Lựa chọn Mô hình Monorepo thay vì Multi-repo
* **Bối cảnh:** Dự án được phát triển bởi nhóm **2 kỹ sư phần mềm**, bao gồm hệ thống Core Backend (Java Monolith - Spring Boot), Frontend Web Client (ReactJS), cơ sở dữ liệu quan hệ kết hợp Vector Database và hệ thống Rule Engine.
* **Quyết định:** Sử dụng mô hình **Monorepo** duy nhất chứa cả `backend/`, `frontend/`, `docker/`, `scripts/` và `docs/`.
* **Lý do & Lợi ích:**
  1. **Đồng bộ hóa phiên bản:** Thay đổi DTO backend và Type interface frontend diễn ra trong cùng một commit/PR, triệt tiêu nguy cơ "vỡ hợp đồng API" (API Contract drift).
  2. **Tối ưu hóa quy trình làm việc cho nhóm 2 người:** Không phải quản lý nhiều repo, issue tracker rời rạc; dễ dàng review chéo (Dev 1 review logic của Dev 2 và ngược lại).
  3. **Môi trường cục bộ đồng nhất:** 1 câu lệnh `docker compose up -d` là khởi chạy được toàn bộ hệ sinh thái (Database MySQL + Redis + Mailhog + Backend + Frontend).
  4. **Tích hợp CI/CD tinh gọn:** Sử dụng GitHub Actions path-filtering (`paths: ['backend/**']` và `paths: ['frontend/**']`) giúp chạy test độc lập nhưng quản lý pipeline tập trung.

### ADR-02: Lựa chọn MySQL 8.0 làm Cơ sở Dữ liệu Quan hệ Chính
* **Bối cảnh:** Hệ thống cần hệ quản trị RDBMS phổ biến, ổn định để xử lý ACID transaction cho Đơn hàng, Giỏ hàng, Quản lý Người dùng, Tập luật tương thích và Lưu trữ thông số sản phẩm dưới dạng JSON.
* **Quyết định:** Sử dụng MySQL 8.0 với InnoDB engine và trường kiểu `JSON` cho specs phần cứng, vector embeddings.
* **Lý do & Lợi ích:**
  1. **Đơn giản hóa & Phổ biến:** MySQL 8.0 thân thiện, tài liệu phong phú, hỗ trợ native kiểu dữ liệu JSON, UUID expressions và transaction cách ly cao.
  2. **Hiệu suất & Đồng bộ:** Bảng `product_embeddings` liên kết khóa ngoại trực tiếp `REFERENCES products(product_id) ON DELETE CASCADE`.
  3. **Hỗ trợ JSON Native:** MySQL 8 cung cấp hàm JSON phong phú (`JSON_EXTRACT`, `->`, `->>`) phù hợp cho các trường specs phần cứng linh hoạt.

### ADR-03: Hardware Rule Engine nội bộ với Caffeine Cache & CompletableFuture
* **Bối cảnh:** Luồng PC Builder và Checkout yêu cầu kiểm tra tương thích liên tục khi người dùng thao tác. Độ trễ yêu cầu `< 2ms` và không được nghẽn CPU khi có nhiều luật.
* **Quyết định:**
  - Nhúng Rule Engine thành một **Internal Module** trong Spring Boot.
  - Sử dụng **Caffeine In-Memory Cache** lưu danh sách quy tắc đang active (`@Cacheable("compat_rules")`).
  - Sử dụng `CompletableFuture.supplyAsync()` phân bổ các nhóm quy tắc (CPU-Main, RAM-Main, GPU-Case, PSU-TDP) chạy song song trên Thread Pool riêng biệt (`ruleEngineExecutor`).

---

## 2. Cấu trúc Cây Thư mục Toàn diện (Full Directory Tree)

```text
project1/
├── .github/
│   ├── workflows/
│   │   ├── backend-ci.yml                 # Maven build, JUnit test, Testcontainers
│   │   └── frontend-ci.yml                # NPM build, TypeScript check, Lint
│   └── pull_request_template.md           # Template kiểm tra chất lượng code PR
├── backend/                               # Spring Boot 3.5.x + Java 25 LTS
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/smartpc/
│   │   │   │   ├── SmartPcApplication.java
│   │   │   │   ├── common/                # Các thành phần dùng chung toàn hệ thống
│   │   │   │   │   ├── exception/         # Custom exceptions & GlobalExceptionHandler
│   │   │   │   │   ├── response/          # ApiResponse<T>, PageResponse<T>
│   │   │   │   │   ├── entity/            # BaseAuditEntity (created_at, updated_at)
│   │   │   │   │   └── util/              # JsonUtil, CurrencyUtil
│   │   │   │   ├── config/                # Cấu hình Spring Context
│   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   ├── CorsConfig.java
│   │   │   │   │   ├── CacheConfig.java   # Cấu hình Caffeine Cache
│   │   │   │   │   ├── AsyncConfig.java   # Thread pool cho Rule Engine & Async Tasks
│   │   │   │   │   └── SpringAiConfig.java # Vertex AI Gemini & Vector Search bean
│   │   │   │   ├── security/              # Tầng bảo mật & phân quyền
│   │   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   │   ├── UserDetailsServiceImpl.java
│   │   │   │   │   └── OAuth2SuccessHandler.java
│   │   │   │   └── modules/               # Phân rã tính năng theo domain
│   │   │   │       ├── auth/              # UC0: Đăng ký, Đăng nhập, Quên mật khẩu
│   │   │   │       │   ├── controller/AuthController.java
│   │   │   │       │   ├── service/AuthService.java
│   │   │   │       │   └── dto/AuthRequests.java
│   │   │   │       ├── product/           # UC1a, UC5: Quản lý Linh kiện & JSON Specs
│   │   │   │       │   ├── controller/ProductController.java
│   │   │   │       │   ├── service/ProductService.java
│   │   │   │       │   ├── repository/ProductRepository.java
│   │   │   │       │   └── entity/Product.java, Category.java
│   │   │   │       ├── ruleengine/        # UC6: Hardware Rule Engine & Cache
│   │   │   │       │   ├── controller/CompatRuleAdminController.java
│   │   │   │       │   ├── service/CompatibilityService.java
│   │   │   │       │   ├── evaluator/RuleEvaluator.java
│   │   │   │       │   ├── calculator/AggregateCalculator.java
│   │   │   │       │   ├── strategy/OperatorStrategy.java
│   │   │   │       │   ├── model/RuleSeverity.java, RuleOperator.java
│   │   │   │       │   └── dto/CompatibilityResult.java
│   │   │   │       ├── pcbuilder/         # UC2: PC Builder & Real-time Check
│   │   │   │       │   ├── controller/PCBuilderController.java
│   │   │   │       │   └── service/PCBuilderService.java
│   │   │   │       ├── pcprofile/         # UC3: Hồ sơ PC, Bottleneck & Nâng cấp
│   │   │   │       │   ├── controller/PCProfileController.java
│   │   │   │       │   ├── service/PCProfileService.java
│   │   │   │       │   └── entity/PCProfile.java, ProfileComponent.java
│   │   │   │       ├── ai/                # UC1, UC3: Gemini LLM & pgvector Search
│   │   │   │       │   ├── controller/AISearchController.java
│   │   │   │       │   ├── service/AISearchService.java
│   │   │   │       │   ├── service/GeminiReasoningService.java
│   │   │   │       │   └── parser/IntentParser.java
│   │   │   │       ├── cart/              # UC4: Giỏ hàng
│   │   │   │       │   ├── controller/CartController.java
│   │   │   │       │   ├── service/CartService.java
│   │   │   │       │   └── entity/Cart.java, CartItem.java
│   │   │   │       ├── order/             # UC4, UC7: Thanh toán ACID & Quản trị đơn
│   │   │   │       │   ├── controller/OrderController.java
│   │   │   │       │   ├── service/OrderService.java
│   │   │   │       │   └── entity/Order.java, OrderDetail.java
│   │   │   │       └── dashboard/         # UC8: Thống kê & Báo cáo
│   │   │   │           ├── controller/DashboardController.java
│   │   │   │           └── service/DashboardService.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       └── db/migration/          # Flyway Database Scripts
│   │   │           ├── V1__init_schema.sql
│   │   │           └── V2__seed_rules.sql
│   │   └── test/                          # Unit & Integration Tests
│   │       └── java/com/smartpc/
│   │           ├── ruleengine/RuleEngineBenchmarkTest.java
│   │           └── order/CheckoutTransactionTest.java
│   ├── pom.xml
│   └── Dockerfile
├── frontend/                              # React 18 + Vite + TailwindCSS
│   ├── src/
│   │   ├── assets/                        # Logo, biểu tượng, hình ảnh
│   │   ├── components/                    # Atomic Reusable Components
│   │   │   ├── ui/                        # Button, Input, Modal, Badge, Card, Select
│   │   │   ├── layout/                    # Header, Footer, AdminSidebar
│   │   │   └── feedback/                  # RuleAlertBanner, AIThinkingIndicator
│   │   ├── features/                      # Chức năng nghiệp vụ
│   │   │   ├── auth/                      # Screen 0: Login, Register modal
│   │   │   ├── home/                      # Screen 1: Trang chủ SmartPC
│   │   │   ├── ai-search/                 # Screen 2a, 2b, 2c: Giao diện AI Search & Fallback
│   │   │   ├── product-detail/            # Screen 3: Chi tiết SP & Mini Compat Checker
│   │   │   ├── pc-builder/                # Screen 4: 8-slot PC Builder & Rule Diagnostics
│   │   │   ├── cart/                      # Screen 5a: Giỏ hàng & cảnh báo ẩn
│   │   │   ├── checkout/                  # Screen 5b, 5c: One-page checkout & xác nhận đơn
│   │   │   ├── pc-profile/                # Screen 6: PC Profile & Lộ trình nâng cấp AI
│   │   │   └── admin/                     # Quản lý SP, Đơn hàng, Luật, Dashboard KPI
│   │   ├── services/                      # Axios API clients
│   │   ├── stores/                        # Zustand Global State
│   │   │   ├── useAuthStore.ts
│   │   │   ├── useCartStore.ts
│   │   │   └── usePCBuilderStore.ts
│   │   ├── types/                         # TypeScript interfaces
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker/
│   ├── docker-compose.yml
│   └── mysql/
│       └── init.sql
├── scripts/
│   └── seed-compat-rules.sql
├── docs/
│   ├── screens/                           # Toàn bộ ảnh mockup UI (screen0.png -> screen6.png)
│   ├── prj1.md
│   ├── stitch_prompts.md
│   └── REPO_DESIGN.md
├── .gitignore
└── README.md
```

---

## 3. Thiết kế Phân rã Chi tiết các Module Backend

### 3.1. Module `ruleengine` (Trọng tâm kỹ thuật)
- **Cơ chế hoạt động:**
  1. `CompatibilityService.checkCompatibility(List<UUID> productIds)`: Nhận danh sách linh kiện.
  2. Truy vấn chi tiết linh kiện và thông số JSON Specs từ cơ sở dữ liệu.
  3. `AggregateCalculator` tính toán các giá trị tổng hợp trước:
     - `_count`: Đếm số lượng theo category (số thanh RAM, số ổ SSD M.2).
     - `_sum_capacity_gb`: Tổng dung lượng RAM đã chọn.
     - `_total_tdp_w`: Tổng công suất TDP tiêu thụ của toàn bộ linh kiện.
  4. Lấy danh sách quy tắc đang kích hoạt (`is_active = true`) từ Caffeine In-Memory Cache (thời gian sống 60 phút, tự hủy khi Admin sửa luật).
  5. Đánh giá song song bằng `CompletableFuture`:
     - Nhóm quy tắc Socket (CPU ↔ Mainboard).
     - Nhóm quy tắc Bộ nhớ (RAM ↔ Mainboard).
     - Nhóm quy tắc Vật lý kích thước (GPU chiều dài ↔ Vỏ Case; Mainboard Form Factor ↔ Case).
     - Nhóm quy tắc Nguồn điện (Tổng TDP ↔ Công suất PSU).
  6. Tổng hợp `CompatibilityResult` gồm các mảng `errors`, `warnings`, `info` và cờ `is_compatible`.

### 3.2. Module `ai` (Gemini LLM & Semantic Search)
- **Luồng xử lý 2 pha (Two-Phase Execution):**
  - **Pha 1: Intent Parsing:** Gửi câu truy vấn ngôn ngữ tự nhiên của người dùng vào Gemini với system prompt bắt buộc trả về định dạng JSON (Schema: `{ category, budget, keywords, brand_preference }`).
  - **Pha 2: Hybrid Retrieval:** Dùng embedding vector từ Spring AI query vào bảng `product_embeddings` trong MySQL kết hợp với bộ lọc thuộc tính vừa trích xuất được.
  - **Pha 3: AI Reasoning:** Gửi Top 5 sản phẩm thu được kèm ngữ cảnh người dùng lại cho Gemini để sinh ra đoạn phân tích tư vấn khách quan.
- **Cơ chế Fallback an toàn:**
  - Thiết lập timeout 5 giây cho API Gemini.
  - Nếu xảy ra timeout hoặc hết hạn ngạch (quota limit), hệ thống tự động bắt ngoại lệ và kích hoạt chuyển sang tìm kiếm từ khóa SQL Fuzzy Search (`LIKE` / MySQL Full-Text Search).

### 3.3. Module `order` (ACID Checkout & Stock Management)
- Triển khai `@Transactional(isolation = Isolation.REPEATABLE_READ)`:
  - Tự động gọi ngầm `CompatibilityService.checkCompatibility` trên toàn bộ sản phẩm trong giỏ hàng. Nếu có lỗi xung đột mà người dùng chưa xác nhận mua rời (`force_bypass = false`), hệ thống chặn giao dịch và trả về mã lỗi HTTP 409 Conflict.
  - Sử dụng Pessimistic Write Lock (`SELECT ... FOR UPDATE`) hoặc Optimistic Lock (`@Version`) khi kiểm tra và trừ tồn kho `stock_quantity`, ngăn ngừa triệt để tình trạng Overselling khi nhiều người cùng đặt hàng một lúc.
  - Xóa giỏ hàng, tạo bản ghi `orders` và `order_details`.
  - Kích hoạt sự kiện `@Async` gửi email thông báo xác nhận qua dịch vụ Mail.

---

## 4. Quy chuẩn Phát triển & Git Flow (Dành cho Nhóm 2 người)

### 4.1. Quy ước đặt tên nhánh (Branch Naming)
- Tính năng mới: `feat/<module-name>-<short-description>` (Ví dụ: `feat/rule-engine-evaluator`, `feat/pc-builder-ui`).
- Sửa lỗi: `fix/<issue-description>` (Ví dụ: `fix/psu-wattage-calc`).
- Tối ưu mã nguồn: `refactor/<module-name>`.

### 4.2. Quy ước Commit (Conventional Commits)
Format chuẩn: `<type>(<scope>): <mô tả ngắn>`
- `feat(rule-engine): triển khai tính toán song song aggregate values`
- `feat(ai): tích hợp intent parsing qua Gemini API`
- `fix(cart): chặn thanh toán khi có xung đột phần cứng nghiêm trọng`
- `style(frontend): cập nhật bảng màu Navy và Cyan theo nhận diện SmartPC`
- `docs(readme): bổ sung hướng dẫn chạy docker-compose`

### 4.3. Quy trình Review Code (Pull Request Protocol)
1. Dev mở Pull Request vào nhánh `develop`.
2. GitHub Actions tự động kiểm tra: Compile mã nguồn, chạy bộ kiểm thử Unit Test của Java 25, kiểm tra TypeScript và Build React.
3. Dev còn lại tiến hành Code Review, phản hồi và Approve.
4. Merge vào `develop` theo hình thức **Squash and Merge** để giữ lịch sử Git luôn sạch sẽ.
