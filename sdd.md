# TÀI LIỆU THIẾT KẾ DỰ ÁN: NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ LINH KIỆN ĐIỆN TỬ THÔNG MINH

## 1. Tổng quan dự án

**Sơ đồ Use-Case:**

```mermaid
flowchart LR
    User((Người dùng))
    Admin((Quản trị viên))
    
    subgraph System ["Hệ thống TMĐT Linh kiện Thông minh"]
        UC0(Đăng ký / Đăng nhập)
        UC1(Tìm kiếm ngữ nghĩa & Chat với AI)
        UC1a(Duyệt sản phẩm theo danh mục)
        UC2(Xây dựng PC & Kiểm tra tương thích)
        UC3(Quản lý PC Profile & Nhận đề xuất nâng cấp)
        UC4(Quản lý Giỏ hàng & Đặt hàng)
        UC5(Quản lý Thông tin Sản phẩm)
        UC6(Quản lý Tập Luật Tương thích)
        UC7(Quản lý Đơn hàng & Người dùng)
        UC8(Xem Dashboard & Thống kê)
    end
    
    User --> UC0
    User --> UC1
    User --> UC1a
    User --> UC2
    User --> UC3
    User --> UC4
    
    Admin --> UC0
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    
    UC4 -.->|"<<include>>"| UC2
    UC3 -.->|"<<extend>>"| UC2
```

**Mục tiêu:**
*   **Mục đích:** Xây dựng một nền tảng thương mại điện tử chuyên biệt phân phối linh kiện điện tử/máy tính. Giải quyết khó khăn lớn nhất của người dùng khi tự lắp ráp (build) hoặc nâng cấp máy tính: sự thiếu hụt kiến thức về tính tương thích phần cứng, khó khăn trong việc tìm đúng mã sản phẩm và không biết bắt đầu nâng cấp từ đâu.
*   **Phạm vi:** 
    *   Hệ thống quản lý bán hàng cơ bản (Quản lý người dùng, Sản phẩm, Giỏ hàng, Thanh toán, Đơn hàng).
    *   **Công cụ kiểm tra tính tương thích (Compatibility Checker):** Tự động phát hiện xung đột phần cứng.
    *   **Hồ sơ cấu hình (PC Profile) & Đề xuất nâng cấp:** Lưu trữ cấu hình hiện tại của người dùng, phân tích điểm nghẽn (bottleneck) và gợi ý lộ trình nâng cấp.
    *   **Tích hợp AI suy luận (LLM - ví dụ: Gemini) vào Tìm kiếm:** Vượt ra ngoài việc tìm kiếm từ khóa hay chatbot thông thường, AI được sử dụng như một "chuyên gia phần cứng" có khả năng suy luận. AI giúp phân tích ngữ nghĩa truy vấn phức tạp của người dùng để tìm kiếm, tự động trích xuất thông số và đánh giá mức độ phù hợp của các linh kiện dựa trên nhu cầu cụ thể (ví dụ: render 3D vs. chơi game).
*   **Bối cảnh:** Nhu cầu tự tùy biến và nâng cấp thiết bị công nghệ ngày càng cao. Người dùng cần một hệ thống không chỉ để "mua" mà còn để "được tư vấn" như một chuyên gia phần cứng thực thụ.
*   **Tài liệu tham khảo:** Chuẩn tài liệu đặc tả yêu cầu phần mềm IEEE 830, tài liệu API tích hợp LLM (Gemini API / OpenAI API), tài liệu Elasticsearch.

### 1.1. Đặc tả Use-Case chi tiết

Dưới đây là đặc tả chi tiết cho các luồng nghiệp vụ (Use-case) cốt lõi của hệ thống, giúp làm rõ các kịch bản tương tác giữa người dùng, hệ thống AI, Rule Engine và Admin.

#### UC0: Đăng ký & Đăng nhập

**Mô tả:** Người dùng hoặc Quản trị viên đăng nhập vào hệ thống bằng tài khoản (Email/Mật khẩu) hoặc thông qua mạng xã hội (Google/Facebook).
**Actor chính:** Người dùng (User), Quản trị viên (Admin).
**Actor phụ:** OAuth Providers (Google, Facebook).
**Tiền điều kiện:** Người dùng chưa đăng nhập.

**Sơ đồ hoạt động (Activity Diagram):**
```mermaid
flowchart TD
    Start(["Truy cập trang Đăng nhập"]) --> B{"Chọn phương thức?"}
    B -- "Email/Password" --> C["Nhập Email & Mật khẩu"]
    C --> D["Bấm 'Đăng nhập'"]
    D --> E{"Kiểm tra thông tin"}
    E -- "Sai thông tin" --> F["Báo lỗi tài khoản hoặc mật khẩu"]
    F --> C
    E -- "Đúng" --> G{"Tài khoản bị khóa?"}
    G -- "Có" --> H["Thông báo liên hệ Admin"]
    H --> End_Err(["Kết thúc"])
    G -- "Không" --> I["Tạo JWT Token/Session"]
    I --> J{"Kiểm tra Role"}
    J -- "Admin" --> K["Chuyển hướng đến Admin Dashboard"]
    J -- "User" --> L["Chuyển hướng về trang trước đó (hoặc Trang chủ)"]
    
    B -- "Social Login" --> M["Chuyển hướng sang Google/Facebook"]
    M --> N{"Xác thực Social"}
    N -- "Thất bại" --> O["Thông báo lỗi xác thực"]
    O --> B
    N -- "Thành công" --> P{"Email đã tồn tại?"}
    P -- "Có" --> I
    P -- "Chưa" --> Q["Tự động tạo tài khoản mới"]
    Q --> I
```

**Luồng sự kiện chính (Happy Path - Email/Password):**
1. Người dùng truy cập trang Đăng nhập.
2. Nhập thông tin `Email` và `Mật khẩu`.
3. Nhấn nút "Đăng nhập".
4. Hệ thống kiểm tra trùng khớp trong Database.
5. Kiểm tra trạng thái tài khoản (`is_active = true`).
6. Hệ thống tạo JWT Token (hoặc Session) lưu vào Cookie/Local Storage.
7. Điều hướng người dùng về trang họ đang truy cập trước đó (Ví dụ: đang ở Giỏ hàng -> Trở lại Giỏ hàng). Đối với Admin, điều hướng vào Admin Dashboard.

**Luồng sự kiện chính (Happy Path - Social Login):**
1. Người dùng nhấn nút "Đăng nhập bằng Google".
2. Hệ thống chuyển hướng sang cửa sổ xác thực của Google.
3. Người dùng cho phép quyền truy cập.
4. Google trả về Auth Code, hệ thống gọi lên Google API lấy thông tin Profile (Email, Name).
5. Nếu Email chưa có trong hệ thống, tự động tạo tài khoản mới. Nếu có rồi, tiến hành cấp JWT Token và đăng nhập thành công.

**Luồng ngoại lệ (Exception/Alternative Paths):**
*   *0a. Sai mật khẩu quá số lần quy định:* Nếu đăng nhập sai mật khẩu 5 lần liên tiếp, hệ thống khóa tài khoản tạm thời trong 15 phút và gửi email cảnh báo.
*   *0b. Tài khoản bị khóa (Banned):* Ở bước 5 (kiểm tra trạng thái), nếu `is_active = false`, hệ thống chặn đăng nhập và hiện thông báo: "Tài khoản của bạn đã bị khóa do vi phạm chính sách."

#### UC1: Tìm kiếm ngữ nghĩa & Chat với AI

**Mô tả:** Người dùng nhập yêu cầu bằng ngôn ngữ tự nhiên (không cần chính xác từ khóa kỹ thuật) để tìm kiếm linh kiện phù hợp với nhu cầu. AI sẽ đóng vai trò như một chuyên gia tư vấn.
**Actor chính:** Người dùng (User).
**Actor phụ:** AI Engine (Gemini), Vector DB.
**Tiền điều kiện:** Người dùng đang ở trang chủ hoặc thanh tìm kiếm. Hệ thống AI đang hoạt động.

**Sơ đồ hoạt động (Activity Diagram):**
```mermaid
flowchart TD
    Start(["Người dùng nhập truy vấn"]) --> B("Hệ thống gửi tới AI Engine")
    B --> C{"AI Engine hoạt động?"}
    C -- "Lỗi/Timeout" --> D["Chuyển sang tìm kiếm từ khóa thông thường"]
    D --> End_KW(["Hiển thị kết quả từ khóa"])
    C -- "OK" --> E{"Phân tích ý định (Intent Parsing)"}
    E -- "Sai miền" --> F["Phản hồi: Xin lỗi, chỉ tư vấn công nghệ"]
    F --> End_Err(["Kết thúc"])
    E -- "Hợp lệ" --> G["Truy vấn Vector DB & DB"]
    G --> H{"Tìm thấy SP?"}
    H -- "Không" --> I["Gợi ý SP gần nhất + Lời khuyên AI"]
    H -- "Có" --> J["Trả về Top SP + Lời giải thích AI"]
    I --> End_OK(["Hiển thị kết quả"])
    J --> End_OK
```

**Luồng sự kiện chính (Happy Path):**
1. Người dùng nhập câu truy vấn (Ví dụ: "Card màn hình nào dưới 8 triệu chơi mượt game AAA?").
2. Người dùng nhấn "Tìm kiếm" hoặc Enter.
3. Hệ thống gửi truy vấn đến AI Engine để phân tích ý định (Intent Parsing).
4. AI Engine bóc tách được: `Category = VGA`, `Budget <= 8000000`, `Purpose = Gaming AAA`.
5. Hệ thống truy vấn Vector DB và Database để tìm top 5 sản phẩm phù hợp nhất.
6. AI Engine nhận danh sách sản phẩm, tạo câu trả lời giải thích lý do đề xuất dựa trên nhu cầu của User.
7. Hệ thống hiển thị kết quả tìm kiếm gồm: Câu tư vấn của AI và Danh sách thẻ sản phẩm.

**Luồng ngoại lệ (Exception/Alternative Paths):**
*   *1a. AI Service không phản hồi (Timeout) hoặc báo lỗi:* Hệ thống tự động chuyển sang luồng tìm kiếm từ khóa thông thường (Fuzzy Search bằng Elasticsearch), bỏ qua phần tư vấn AI. Hiển thị thông báo: "AI tạm thời không khả dụng, hiển thị kết quả tìm kiếm theo từ khóa".
*   *1b. Truy vấn không liên quan (Ví dụ: "Thời tiết hôm nay thế nào?"):* AI nhận diện ý định sai miền. Hệ thống phản hồi: "Xin lỗi, tôi chỉ có thể tư vấn về linh kiện máy tính và thiết bị công nghệ."
*   *1c. Không tìm thấy sản phẩm thỏa mãn điều kiện:* Hệ thống hiển thị câu tư vấn của AI (ví dụ: "Hiện không có card nào dưới 8 triệu đáp ứng chơi mượt mọi game AAA Ultra setting") và gợi ý các sản phẩm gần mức giá nhất hoặc có hiệu năng tốt nhất trong tầm giá.

#### UC1a: Duyệt sản phẩm theo danh mục (Category Browsing & Filter)

**Mô tả:** Người dùng duyệt xem danh sách linh kiện theo từng danh mục phân cấp (CPU, VGA, RAM, Mainboard...), áp dụng các bộ lọc thông số kỹ thuật (Thương hiệu, mức giá, socket, form factor, dung lượng...) và sắp xếp kết quả để tìm linh kiện mong muốn.
**Actor chính:** Người dùng (User).
**Tiền điều kiện:** Người dùng truy cập trang Danh mục hoặc chọn một danh mục từ Menu/Trang chủ.

**Sơ đồ hoạt động (Activity Diagram):**
```mermaid
flowchart TD
    Start(["Chọn Danh mục từ Menu/Trang chủ"]) --> B["Tải danh sách sản phẩm theo Category_ID"]
    B --> C["Hiển thị danh sách sản phẩm + Bộ lọc Quick Chips"]
    C --> D{"Người dùng thao tác?"}
    D -- "Chọn bộ lọc / Sắp xếp" --> E["Gửi request lọc (Brand, Price, Specs)"]
    E --> F["Hệ thống truy vấn DB có phân trang"]
    F --> G{"Có sản phẩm thỏa mãn?"}
    G -- "Có" --> H["Cập nhật danh sách hiển thị"]
    G -- "Không" --> I["Thông báo không có SP + Gợi ý xóa bớt bộ lọc"]
    H --> D
    I --> D
    D -- "Bấm chọn 1 sản phẩm" --> J(["Chuyển hướng đến Chi tiết SP"])
    D -- "Bấm 'Thêm vào PC Builder'" --> K(["Thêm vào cấu hình PC Builder (UC2)"])
```

**Luồng sự kiện chính (Happy Path):**
1. Người dùng chọn một danh mục linh kiện (Ví dụ: "Card màn hình - VGA") từ thanh điều hướng hoặc icon danh mục trên trang chủ.
2. Hệ thống tải và hiển thị trang danh mục gồm: Bộ lọc thông số (Hãng, Khoảng giá, VRAM, Chuẩn PCIe), danh sách sản phẩm dạng lưới (Grid), và thanh sắp xếp (Giá tăng/giảm, Mới nhất, Bán chạy).
3. Người dùng chọn bộ lọc mong muốn (Ví dụ: Hãng "NVIDIA", VRAM "8GB", Mức giá "< 10 triệu").
4. Hệ thống gửi request lọc đến backend, truy vấn cơ sở dữ liệu và trả về danh sách sản phẩm thỏa mãn kèm phân trang.
5. Người dùng có thể bấm vào thẻ sản phẩm để xem chi tiết, hoặc bấm nút "+ PC Builder" để đưa trực tiếp vào cấu hình máy tính đang lắp ráp.

**Luồng ngoại lệ (Exception/Alternative Paths):**
*   *1a.a. Không có sản phẩm nào phù hợp bộ lọc:* Ở bước 4, nếu không có linh kiện nào thỏa mãn đồng thời tất cả các tiêu chí lọc, hệ thống hiển thị thông báo "Không tìm thấy sản phẩm phù hợp" kèm nút bấm "Xóa bộ lọc" để người dùng dễ dàng thử lại.

#### UC2: Xây dựng PC & Kiểm tra tương thích (PC Builder)

**Mô tả:** Người dùng chọn từng linh kiện để lắp ráp thành một bộ PC hoàn chỉnh. Hệ thống sẽ tự động kiểm tra và cảnh báo nếu các linh kiện xung đột hoặc không tối ưu.
**Actor chính:** Người dùng (User).
**Actor phụ:** Hardware Rule Engine.
**Tiền điều kiện:** Người dùng truy cập công cụ PC Builder.

**Sơ đồ hoạt động (Activity Diagram):**
```mermaid
flowchart TD
    Start(["Chọn 'Thêm linh kiện'"]) --> B["Gửi cấu hình hiện tại + SP vừa chọn tới Rule Engine"]
    B --> C{"Kiểm tra tương thích"}
    C -- "Xung đột nghiêm trọng (ERROR)" --> D["Hiển thị cảnh báo đỏ. Chặn thêm vào giỏ"]
    D --> E["Gợi ý linh kiện thay thế"]
    E --> Start
    C -- "Cảnh báo (WARNING/INFO)" --> F["Hiển thị cảnh báo vàng"]
    F --> G["Cập nhật cấu hình"]
    C -- "Tương thích hoàn toàn" --> G
    G --> H{"Hoàn thành cấu hình?"}
    H -- "Chưa" --> Start
    H -- "Rồi" --> I["Bấm 'Thêm vào giỏ hàng'"]
    I --> J{"Có cảnh báo WARNING?"}
    J -- "Có" --> K["Yêu cầu xác nhận rủi ro"]
    K -- "Đồng ý" --> L(["Thêm vào giỏ hàng"])
    K -- "Hủy" --> Start
    J -- "Không" --> L
```

**Luồng sự kiện chính (Happy Path):**
1. Người dùng chọn mục "Thêm CPU" và chọn 1 CPU (VD: Intel Core i5 13600K).
2. Hệ thống gửi cấu hình hiện tại đến Rule Engine.
3. Rule Engine đánh giá không có xung đột, hệ thống cập nhật cấu hình và hiển thị CPU đã chọn.
4. Người dùng tiếp tục chọn "Thêm Mainboard" và chọn 1 Mainboard socket LGA 1700.
5. Hệ thống gửi danh sách (CPU, Mainboard) đến Rule Engine.
6. Rule Engine kiểm tra tương thích (Socket match) thành công.
7. Hệ thống hiển thị trạng thái "Tương thích" (Màu xanh).
8. Người dùng lặp lại đến khi hoàn thành cấu hình và bấm "Thêm toàn bộ vào giỏ hàng".

**Luồng ngoại lệ (Exception/Alternative Paths):**
*   *2a. Xung đột nghiêm trọng (ERROR):* Ở bước 4, nếu User chọn Mainboard socket AM5. Rule Engine trả về vi phạm mức ERROR. Hệ thống hiển thị cảnh báo đỏ ngay lập tức: "Mainboard không hỗ trợ CPU này (LGA1700 vs AM5)". Giao diện KHÔNG cho phép "Thêm toàn bộ vào giỏ hàng" cho đến khi lỗi được khắc phục. Hệ thống gợi ý danh sách Mainboard tương thích.
*   *2b. Cảnh báo không tối ưu (WARNING/INFO):* User chọn Nguồn (PSU) 450W cho cấu hình có RTX 4070. Rule Engine trả về WARNING. Hệ thống hiển thị cảnh báo vàng: "Công suất nguồn có thể không đủ tải (Khuyến nghị >= 650W)". User VẪN CÓ THỂ tiếp tục mua hàng nếu phớt lờ cảnh báo, hệ thống yêu cầu xác nhận rủi ro.

#### UC3: Quản lý PC Profile & Nhận đề xuất nâng cấp

**Mô tả:** Người dùng lưu lại cấu hình PC hiện tại của mình. Hệ thống sử dụng AI và Rule Engine để phân tích điểm nghẽn (bottleneck) của cấu hình và đưa ra lộ trình nâng cấp phù hợp với ngân sách.
**Actor chính:** Người dùng (User).
**Actor phụ:** AI Engine, Rule Engine.
**Tiền điều kiện:** Người dùng đã đăng nhập và truy cập trang PC Profile.

**Sơ đồ hoạt động (Activity Diagram):**
```mermaid
flowchart TD
    Start(["Truy cập PC Profile"]) --> B{"Đã có Profile chưa?"}
    B -- "Chưa" --> C["Tạo Profile mới (Nhập/Chọn linh kiện hiện tại)"]
    C --> D["Lưu Profile"]
    B -- "Có rồi" --> E["Xem chi tiết Profile"]
    D --> E
    E --> F["Bấm 'Nhận đề xuất nâng cấp'"]
    F --> G["Hệ thống gửi cấu hình cho AI & Rule Engine"]
    G --> H{"Phân tích Bottleneck"}
    H -- "Cấu hình cân bằng" --> I["Thông báo: PC đang tối ưu, chưa cần nâng cấp"]
    H -- "Có điểm nghẽn" --> J["AI phân tích mục đích sử dụng (Gaming/Work)"]
    J --> K["Tìm linh kiện thay thế phù hợp & Check tương thích"]
    K --> L["Hiển thị Option nâng cấp (Kèm giải thích)"]
    L --> M{"Người dùng chọn Option?"}
    M -- "Không" --> N(["Lưu lại xem sau"])
    M -- "Có" --> O["Thêm linh kiện mới vào Giỏ hàng"]
    I --> End(["Kết thúc"])
    N --> End
    O --> End
```

**Luồng sự kiện chính (Happy Path):**
1. Người dùng vào trang "PC Profile" và xem cấu hình hiện tại của mình (ví dụ: đang dùng Core i3 gen 10, GTX 1050).
2. Người dùng nhấn nút "Tư vấn nâng cấp".
3. Hệ thống hiển thị popup hỏi: "Ngân sách của bạn?" và "Mục tiêu nâng cấp (Ví dụ: Chơi mượt game XYZ)?".
4. Người dùng nhập thông tin và xác nhận.
5. AI Engine phân tích cấu hình hiện tại, nhận diện "VGA GTX 1050 là điểm nghẽn lớn nhất cho gaming".
6. AI tìm kiếm VGA mới phù hợp ngân sách, gửi qua Rule Engine kiểm tra xem nguồn (PSU) và Mainboard hiện tại có gánh được VGA mới không.
7. Hệ thống trả về đề xuất: "Nâng cấp lên RTX 3060 (Lý do...) + Đổi Nguồn lên 600W (Vì nguồn cũ không đủ)".
8. Người dùng đồng ý và nhấn "Thêm các món nâng cấp vào Giỏ hàng".

**Luồng ngoại lệ (Exception/Alternative Paths):**
*   *3a. Ngân sách quá thấp:* Ở bước 5, AI không tìm được linh kiện nào tạo ra sự nâng cấp rõ rệt với ngân sách cung cấp. Hệ thống phản hồi: "Ngân sách hiện tại khó tạo ra thay đổi lớn. Bạn nên tích lũy thêm khoảng X triệu hoặc tìm mua đồ cũ."
*   *3b. Cấu hình quá cũ không thể nâng cấp lẻ:* Ở bước 6, Rule Engine phát hiện Mainboard quá cũ không hỗ trợ linh kiện đời mới. AI đề xuất: "Cấu hình đã hết vòng đời nâng cấp. Bạn nên build một dàn PC mới hoàn toàn thay vì nâng cấp từng món."

#### UC4: Quản lý Giỏ hàng & Đặt hàng (Checkout)

**Mô tả:** Người dùng xem lại các sản phẩm đã chọn, nhập thông tin giao hàng, thanh toán và hoàn tất đơn hàng.
**Actor chính:** Người dùng (User).
**Tiền điều kiện:** Người dùng đã có sản phẩm trong giỏ hàng và đã đăng nhập (Nếu chưa đăng nhập sẽ được yêu cầu).

**Sơ đồ hoạt động (Activity Diagram):**
```mermaid
flowchart TD
    Start(["Truy cập Giỏ hàng"]) --> B["Bấm 'Tiến hành thanh toán'"]
    B --> C{"Đã đăng nhập?"}
    C -- "Chưa" --> D["Yêu cầu Đăng nhập"]
    D --> B
    C -- "Rồi" --> E["Nhập địa chỉ & Phương thức thanh toán"]
    E --> F["Hệ thống kiểm tra tương thích ngầm"]
    F --> G{"Phát hiện xung đột?"}
    G -- "Có" --> H["Cảnh báo: Linh kiện xung đột. Xác nhận mua lẻ?"]
    H -- "Không" --> I(["Quay lại Giỏ hàng"])
    H -- "Có" --> J["Kiểm tra tồn kho"]
    G -- "Không" --> J
    J --> K{"Đủ hàng?"}
    K -- "Không" --> L["Báo lỗi SP hết hàng"]
    L --> I
    K -- "Có" --> M["Trừ tồn kho & Tạo Đơn hàng PENDING"]
    M --> End(["Thông báo Đặt hàng thành công"])
```

**Luồng sự kiện chính (Happy Path):**
1. Người dùng truy cập Giỏ hàng, kiểm tra lại danh sách linh kiện và tổng tiền.
2. Người dùng nhấn "Tiến hành Thanh toán".
3. *(Include UC0)* Nếu chưa đăng nhập, hệ thống điều hướng sang trang Đăng nhập. Sau khi đăng nhập thành công, quay lại trang Thanh toán.
4. Người dùng điền/chọn địa chỉ giao hàng và phương thức thanh toán (COD / Chuyển khoản / Ví điện tử).
5. Hệ thống tự động gọi hàm `CheckCompatibility()` lần cuối ngầm bên dưới (để đảm bảo không có linh kiện xung đột nào bị sót).
6. Kết quả trả về an toàn, Người dùng nhấn "Xác nhận đặt hàng".
7. Hệ thống trừ tồn kho (Stock quantity), tạo bản ghi Order mới với trạng thái PENDING.
8. Hệ thống hiển thị trang "Đặt hàng thành công" và gửi email xác nhận.

**Luồng ngoại lệ (Exception/Alternative Paths):**
*   *4a. Hết hàng (Out of stock) tại thời điểm checkout:* Ở bước 7, khi kiểm tra tồn kho để trừ hàng, nếu một sản phẩm trong giỏ đã hết. Hệ thống báo lỗi, bôi đỏ sản phẩm hết hàng và yêu cầu người dùng loại bỏ khỏi giỏ trước khi thanh toán.
*   *4b. Phát hiện xung đột (ERROR) ở bước check cuối:* Ở bước 5, nếu trong giỏ có chứa các linh kiện xung đột (do người dùng thêm lẻ từ trang chi tiết sản phẩm, không qua PC Builder). Hệ thống hiện Pop-up cảnh báo chặn (Blocker): "Phát hiện linh kiện không tương thích trong giỏ hàng. Bạn có chắc chắn muốn mua lẻ không?". Nếu User xác nhận "Mua lẻ", hệ thống cho phép tiếp tục sang bước 6 (Xác nhận đặt hàng).

#### UC5: Quản lý Thông tin Sản phẩm (Admin)

**Mô tả:** Admin thêm mới hoặc cập nhật thông tin linh kiện. Điểm đặc biệt của hệ thống là khi lưu sản phẩm, hệ thống sẽ tự động cập nhật thông số kỹ thuật (JSON) phục vụ Rule Engine và tạo Vector Embedding phục vụ AI Search.
**Actor chính:** Quản trị viên (Admin).
**Actor phụ:** AI Engine (Vector DB).
**Tiền điều kiện:** Admin đã đăng nhập vào trang Quản trị.

**Sơ đồ hoạt động (Activity Diagram):**
```mermaid
flowchart TD
    Start(["Admin chọn 'Thêm/Sửa Sản phẩm'"]) --> B["Nhập thông tin cơ bản (Tên, Giá, Ảnh)"]
    B --> C["Nhập thông số kỹ thuật (JSON Specs)"]
    C --> D["Bấm 'Lưu sản phẩm'"]
    D --> E["Hệ thống lưu vào DB quan hệ"]
    E --> F["Sinh Vector Embedding (@Async qua Spring AI)"]
    F --> G["Lưu Vector vào Vector DB"]
    G --> End(["Hoàn tất. Sẵn sàng cho AI Search & Rule Engine"])
```

**Luồng sự kiện chính (Happy Path):**
1. Admin truy cập trang Quản lý Sản phẩm và chọn "Thêm mới".
2. Admin nhập các thông tin cơ bản: Tên, Hãng, Danh mục, Giá, Số lượng.
3. Admin nhập các trường thông số kỹ thuật động (Ví dụ: `socket_type: LGA1700`, `form_factor: ATX`).
4. Admin nhấn "Lưu". Hệ thống lưu dữ liệu vào bảng `Product`.
5. Hệ thống kích hoạt một sự kiện ngầm (@Async) gọi Spring AI để tạo Vector Embedding.
6. Lưu Vector vào Vector DB.
7. Hệ thống hiển thị thông báo "Thêm sản phẩm thành công".

**Luồng ngoại lệ (Exception/Alternative Paths):**
*   *5a. Lỗi đồng bộ Vector DB:* Ở bước 6, Spring AI bị lỗi không thể tạo vector (vd: lỗi gọi API). Hệ thống lưu log lỗi và đánh dấu sản phẩm `sync_status = FAILED`. Sản phẩm vẫn xuất hiện trên web nhưng sẽ không được tìm thấy qua AI Semantic Search cho đến khi Admin bấm "Đồng bộ lại" bằng tay.

#### UC6: Quản lý Tập Luật Tương thích (Admin)

**Mô tả:** Admin định nghĩa các quy tắc để hệ thống PC Builder biết linh kiện nào lắp được với nhau (Ví dụ: CPU Intel đời 13 phải đi với Mainboard LGA1700).
**Actor chính:** Quản trị viên (Admin).
**Actor phụ:** Rule Engine.
**Tiền điều kiện:** Admin đã đăng nhập vào trang Quản trị.

**Sơ đồ hoạt động (Activity Diagram):**
```mermaid
flowchart TD
    Start(["Truy cập Quản lý Luật"]) --> B["Chọn 'Thêm Luật mới'"]
    B --> C["Chọn Loại linh kiện Nguồn & Đích (VD: CPU -> Mainboard)"]
    C --> D["Chọn thuộc tính đối chiếu (VD: socket_type)"]
    D --> E["Chọn phép toán & Mức độ (VD: IN, ERROR)"]
    E --> F["Viết thông báo lỗi mẫu (Template)"]
    F --> G["Bấm 'Lưu Luật'"]
    G --> H{"Hệ thống validate logic"}
    H -- "Hợp lệ" --> I["Lưu vào bảng Compat_Rule"]
    I --> J["Xóa Cache của Rule Engine"]
    H -- "Không hợp lệ" --> K["Báo lỗi, yêu cầu sửa"]
    K --> E
    J --> End(["Luật mới có hiệu lực ngay lập tức"])
```

**Luồng sự kiện chính (Happy Path):**
1. Admin vào module "Luật Tương Thích".
2. Admin thiết lập luật mới: `Source=CPU`, `Target=Motherboard`.
3. Admin định nghĩa logic: Thuộc tính `socket_type` của CPU phải `IN` (nằm trong) mảng `supported_sockets` của Motherboard. Nếu vi phạm, báo mức `ERROR`.
4. Admin điền câu thông báo mẫu: "CPU {source_value} không lắp vừa mainboard này".
5. Admin nhấn Lưu.
6. Hệ thống kiểm tra tính hợp lệ của cấu trúc luật, lưu vào DB và tự động clear Cache của Rule Engine (module nội bộ trong Core Backend).
7. Các User đang dùng PC Builder ngay lập tức bị áp dụng luật mới này.

#### UC7: Quản lý Đơn hàng & Người dùng (Admin)

**Mô tả:** Admin theo dõi và cập nhật trạng thái các đơn hàng (Từ lúc chờ xác nhận đến khi giao thành công). Đồng thời, Admin có thể quản lý trạng thái của người dùng.
**Actor chính:** Quản trị viên (Admin).
**Tiền điều kiện:** Admin đã đăng nhập vào trang Quản trị.

**Sơ đồ hoạt động (Activity Diagram - Xử lý Đơn hàng):**
```mermaid
flowchart TD
    Start(["Truy cập Quản lý Đơn hàng"]) --> B["Xem danh sách Đơn hàng"]
    B --> C["Chọn một đơn hàng PENDING (Chờ xác nhận)"]
    C --> D{"Kiểm tra thanh toán & tồn kho"}
    D -- "Hợp lệ" --> E["Chuyển trạng thái sang CONFIRMED"]
    D -- "Gian lận/Hết hàng" --> F["Chuyển trạng thái CANCELLED"]
    F --> F1["Hoàn tiền (Nếu đã thanh toán)"]
    F1 --> End_Cancel(["Gửi Email Hủy đơn"])
    E --> G["Giao cho đơn vị vận chuyển"]
    G --> H["Chuyển trạng thái SHIPPING"]
    H --> I{"Khách nhận được hàng?"}
    I -- "Nhận thành công" --> J["Chuyển trạng thái DELIVERED"]
    I -- "Boom hàng/Hoàn trả" --> K["Chuyển trạng thái CANCELLED & Nhập lại kho"]
    J --> End_Done(["Giao dịch hoàn tất"])
    K --> End_Cancel
```

**Luồng sự kiện chính (Happy Path - Quản lý Đơn hàng):**
1. Admin truy cập module "Quản lý Đơn hàng".
2. Hệ thống hiển thị danh sách đơn hàng mới (Trạng thái `PENDING`).
3. Admin xem chi tiết đơn hàng, xác nhận thông tin thanh toán.
4. Admin nhấn "Xác nhận đơn". Trạng thái chuyển thành `CONFIRMED`. Hệ thống gửi email thông báo cho User.
5. Khi hàng được giao cho shipper, Admin cập nhật thành `SHIPPING`.
6. Khi có đối soát giao hàng thành công, Admin cập nhật thành `DELIVERED`.

**Luồng ngoại lệ (Exception/Alternative Paths):**
*   *7a. Hủy đơn hàng:* Nếu phát hiện gian lận hoặc hết hàng thực tế, Admin chuyển trạng thái sang `CANCELLED`. Hệ thống tự động hoàn lại số lượng tồn kho vào bảng `Product` và gửi email xin lỗi khách hàng.
*   *7b. Khóa tài khoản User:* Trong module "Quản lý Người dùng", nếu Admin phát hiện User có dấu hiệu boom hàng nhiều lần, Admin có thể đổi trạng thái User `is_active = false`. User này sẽ bị chặn đăng nhập (tham chiếu UC0).

#### UC8: Xem Dashboard & Thống kê (Admin Analytics & Reporting)

**Mô tả:** Quản trị viên truy cập trang tổng quan (Dashboard) để theo dõi các chỉ số vận hành quan trọng của sàn TMĐT: doanh thu theo mốc thời gian, số lượng đơn hàng theo từng trạng thái, sản phẩm bán chạy nhất, và thống kê các vi phạm tương thích phần cứng được người dùng tra cứu nhiều nhất.
**Actor chính:** Quản trị viên (Admin).
**Tiền điều kiện:** Admin đã đăng nhập thành công vào hệ thống.

**Sơ đồ hoạt động (Activity Diagram):**
```mermaid
flowchart TD
    Start(["Admin truy cập Admin Dashboard"]) --> B["Hệ thống truy vấn tổng hợp dữ liệu (Doanh thu, Đơn hàng, SP, Vi phạm)"]
    B --> C["Hiển thị các thẻ chỉ số KPI & Biểu đồ trực quan"]
    C --> D{"Admin tương tác?"}
    D -- "Thay đổi khoảng thời gian (Hôm nay / Tuần / Tháng / Năm)" --> E["Truy vấn lại dữ liệu thống kê theo mốc thời gian"]
    E --> C
    D -- "Xem chi tiết Top sản phẩm / Đơn hàng" --> F["Chuyển hướng đến module Quản lý tương ứng (UC5 / UC7)"]
    D -- "Bấm 'Xuất báo cáo'" --> G["Hệ thống kết xuất file Excel/PDF tải về máy"]
    G --> C
```

**Luồng sự kiện chính (Happy Path):**
1. Admin truy cập trang Quản trị, hệ thống mặc định điều hướng vào mục "Dashboard & Thống kê".
2. Hệ thống tổng hợp các số liệu KPI chính trong tháng hiện tại:
   - Tổng doanh thu bán hàng và tỷ lệ tăng trưởng so với kỳ trước.
   - Tổng số đơn hàng được phân bổ theo trạng thái (`PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELLED`).
   - Top 5 linh kiện bán chạy nhất và cảnh báo các mã linh kiện sắp hết hàng trong kho.
   - Thống kê tỷ lệ cấu hình PC tương thích và các lỗi phần cứng thường gặp nhất được Rule Engine ghi nhận.
3. Admin có thể thay đổi mốc thời gian xem báo cáo (7 ngày qua, 30 ngày qua, quý này).
4. Hệ thống cập nhật biểu đồ đường (Doanh thu) và biểu đồ tròn (Trạng thái đơn hàng) theo thời gian thực.
5. Admin có thể bấm "Xuất báo cáo" để lưu file bảng tính phục vụ đối soát tài chính.

**Luồng ngoại lệ (Exception/Alternative Paths):**
*   *8a. Dữ liệu chưa phát sinh trong kỳ lọc:* Nếu chọn khoảng thời gian chưa có phát sinh giao dịch, hệ thống hiển thị biểu đồ rỗng kèm thông báo "Không có dữ liệu trong khoảng thời gian đã chọn" thay vì báo lỗi hệ thống.

## 2. Thiết kế kiến trúc phần mềm (High-Level Design)

**Sơ đồ Kiến trúc Hệ thống (System Architecture Diagram):**

```mermaid
flowchart TD
    User((Người dùng)) --> Client["Frontend (ReactJS)"]
    
    Client -->|"REST API (HTTP/HTTPS)"| Core_Backend
    
    subgraph Core_Backend ["Core Backend (Java Monolith - Spring Boot)"]
        direction TB
        API_Routing["API Routing & Security"]
        User_Service["User & Auth"]
        Order_Cart["Order & Cart"]
        PC_Profile_Manager["PC Profile Manager"]
        
        API_Routing --> User_Service
        API_Routing --> Order_Cart
        API_Routing --> PC_Profile_Manager
        
        subgraph Rule_Engine_Module ["Hardware Rule Engine Module"]
            direction TB
            Rule_Evaluator["Rule Evaluator"]
            Aggregate_Calculator["Aggregate Calculator"]
            Rule_Cache_Local["Rule Cache (In-Memory / Caffeine)"]
        end
        PC_Profile_Manager --> Rule_Engine_Module
        Order_Cart --> Rule_Engine_Module
    end
    
    Core_Backend --> Cache[("Redis Cache\n(Session, Product)")]
    
    subgraph AI_Module ["AI Module (Spring AI / LangChain4j)"]
        direction TB
        Semantic_Search["Semantic Search"]
        AI_Reasoning["AI Reasoning"]
        AI_Chatbot["Interactive AI Chatbot"]
    end
    
    Core_Backend --> AI_Module
    
    Core_Backend <--> RDBMS[("Relational DB\n(MySQL/PostgreSQL)")]
    Core_Backend --> VectorDB[("Vector DB\n(Elasticsearch/Milvus)")]
    Core_Backend <-->|"API"| LLM["LLM API\n(Gemini)"]
    Core_Backend --> ObjectStorage[("Object Storage\n(S3/MinIO)\nẢnh sản phẩm")]
```

**Mô hình kiến trúc:**
Dự án sử dụng mô hình **Client-Server** kết hợp với kiến trúc **Java Monolith** cho Core Backend. Lựa chọn này gộp tất cả các tính năng nghiệp vụ E-commerce, Rule Engine và AI Module thành một khối duy nhất, rất phù hợp với quy mô team nhỏ (2 người), loại bỏ độ trễ mạng gọi chéo, giảm thiểu các thành phần hạ tầng (không cần Message Queue và AI Server riêng), dễ bảo trì mà vẫn đảm bảo hiệu suất tốt.
*   **Client (Frontend):** Ứng dụng Web (ReactJS).
*   **Core Backend (Java Monolith):** Hệ thống nghiệp vụ cốt lõi (Java - Spring Boot). Đóng vai trò là khối trung tâm xử lý toàn bộ nghiệp vụ. Tự xử lý API Routing, CORS và Security (Spring Security). Phía sau nó xử lý quản lý người dùng, đơn hàng, giỏ hàng, hồ sơ PC Profile. **Hardware Rule Engine** được tích hợp như một module nội bộ, sử dụng `CompletableFuture` và `@Async` để đánh giá nhiều rule song song. Các request liên quan đến AI sẽ được xử lý trực tiếp thông qua **AI Module** nằm cùng trên Spring Boot.
*   **AI Module (Spring AI / LangChain4j):** Trái tim thông minh của hệ thống, được nhúng trực tiếp vào Core Backend. Giao tiếp trực tiếp với Vector Database (truy vấn nhanh qua mạng cục bộ) và các API Mô hình ngôn ngữ lớn (LLM như Gemini) để thực hiện tác vụ suy luận.

**Phân rã hệ thống (Modules):**
1.  **User & E-commerce Core Module (Java Spring Boot):** Quản lý tài khoản, danh mục, giỏ hàng, đơn hàng, hồ sơ PC Profile.
2.  **Hardware Rule Engine Module (Java Spring Boot — cùng ứng dụng):** Module nội bộ chuyên đánh giá tính tương thích phần cứng. Nhận danh sách linh kiện, tải luật từ DB (có cache in-memory bằng Caffeine), tính toán aggregate values, đánh giá song song các rule bằng `CompletableFuture` và trả về kết quả vi phạm. Giao tiếp với các module khác qua method call nội bộ (không cần gRPC hay REST).
3.  **Semantic Search Subsystem (Java Spring AI):** Khác với tìm kiếm truyền thống, module này kết hợp Elasticsearch (Fuzzy Search) và vector hóa dữ liệu (Vector Database) để tìm kiếm dựa trên "ý nghĩa" câu chữ.
4.  **AI Reasoning Subsystem (Java Spring AI):** Nhận đầu vào là các yêu cầu mơ hồ, sử dụng LLM để:
    *   Suy luận ra nhu cầu cấu hình thực tế (VD: "Máy làm đồ họa kiến trúc" -> Cần ưu tiên CPU đa nhân, RAM lớn, Card Nvidia).
5.  **Interactive AI Chatbot (Java Spring AI):** Giao diện giao tiếp bằng ngôn ngữ tự nhiên, đóng vai trò luân chuyển dữ liệu từ người dùng đến các module AI phía trên và trả kết quả dưới dạng hội thoại.

## 3. Thiết kế dữ liệu (Database Design)

**Sơ đồ thực thể liên kết (ERD):**

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ PC_PROFILE : creates
    USER ||--o{ CART : has
    CART ||--o{ CART_ITEM : contains
    CART_ITEM }o--|| PRODUCT : refers
    PC_PROFILE ||--o{ PROFILE_COMPONENT : contains
    PROFILE_COMPONENT }o--|| PRODUCT : refers
    ORDER ||--o{ ORDER_DETAIL : contains
    ORDER_DETAIL }o--|| PRODUCT : refers
    CATEGORY ||--o{ PRODUCT : categorizes
    COMPAT_RULE }o--|| CATEGORY : "source_category"
    COMPAT_RULE }o--|| CATEGORY : "target_category"
    PRODUCT ||--o| PRODUCT_EMBEDDINGS : "has (Vector DB)"
    
    USER {
        uuid user_id PK
        string name
        string email
        string password_hash
        string phone
        string address
        enum role "USER | ADMIN"
        boolean is_active
        timestamp created_at
    }
    CATEGORY {
        uuid category_id PK
        string category_code UNIQUE "Ma danh muc: CPU, MOTHERBOARD, RAM, GPU, PSU, CASE..."
        string category_name
        string description
        uuid parent_category_id FK "nullable - danh muc cha"
    }
    PRODUCT {
        uuid product_id PK
        string name
        string brand
        text description
        json specs "Thong so ky thuat dong"
        string image_url
        int price
        int stock_quantity
        float benchmark_score "Diem benchmark phuc vu tier ranking %"
        enum sync_status "SYNCED | PENDING | FAILED - Trang thai vector"
        boolean is_active
        uuid category_id FK
        timestamp created_at
    }
    CART {
        uuid cart_id PK
        uuid user_id FK
        timestamp updated_at
    }
    CART_ITEM {
        uuid cart_item_id PK
        uuid cart_id FK
        uuid product_id FK
        int quantity
    }
    ORDER {
        uuid order_id PK
        uuid user_id FK
        string shipping_address
        string phone
        enum payment_method "COD | TRANSFER | EWALLET | INSTALLMENT"
        enum payment_status "UNPAID | PAID | REFUNDED"
        enum status "PENDING | CONFIRMED | SHIPPING | DELIVERED | CANCELLED"
        int total_amount
        int discount_amount "Tien giam gia tu voucher/coupon"
        string voucher_code "Ma khuyen mai ap dung"
        string note
        timestamp created_at
    }
    ORDER_DETAIL {
        uuid order_detail_id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        int unit_price "Gia tai thoi diem dat hang"
    }
    PC_PROFILE {
        uuid profile_id PK
        uuid user_id FK
        string profile_name "VD: PC Gaming cua toi"
        text description
        timestamp created_at
        timestamp updated_at
    }
    PROFILE_COMPONENT {
        uuid component_id PK
        uuid profile_id FK
        uuid product_id FK
        int quantity "VD: 2 thanh RAM"
    }
    COMPAT_RULE {
        uuid rule_id PK
        string rule_name
        string source_category FK "Tham chieu Category.category_code"
        string target_category FK "Tham chieu Category.category_code"
        string source_spec_key
        string target_spec_key
        enum operator "EQUALS | IN | NOT_IN | LTE | GTE | RANGE"
        enum severity "ERROR | WARNING | INFO"
        text error_message_template
        boolean is_active
        int priority "So nho = uu tien cao"
        timestamp created_at
    }
    PRODUCT_EMBEDDINGS {
        uuid product_id PK
        vector embedding_vector
    }
```

**Mô tả các thực thể AI Context:**
*   Các bảng cơ bản: `User`, `Order`, `Product`, `Category`, `PC_Profile`, `Compat_Rule`.
*   **Thực thể cho AI:**
    *   `Product_Embeddings`: (1) Product - (1) Product_Embeddings (Chứa vector biểu diễn thông tin sản phẩm để phục vụ Semantic Search).

**Từ điển dữ liệu bổ sung:**

| Tên bảng | Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **Product_Embeddings** | `product_id` | UUID | Primary Key/FK | Mã sản phẩm |
| | `embedding_vector` | VECTOR | NOT NULL | Vector ngữ nghĩa của tên, mô tả và thông số kỹ thuật (dùng để query bằng độ tương tự cosine) |
| **Product** | `sync_status` | ENUM('SYNCED', 'PENDING', 'FAILED') | DEFAULT 'PENDING' | Trạng thái đồng bộ Vector vào Vector DB (hỗ trợ retry thủ công khi lỗi) |
| | `benchmark_score` | FLOAT | DEFAULT 0 | Điểm hiệu năng tham chiếu (Cinebench, 3DMark...) dùng để tính thanh % Tier Ranking trong PC Profile |
| **Order** | `payment_status` | ENUM('UNPAID', 'PAID', 'REFUNDED') | DEFAULT 'UNPAID' | Trạng thái thanh toán đơn hàng (phục vụ đối soát và hoàn tiền khi hủy đơn) |
| | `discount_amount` | INT | DEFAULT 0 | Số tiền được giảm trừ từ mã khuyến mãi / voucher |
| | `voucher_code` | VARCHAR(50) | NULL | Mã voucher áp dụng (VD: SMARTPC2025) |
| **Category** | `category_code` | VARCHAR(50) | UNIQUE, NOT NULL | Mã định danh chuẩn của loại linh kiện (VD: CPU, MOTHERBOARD, RAM, GPU, PSU, CASE) |
| **Compat_Rule** | `rule_id` | UUID | Primary Key | Mã định danh quy tắc tương thích |
| | `rule_name` | VARCHAR(255) | NOT NULL | Tên mô tả quy tắc (VD: "CPU-Motherboard Socket Match") |
| | `source_category` | VARCHAR(50) | NOT NULL, FK → Category.category_code | Loại linh kiện nguồn cần kiểm tra (VD: `CPU`) |
| | `target_category` | VARCHAR(50) | NOT NULL, FK → Category.category_code | Loại linh kiện đích để đối chiếu (VD: `MOTHERBOARD`) |
| | `source_spec_key` | VARCHAR(100) | NOT NULL | Key thông số kỹ thuật ở linh kiện nguồn (VD: `socket_type`) |
| | `target_spec_key` | VARCHAR(100) | NOT NULL | Key thông số kỹ thuật ở linh kiện đích (VD: `supported_sockets`) |
| | `operator` | ENUM('EQUALS', 'IN', 'NOT_IN', 'LTE', 'GTE', 'RANGE') | NOT NULL | Phép so sánh giữa source_spec và target_spec |
| | `severity` | ENUM('ERROR', 'WARNING', 'INFO') | NOT NULL | Mức độ nghiêm trọng: `ERROR` = chặn thêm giỏ hàng, `WARNING` = cảnh báo, `INFO` = gợi ý |
| | `error_message_template` | TEXT | NOT NULL | Template thông báo khi vi phạm, hỗ trợ placeholder `{source_value}`, `{target_value}` |
| | `is_active` | BOOLEAN | DEFAULT TRUE | Bật/tắt quy tắc mà không cần xóa |
| | `priority` | INT | DEFAULT 0 | Thứ tự ưu tiên đánh giá (số nhỏ = ưu tiên cao) |
| | `created_at` | TIMESTAMP | DEFAULT NOW() | Thời điểm tạo quy tắc |

*Quan hệ: `Compat_Rule.source_category` và `Compat_Rule.target_category` → FK tham chiếu đến `Category.category_code`. Mỗi quy tắc áp dụng lên một cặp loại linh kiện (VD: CPU ↔ MOTHERBOARD, RAM ↔ MOTHERBOARD, GPU ↔ CASE). Thông số kỹ thuật (`source_spec_key`, `target_spec_key`) tham chiếu đến các key trong trường JSON specs của bảng `Product`.*

**Dữ liệu mẫu quy tắc tương thích (Compat_Rule Seed Data):**

| rule_name | source → target | source_spec_key | operator | target_spec_key | severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| CPU-Motherboard Socket Match | CPU → Motherboard | `socket_type` | IN | `supported_sockets` | ERROR |
| RAM Type Compatibility | RAM → Motherboard | `memory_type` | IN | `supported_memory_types` | ERROR |
| RAM Slot Count | RAM (count) → Motherboard | `_count` | LTE | `ram_slots` | ERROR |
| Max RAM Capacity | RAM (tổng) → Motherboard | `_sum_capacity_gb` | LTE | `max_ram_gb` | ERROR |
| GPU Length vs Case | GPU → Case | `length_mm` | LTE | `max_gpu_length_mm` | ERROR |
| CPU Cooler Socket Support | CPU → CPU_Cooler | `socket_type` | IN | `supported_sockets` | ERROR |
| PSU Wattage Sufficiency | _SYSTEM (tổng TDP) → PSU | `_total_tdp_w` | LTE | `rated_wattage_w` | WARNING |
| Mainboard Form Factor vs Case | Motherboard → Case | `form_factor` | IN | `supported_form_factors` | ERROR |
| M.2 Slot Count | SSD_M2 (count) → Motherboard | `_count` | LTE | `m2_slots` | WARNING |
| PCIe Generation | GPU → Motherboard | `pcie_gen` | LTE | `max_pcie_gen` | INFO |

> *Lưu ý thiết kế: Các `spec_key` bắt đầu bằng `_` (VD: `_count`, `_sum_capacity_gb`, `_total_tdp_w`) là các giá trị tính toán động (aggregate), được Rule Engine tính từ danh sách linh kiện trong PC Profile, không phải trường trực tiếp trong bảng Product.*

> *Lưu ý kiến trúc: Việc gộp AI Module trực tiếp vào Java Core Monolith giúp loại bỏ hoàn toàn độ trễ gọi chéo mạng. Quá trình Semantic Search sẽ query trực tiếp Vector Database, sau đó Java Core sử dụng thẳng JPA/Hibernate để lấy thông tin chi tiết sản phẩm ngay trong cùng một process, tối ưu hóa tối đa hiệu suất và băng thông.*

## 4. Thiết kế chi tiết (Low-Level Design / Internal Design)

**Sơ đồ tuần tự: Luồng Tìm kiếm ngữ nghĩa & Suy luận với LLM**

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant UI as Client (ReactJS)
    participant Core as Core Backend (Java Monolith - Spring Boot)
    participant AI as AI Module (Spring AI)
    participant VDB as Vector DB
    participant LLM as Gemini API
    participant DB as Relational DB
    
    User->>UI: Nhập câu hỏi (VD: "Tìm VGA < 8tr...")
    UI->>Core: POST /api/v1/ai/search
    Core->>AI: Gọi module AI nội bộ
    AI->>LLM: Gửi text, yêu cầu Intent Parsing
    LLM-->>AI: Trả về JSON conditions (budget, category...)
    AI->>AI: Vectorize query text (embedding)
    AI->>VDB: Similarity search với vector + conditions
    VDB-->>AI: Danh sách Top 5 product_id
    AI->>DB: Lấy chi tiết sản phẩm (Dùng chung DB context)
    DB-->>AI: Product details (specs, price, name...)
    AI->>LLM: Request Reasoning (5 SP, User Context)
    
    alt LLM phản hồi thành công
        LLM-->>AI: Phân tích sự phù hợp & Lời khuyên
        AI-->>Core: Response: D/s SP + Giải thích của AI
        Core-->>UI: Forward response
        UI-->>User: Hiển thị giao diện kết quả
    else LLM timeout / lỗi
        AI-->>Core: Response: D/s SP (không có AI analysis)
        Core-->>UI: Forward response (fallback)
        UI-->>User: Hiển thị kết quả + thông báo "AI tạm thời không khả dụng"
    else Không tìm thấy sản phẩm
        AI-->>Core: Response: empty results + gợi ý từ khóa khác
        Core-->>UI: Forward response
        UI-->>User: Hiển thị "Không tìm thấy" + gợi ý
    end
```

**Luồng xử lý (Data Flow): Luồng Tìm kiếm ngữ nghĩa & Suy luận với LLM**
1.  **Input:** Người dùng nhập: *"Cần mua card màn hình dưới 8 triệu chạy mượt Cyberpunk 2077 và thỉnh thoảng edit video"*.
2.  **Intent Parsing (LLM):** Hệ thống gửi chuỗi này đến LLM (Gemini). AI suy luận và trích xuất ra các điều kiện: `{ "budget": <= 8000000, "category": "VGA", "keywords": ["gaming high-end", "video editing"], "brand_preference": "Nvidia (tốt cho edit video)" }`.
3.  **Database Query:** Hệ thống dùng JSON trên để query vào database hoặc Vector DB, lấy ra top 5 sản phẩm phù hợp nhất (VD: RTX 4060, RX 7600).
4.  **AI Reasoning & Generation:** Gửi danh sách 5 sản phẩm này ngược lại cho LLM yêu cầu giải thích sự phù hợp dựa trên ngữ cảnh người dùng.
5.  **Output:** Trả về kết quả hiển thị cho Frontend gồm: Danh sách sản phẩm + Đoạn giải thích suy luận của AI (VD: *"RTX 4060 được đề xuất vì hỗ trợ CUDA tốt cho việc edit video của bạn..."*).

---

**Sơ đồ tuần tự: Luồng Kiểm tra tính tương thích phần cứng (Compatibility Check)**

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant UI as Client (ReactJS)
    participant Core as Core Backend (Java Monolith - Spring Boot)
    participant RuleMod as Rule Engine Module (Internal)
    participant DB as Relational DB
    
    User->>UI: Thêm/Sửa linh kiện trong cấu hình
    UI->>Core: POST /api/v1/compatibility/check
    Core->>RuleMod: Gọi nội bộ checkCompatibility()
    RuleMod->>DB: Lấy Specs (JSON) của các linh kiện
    DB-->>RuleMod: Specs của từng linh kiện
    RuleMod->>DB: Lấy các Compat_Rule đang Active (có Cache Caffeine)
    DB-->>RuleMod: Danh sách Rule
    RuleMod->>RuleMod: Tính toán aggregate (VD: tổng TDP, đếm số RAM)
    par Đánh giá song song bằng CompletableFuture
        RuleMod->>RuleMod: Future 1: Evaluate CPU-Mainboard rules
        RuleMod->>RuleMod: Future 2: Evaluate RAM rules
        RuleMod->>RuleMod: Future 3: Evaluate GPU-Case rules
        RuleMod->>RuleMod: Future N: Evaluate PSU rules
    end
    RuleMod->>RuleMod: Tổng hợp violations theo severity
    RuleMod-->>Core: Return CompatibilityResult object
    
    alt Có violation mức ERROR
        Core-->>UI: Response JSON: is_compatible=false, Errors, Warnings, Info
        UI-->>User: Hiển thị cảnh báo ❌ + gợi ý thay thế
    else Chỉ có WARNING/INFO hoặc tương thích hoàn toàn
        Core-->>UI: Response JSON: is_compatible=true, Warnings, Info
        UI-->>User: Hiển thị ✅ tương thích (kèm cảnh báo nếu có)
    end
```

**Luồng xử lý (Data Flow): Luồng Kiểm tra tính tương thích phần cứng (Compatibility Check)**
1.  **Input:** Người dùng thêm linh kiện vào giỏ hàng hoặc vào PC Profile Builder (VD: chọn CPU Intel i7-13700K khi đã có Mainboard ASUS ROG X670E socket AM5).
2.  **Fetch Specs:** Core Backend (Java) nhận request trực tiếp từ Frontend, chuyển đến Rule Engine Module nội bộ. Module truy vấn bảng `Product` để lấy thông số kỹ thuật (JSON specs) của tất cả linh kiện hiện có trong cấu hình.
3.  **Load Rules:** Rule Engine Module tải toàn bộ quy tắc `is_active = TRUE` từ bảng `Compat_Rule` (có cache bằng Caffeine in-memory để tối ưu), lọc theo các cặp `source_category` ↔ `target_category` có mặt trong cấu hình.
4.  **Evaluate (Song song bằng CompletableFuture):** Các rule được nhóm theo cặp category và đánh giá song song bằng `CompletableFuture.supplyAsync()`. Với mỗi quy tắc, engine trích xuất giá trị `source_spec_key` và `target_spec_key` từ specs của linh kiện tương ứng, sau đó thực hiện phép so sánh theo `operator`:
    *   `EQUALS`: source_value == target_value
    *   `IN`: source_value nằm trong danh sách target_value
    *   `LTE` / `GTE`: source_value <= / >= target_value (dùng cho số)
    *   Với các aggregate key (bắt đầu bằng `_`): tính toán từ tập linh kiện (VD: đếm số thanh RAM, tổng dung lượng RAM, tổng TDP).
5.  **Output:** Tổng hợp kết quả từ tất cả CompletableFuture, trả về danh sách vi phạm (violations) kèm severity. Nếu có bất kỳ violation nào ở mức `ERROR`, hệ thống hiển thị cảnh báo và có thể chặn thêm vào giỏ hàng.

**Đặc tả API cho module kiểm tra tương thích (Module Specification):**
*   **REST Endpoint:** `POST /api/v1/compatibility/check` (Thuộc Core Backend - Java Spring Boot)
*   **Internal Method:** `CompatibilityService.checkCompatibility(List<UUID> productIds)` (Gọi nội bộ trong cùng ứng dụng Spring Boot, không cần gRPC)
*   **Tên class nội bộ (Java):** `CompatibilityService`, `RuleEvaluator`, `AggregateCalculator`
*   **Mô tả:** Nhận danh sách ID sản phẩm, đánh giá tính tương thích dựa trên các quy tắc trong bảng `Compat_Rule`, trả về kết quả chi tiết.
*   **Đầu vào (Request Body JSON):**
    `{ "product_ids": ["uuid-cpu", "uuid-mainboard", "uuid-ram-1", "uuid-ram-2", "uuid-gpu", "uuid-psu", "uuid-case"] }`
*   **Xử lý:** Nhận request → Fetch `Product` specs cho từng ID → Load `Compat_Rule` (active, có cache Caffeine) → Tính aggregate values → Đánh giá song song các rule bằng CompletableFuture → Tổng hợp violations theo severity.
*   **Kết quả trả về (Response JSON):**
```json
{
  "is_compatible": false,
  "errors": [
    {
      "rule_name": "CPU-Motherboard Socket Match",
      "severity": "ERROR",
      "message": "CPU socket LGA1700 không tương thích với Mainboard (hỗ trợ: AM5)",
      "source_product": { "id": "uuid-cpu", "name": "Intel Core i7-13700K" },
      "target_product": { "id": "uuid-mainboard", "name": "ASUS ROG X670E" }
    }
  ],
  "warnings": [
    {
      "rule_name": "PSU Wattage Sufficiency",
      "severity": "WARNING",
      "message": "Tổng TDP hệ thống (380W) đang gần ngưỡng 80% công suất PSU (500W). Khuyến nghị nâng cấp nguồn.",
      "source_product": null,
      "target_product": { "id": "uuid-psu", "name": "Corsair CV550" }
    }
  ],
  "info": []
}
```

---

**Sơ đồ tuần tự: Luồng Đặt hàng & Thanh toán (Checkout Flow)**

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant UI as Client (ReactJS)
    participant Core as Core Backend (Java)
    participant RuleMod as Rule Engine Module (Internal)
    participant DB as Relational DB

    User->>UI: Bấm "Tiến hành thanh toán" & Xác nhận
    UI->>Core: POST /api/v1/orders/checkout (Kèm JWT & Cart_ID)
    Core->>DB: Lấy danh sách sản phẩm trong giỏ hàng
    DB-->>Core: Danh sách Product IDs & Quantities
    
    %% Gọi Rule Engine Module nội bộ để check lần cuối
    Core->>RuleMod: checkCompatibility(ProductIDs)
    RuleMod->>DB: Lấy specs & đánh giá luật
    DB-->>RuleMod: Kết quả đánh giá
    RuleMod-->>Core: Return CompatibilityResult
    
    alt Có lỗi xung đột (ERROR)
        Core-->>UI: 409 Conflict (Kèm chi tiết lỗi tương thích)
        UI-->>User: Popup cảnh báo: "Phát hiện linh kiện không tương thích. Bạn có chắc muốn mua lẻ?"
        alt User xác nhận "Mua lẻ"
            User->>UI: Xác nhận mua lẻ
            UI->>Core: POST /api/v1/orders/checkout (force_bypass=true)
        else User hủy
            UI-->>User: Quay lại giỏ hàng để sửa
        end
    else Tương thích hoàn toàn / User đã xác nhận rủi ro
        Core->>DB: Bắt đầu Transaction
        Core->>DB: Kiểm tra tồn kho (Stock_quantity)
        alt Hết hàng
            DB-->>Core: Lỗi tồn kho không đủ
            Core->>DB: Rollback Transaction
            Core-->>UI: 400 Bad Request (Lỗi hết hàng)
            UI-->>User: Cảnh báo sản phẩm hết hàng
        else Đủ hàng
            Core->>DB: Trừ tồn kho (Stock_quantity -= qty)
            Core->>DB: Insert bảng ORDER (PENDING)
            Core->>DB: Insert bảng ORDER_DETAIL
            Core->>DB: Clear Cart
            Core->>DB: Commit Transaction
            Core-->>UI: 200 OK (Kèm Order_ID)
            UI-->>User: Chuyển hướng sang trang Xác nhận đơn hàng thành công
        end
    end
```

**Luồng xử lý (Data Flow): Luồng Đặt hàng & Thanh toán (Checkout Flow)**
1. **Input:** Người dùng xác nhận thanh toán giỏ hàng (chứa danh sách các sản phẩm và thông tin giao hàng).
2. **Compatibility Check (Ngầm):** Core Backend (Java) trước khi tạo đơn sẽ tổng hợp danh sách ID linh kiện và gọi Rule Engine Module nội bộ để kiểm tra lại toàn bộ giỏ hàng, đề phòng trường hợp người dùng thêm lẻ các linh kiện xung đột vào giỏ (VD: mua CPU AMD và Mainboard Intel).
3. **Database Transaction:** Nếu tương thích (hoặc người dùng đã chủ động xác nhận mua rời), Java Core mở một ACID transaction. Tiến hành kiểm tra và trừ tồn kho các sản phẩm, tạo record vào bảng `ORDER` và `ORDER_DETAIL`, đồng thời xóa dữ liệu trong giỏ hàng.
4. **Rollback & Error Handling:** Nếu bất kỳ bước nào thất bại (Rule Engine Module phát hiện xung đột, hoặc DB báo hết hàng), toàn bộ quá trình sẽ được Rollback, DB không thay đổi, và thông báo lỗi tương ứng được trả về để Frontend hiển thị cho người dùng xử lý.

---

**Sơ đồ tuần tự: Luồng Phân tích PC Profile & Đề xuất Nâng cấp**

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant UI as Client (ReactJS)
    participant Core as Core Backend (Java)
    participant AI as AI Module (Spring AI)
    participant LLM as Gemini API
    participant VDB as Vector DB
    
    User->>UI: Bấm "Tư vấn nâng cấp" (Kèm ngân sách & mục tiêu)
    UI->>Core: POST /api/v1/profile/{id}/upgrade-suggestions
    Core->>Core: Fetch thông tin PC Profile hiện tại từ DB
    Core->>AI: Gọi AI tư vấn nội bộ (Profile_Specs + Ngân sách)
    
    %% AI Phân tích Bottleneck & Tìm kiếm thay thế
    AI->>LLM: Gửi cấu hình cũ + Yêu cầu phân tích bottleneck
    LLM-->>AI: Nhận diện điểm nghẽn (VD: GPU yếu) & Gợi ý hướng nâng cấp
    AI->>VDB: Semantic Search tìm GPU phù hợp ngân sách
    VDB-->>AI: Top 3 GPU tiềm năng
    
    %% AI nhờ Rule Engine validate các ứng viên (Nội bộ)
    loop Từng GPU tiềm năng
        AI->>Core: Gọi checkCompatibility() bằng Rule Engine Module (Nội bộ)
        Core-->>AI: Trả kết quả (VD: GPU_1 bị lỗi do PSU quá yếu, GPU_2 OK)
    end
    
    %% AI tổng hợp
    AI->>AI: Chọn GPU_2 (Tương thích tốt nhất & hợp budget)
    AI->>LLM: Tạo văn bản giải thích lý do đề xuất GPU_2
    LLM-->>AI: Đoạn text giải thích
    
    AI-->>Core: Response (Đề xuất thay GPU_2 + Lời giải thích)
    Core-->>UI: Forward response
    UI-->>User: Hiển thị giao diện Đề xuất nâng cấp
```

**Luồng xử lý (Data Flow): Luồng Phân tích PC Profile & Đề xuất Nâng cấp**
1. **Input:** Người dùng yêu cầu tư vấn nâng cấp dựa trên PC Profile có sẵn, kèm theo mức ngân sách và nhu cầu (VD: "Có 5 triệu, muốn chơi game mượt hơn").
2. **AI Bottleneck Analysis:** AI Module (Java Spring AI) gửi thông số chi tiết dàn PC cũ và mục tiêu của người dùng cho Gemini LLM để đánh giá tìm ra "điểm nghẽn" (bottleneck) cản trở hiệu năng (VD: CPU quá yếu so với GPU hiện tại).
3. **AI Search:** Khi biết cần thay linh kiện gì (VD: cần thay CPU), AI dùng Vector DB tìm các CPU thỏa mãn mức ngân sách.
4. **Rule Engine Validation (Bước chốt chặn):** Nhờ tích hợp chung trong Core Backend, AI Module gọi hàm kiểm tra tương thích của Rule Engine một cách trực tiếp (Method Call) đối với từng ứng viên linh kiện. Ví dụ: Nếu CPU mới khác socket so với Mainboard cũ, Rule Engine sẽ báo ERROR ngay lập tức. Khi đó AI sẽ biết phải gợi ý thay cả Mainboard, hoặc tìm CPU khác cùng socket.
5. **Output:** Sau khi tìm được phương án tối ưu (Hiệu năng tốt + Đúng ngân sách + Rule Engine báo tương thích an toàn), AI sẽ sinh văn bản giải thích lý luận của mình và trả về Frontend để người dùng tham khảo và bấm "Thêm vào giỏ".

> **Tài liệu Thiết kế Chi tiết (Detailed Design - DD) theo từng phân hệ:**
> * **Core Rule Engine - Quản lý Tập luật (UC6):** [docs/detail-design/dd-uc6-core-rule-engine.md](docs/detail-design/dd-uc6-core-rule-engine.md)
> * **Quản lý Sản phẩm & Danh mục (UC1a, UC5):** [docs/detail-design/dd-uc5-product-catalog.md](docs/detail-design/dd-uc5-product-catalog.md)
> * **Java Runtime Upgrade (Java 25 LTS):** [docs/detail-design/dd-java-runtime-upgrade.md](docs/detail-design/dd-java-runtime-upgrade.md)
> * **Local Dev & Demo Automation Script:** [docs/detail-design/dd-local-dev-automation.md](docs/detail-design/dd-local-dev-automation.md)

## 5. Thiết kế giao diện người dùng (UI/UX)

### 5.1. Sơ đồ di chuyển màn hình (Screen Navigation Flow)

Luồng thao tác chính của người dùng giữa các màn hình:
```mermaid
flowchart TD
    Login["Đăng nhập / Đăng ký<br>(Login / Register)"]
    Home["Trang chủ<br>(Home)"]
    Search["Tìm kiếm<br>(Search)"]
    Category["Danh mục<br>(Category)"]
    Builder["PC Builder<br>(Compat Checker)"]
    Profile["PC Profile<br>(Cấu hình của tôi)"]
    Account["Tài khoản<br>(Account / Order History)"]
    Detail["Chi tiết SP<br>(Product Detail)"]
    Cart["Giỏ hàng<br>(Cart)"]
    CompatResult["Kết quả Tương thích<br>(Compat Result)"]
    UpgradeSuggest["Đề xuất Nâng cấp<br>(Upgrade Suggest)"]
    Checkout["Thanh toán<br>(Checkout)"]
    OrderConfirm["Xác nhận Đơn hàng<br>(Order Confirm)"]

    Login --> Home
    Home --> Search
    Home --> Category
    Home --> Builder
    Home --> Profile
    Home --> Account

    Search --> Detail
    Category --> Detail
    Builder --> Detail

    Detail --> Cart
    Builder --> CompatResult
    Profile --> UpgradeSuggest
    UpgradeSuggest --> Detail

    Cart --> Checkout
    Checkout --> OrderConfirm

    subgraph Admin_Panel ["Khu vực Quản trị (Admin)"]
        AdminDashboard["Dashboard<br>(Thống kê)"]
        AdminProducts["Quản lý Sản phẩm<br>(Products)"]
        AdminOrders["Quản lý Đơn hàng<br>(Orders)"]
        AdminRules["Quản lý Luật tương thích<br>(Compat Rules)"]
        AdminUsers["Quản lý Người dùng<br>(Users)"]
        AdminDashboard --> AdminProducts
        AdminDashboard --> AdminOrders
        AdminDashboard --> AdminRules
        AdminDashboard --> AdminUsers
    end

    Login -->|Admin| AdminDashboard
```

**Mô tả các luồng di chuyển chính:**

| STT | Luồng | Mô tả |
| :--- | :--- | :--- |
| 1 | Đăng nhập → Trang chủ → Tìm kiếm → Chi tiết SP → Giỏ hàng → Thanh toán → Xác nhận | Luồng mua hàng cơ bản |
| 2 | Trang chủ → Danh mục → Chi tiết SP | Duyệt sản phẩm theo danh mục |
| 3 | Trang chủ → PC Builder → Chọn linh kiện → Kết quả Tương thích | Xây dựng cấu hình và kiểm tra tương thích real-time |
| 4 | PC Builder → Chi tiết SP → Giỏ hàng | Từ builder, xem chi tiết rồi thêm cả bộ vào giỏ |
| 5 | Trang chủ → PC Profile → Đề xuất Nâng cấp → Chi tiết SP → Giỏ hàng | Xem cấu hình, nhận gợi ý nâng cấp, xem chi tiết và mua |
| 6 | Trang chủ → Tài khoản | Xem lịch sử đơn hàng, chỉnh sửa thông tin cá nhân |
| 7 | Đăng nhập (Admin) → Dashboard → Quản lý SP / Đơn hàng / Luật / Người dùng | Luồng quản trị hệ thống |

### 5.2. Bản vẽ giao diện (Layout / Mockup)

> *Ghi chú thiết kế: Các mockup dưới đây được thiết kế tham khảo chuẩn UI/UX từ các nền tảng TMĐT công nghệ hàng đầu tại Việt Nam: **Phong Vũ** (phongvu.vn) — hệ thống danh mục linh kiện chuyên sâu & công cụ Build PC; **Thế Giới Di Động** (thegioididong.com) — bộ lọc Quick Chips & checkout tinh gọn; **CellphoneS** (cellphones.com.vn) — giao diện hiện đại, cross-sell thông minh; **Mac24h** (mac24h.vn) — variant selector & trình bày sản phẩm cao cấp; **HACOM** (hacom.vn) — bảng thông số kỹ thuật chuyên sâu.*

#### Màn hình 0: Đăng nhập / Đăng ký (Login / Register)

![Đăng nhập / Đăng ký](docs/screens/screen0.png)

---

#### Màn hình 1: Trang chủ (Home)

![Trang chủ](docs/screens/screen1.png)

---

#### Màn hình 2: Tìm kiếm thông minh (AI Search)

![Kết quả tìm kiếm AI](docs/screens/screen2a.png)

**Trạng thái Loading (khi AI đang xử lý, ~2-5 giây):**

![Trạng thái Loading AI](docs/screens/screen2b.png)

**Trạng thái Fallback (khi AI không khả dụng):**

![Trạng thái Fallback](docs/screens/screen2c.png)

---

#### Màn hình 3: Chi tiết sản phẩm (Product Detail)

![Chi tiết sản phẩm](docs/screens/screen3.png)

---

#### Màn hình 4: PC Builder & Compatibility Checker

![PC Builder](docs/screens/screen4.png)

---

#### Màn hình 5: Giỏ hàng (Cart)

![Giỏ hàng](docs/screens/screen5a.png)

---

#### Màn hình 6: Thanh toán (Checkout — One-Page)

![Thanh toán](docs/screens/screen5b.png)

---

#### Màn hình 7: Xác nhận đơn hàng (Order Confirmation)

![Xác nhận đơn hàng](docs/screens/screen5c.png)

---

#### Màn hình 8: PC Profile & Đề xuất nâng cấp (Upgrade Suggestion)

![PC Profile & Nâng cấp](docs/screens/screen6.png)

> *Ghi chú: Toàn bộ bộ prompt chi tiết tạo giao diện qua Google Stitch đã được tách và lưu trữ độc lập tại tài liệu [docs/stitch_prompts.md](docs/stitch_prompts.md).*

## 6. Thiết kế Repository & Cấu trúc Thư mục (Repository Architecture & Layout)

```text
project1/
├── .github/          # Cấu hình CI/CD workflows (GitHub Actions tự động build & test) và template Pull Request
├── backend/          # Mã nguồn Core Backend (Spring Boot 3.5.x + Java 25 LTS): Toàn bộ REST API, Spring Security, các module nghiệp vụ (Auth, Product, Rule Engine, PC Builder, PC Profile, AI, Cart, Order, Dashboard), Flyway DB migrations và bộ kiểm thử (Unit & Integration Tests)
├── frontend/         # Mã nguồn Web Frontend (React 18 + Vite + TailwindCSS): Giao diện Storefront người dùng, PC Builder, Admin Portal, atomic components, Zustand state stores và kết nối Axios API
├── docker/           # Cấu hình container hóa và Docker Compose cho môi trường phát triển cục bộ (MySQL 8.0, Redis...)
├── scripts/          # Kịch bản tự động hóa Local Dev/Demo (dev.ps1) và script nạp dữ liệu mẫu khởi tạo (Seed data, tập luật tương thích)
├── dev.cmd           # Wrapper khởi chạy nhanh môi trường Local Dev / Demo 1-click trên Windows
└── docs/             # Tài liệu kỹ thuật dự án: Thư mục thiết kế chi tiết (docs/detail-design/), hình ảnh mockup giao diện (docs/screens/) và đặc tả kiến trúc
```

> *Ghi chú: Bản thiết kế chi tiết phân rã từng file của Backend và Frontend được lưu trữ tại [docs/REPO_DESIGN.md](docs/REPO_DESIGN.md).*

## 7. Cấu trúc Phân rã Công việc (WBS) theo Chức năng

Dựa vào tài liệu đặc tả, dưới đây là WBS phân rã hệ thống theo dạng cây chức năng (Feature-based WBS). Hệ thống được chia thành các phân hệ (Module) lớn, mỗi phân hệ tương ứng với các Use-Case cốt lõi và được bẻ nhỏ thành các tác vụ (Task) phát triển cụ thể.

```text
Nền tảng TMĐT Linh kiện Thông minh
│
├──── Quản lý Tài khoản & Xác thực (UC0, UC7)
│     ├──── Thiết kế Database User, Phân quyền Role (Admin/User)
│     ├──── Đăng ký/Đăng nhập bằng Email & Mật khẩu
│     ├──── Đăng nhập qua mạng xã hội (Google, Facebook)
│     ├──── Quản lý JWT Token/Session
│     ├──── Quản lý trạng thái tài khoản (Admin khóa/mở tài khoản)
│     ├──── Quản lý Quên mật khẩu & Khóa tạm thời khi sai mật khẩu 5 lần
│     └──── Trang Quản lý Hồ sơ cá nhân & Lịch sử đơn hàng (User)
│
├──── Quản lý Sản phẩm & Danh mục (UC1a, UC5)
│     ├──── Quản lý Cây danh mục (Category)
│     ├──── Quản lý Thông tin cơ bản linh kiện (Tên, Ảnh, Giá, Tồn kho)
│     ├──── Quản lý Thông số kỹ thuật động (Dynamic JSON Specs)
│     ├──── Tự động đồng bộ Embedding Vector vào Vector DB khi lưu SP
│     ├──── Trang danh sách & Duyệt sản phẩm theo danh mục (Frontend - UC1a)
│     └──── Chức năng đồng bộ lại Vector DB thủ công (Manual Re-sync Vector)
│
├──── Tìm kiếm Ngữ nghĩa & AI Chat (UC1)
│     ├──── Giao diện Chat/Thanh tìm kiếm AI (Frontend)
│     ├──── Tích hợp LLM để phân tích ý định (Intent Parsing)
│     ├──── Truy vấn độ tương tự trong Vector DB (Similarity Search)
│     ├──── AI suy luận, đánh giá sự phù hợp và tạo câu trả lời
│     └──── Fallback sang tìm kiếm từ khóa ElasticSearch khi AI lỗi
│
├──── Core Rule Engine - Quản lý Tập luật (UC6)
│     ├──── Quản lý Tập luật (Giao diện Admin Thêm/Sửa/Xóa Luật)
│     ├──── Validate cấu trúc dữ liệu Luật (Source, Target, Spec_key, Operator)
│     ├──── Xây dựng Evaluator xử lý phép toán (EQUALS, IN, LTE, GTE...)
│     ├──── Xây dựng Aggregate Calculator (Tính tổng số RAM, tổng TDP...)
│     └──── Tích hợp Hệ thống Cache In-Memory (Caffeine) cho Rules
│
├──── Công cụ Xây dựng PC - PC Builder (UC2)
│     ├──── Giao diện chọn linh kiện theo slot (CPU, Mainboard, RAM, GPU...)
│     ├──── Xử lý gọi Rule Engine để check tương thích khi thêm món mới
│     ├──── Hiển thị thông báo màu sắc theo mức độ (ERROR, WARNING)
│     ├──── Thuật toán chặn/cảnh báo rủi ro khi có vi phạm xung đột
│     ├──── Gợi ý linh kiện thay thế tương thích (Quick Fix Suggestions)
│     └──── Chức năng đẩy toàn bộ cấu hình PC vào giỏ hàng
│
├──── Hồ sơ PC & Đề xuất nâng cấp (UC3)
│     ├──── Chức năng tạo, xem và lưu Hồ sơ cấu hình cá nhân (PC Profile)
│     ├──── Prompt Engineering để AI phân tích điểm nghẽn (Bottleneck)
│     ├──── Thuật toán AI tìm linh kiện thay thế phù hợp ngân sách
│     ├──── Chạy Rule Engine kiểm tra nguồn, mainboard cho món được đề xuất
│     └──── Hiển thị lộ trình nâng cấp kèm giải thích chuyên sâu từ AI
│
├──── Quản lý Giỏ hàng & Thanh toán (UC4)
│     ├──── Quản lý Giỏ hàng (Thêm, sửa số lượng, xóa)
│     ├──── Kiểm tra tương thích chéo ẩn cho toàn bộ Giỏ hàng trước checkout
│     ├──── Form điền địa chỉ & Chọn phương thức thanh toán
│     ├──── Xử lý trừ tồn kho đồng thời và Tạo Đơn hàng (Order PENDING)
│     └──── Tích hợp Gửi Email xác nhận đặt hàng thành công
│
└──── Quản lý Đơn hàng & Thống kê (UC7, UC8)
      ├──── Giao diện Admin quản lý danh sách Đơn hàng (UC7)
      ├──── Flow cập nhật trạng thái (PENDING, CONFIRMED, SHIPPING, DELIVERED)
      ├──── Xử lý Hủy đơn và Hoàn lại tồn kho
      ├──── Tích hợp Gửi Email thông báo khi thay đổi trạng thái
      └──── Dashboard thống kê doanh thu và số lượng đơn hàng (UC8)
```
