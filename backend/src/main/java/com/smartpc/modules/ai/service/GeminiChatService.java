package com.smartpc.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpc.modules.ai.dto.ChatMessage;
import com.smartpc.modules.ai.dto.ChatRequest;
import com.smartpc.modules.ai.dto.ChatResponse;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;

@Service
public class GeminiChatService {

    private static final Logger log = LoggerFactory.getLogger(GeminiChatService.class);

    private static final String GEMINI_API_URL_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    // Chuỗi ưu tiên model từ mạnh nhất -> các model nhẹ hơn khi hết quota hoặc quá tải
    private static final List<String> MODEL_PRIORITY_CHAIN = List.of(
            "gemini-3.1-pro-preview", // Model Pro tư duy chuyên sâu mạnh nhất
            "gemini-3.5-flash",       // Model Flash thế hệ mới
            "gemini-3-flash-preview", // Model Flash preview
            "gemini-3.5-flash-lite",  // Model Flash Lite 3.5
            "gemini-3.1-flash-lite"   // Model Flash Lite siêu nhanh, phản hồi ổn định
    );

    private static final String SYSTEM_INSTRUCTION_TEMPLATE = """
            Bạn là "Chuyên gia Tư vấn Phần cứng SmartPC" — trợ lý AI của sàn thương mại điện tử linh kiện máy tính SmartPC.

            === DANH SÁCH MẶT HÀNG ĐANG CÓ SẴN TRONG KHO SMARTPC ===
            %s
            ======================================================

            QUY TẮC BẮT BUỘC VỀ KHO HÀNG & TƯ VẤN (GROUNDING CONSTRAINTS):
            1. Bạn CHỈ ĐƯỢC đề xuất, tư vấn hoặc lên cấu hình từ NHỮNG SẢN PHẨM CÓ TRONG KHO HÀNG Ở TRÊN.
            2. TUYỆT ĐỐI KHÔNG ĐƯỢC tự bịa đặt, đề xuất hoặc khuyên mua các linh kiện hoặc mã sản phẩm mà kho hàng không có (ví dụ: kho không có RTX 3060, RTX 4090, i9-14900K,... thì KHÔNG ĐƯỢC gợi ý mua những mã đó).
            3. Nếu khách hàng hỏi về một sản phẩm hoặc một mức giá/cấu hình mà kho hàng hiện tại không có linh kiện chính xác khớp hoàn toàn, hãy giải thích khéo léo: "Hiện tại SmartPC đang có sẵn các sản phẩm sau trong kho phù hợp nhất với nhu cầu của bạn..." và đề xuất các sản phẩm tương đương đang có sẵn trong kho để thay thế.
            4. Khi tư vấn, luôn nêu rõ: Tên sản phẩm, Thương hiệu (Brand), Giá niêm yết chính xác như trong danh sách để khách hàng có thể mua ngay trên web.
            5. Luôn lưu ý tính tương thích phần cứng: Socket CPU khớp Mainboard, tổng TDP hệ thống không vượt quá công suất nguồn, chuẩn RAM (DDR4/DDR5) và kích thước VGA vừa vỏ case.
            6. Trả lời nhiệt tình, thân thiện, súc tích, định dạng Markdown rõ ràng (sử dụng bảng hoặc gạch đầu dòng và in đậm tên linh kiện).
            7. Nếu người dùng hỏi các câu hỏi không liên quan đến máy tính hay thiết bị công nghệ, hãy lịch sự từ chối và nhắc nhở bạn chỉ chuyên sâu về phần cứng máy tính.
            """;

    private static final String DEFAULT_CATALOG_SNAPSHOT = """
            - [Card màn hình (GPU)] Card màn hình ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6 | Thương hiệu: ASUS | Giá: 7.990.000 đ | Tồn kho: 15 | Thông số: VRAM 8GB GDDR6, TDP 115W, Dài 227.2mm, Nguồn đề nghị 550W.
            - [Card màn hình (GPU)] Card màn hình MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM | Thương hiệu: MSI | Giá: 24.490.000 đ | Tồn kho: 8 | Thông số: VRAM 16GB GDDR6X, TDP 285W, Dài 307mm, Nguồn đề nghị 750W.
            - [Bộ vi xử lý (CPU)] Bộ vi xử lý Intel Core i5-13600K | Thương hiệu: Intel | Giá: 7.890.000 đ | Tồn kho: 20 | Thông số: Socket LGA1700, 14 nhân 20 luồng, TDP 125W, Bus DDR5/DDR4.
            - [Bộ vi xử lý (CPU)] Bộ vi xử lý AMD Ryzen 7 7800X3D | Thương hiệu: AMD | Giá: 10.990.000 đ | Tồn kho: 12 | Thông số: Socket AM5, 8 nhân 16 luồng, 3D V-Cache, TDP 120W, Bus DDR5.
            - [Bo mạch chủ (Mainboard)] Bo mạch chủ ASUS ROG STRIX B760-A GAMING WIFI D4 | Thương hiệu: ASUS | Giá: 5.490.000 đ | Tồn kho: 10 | Thông số: Socket LGA1700, Chipset B760, ATX, Hỗ trợ RAM DDR4.
            - [Bo mạch chủ (Mainboard)] Bo mạch chủ MSI MAG B650 TOMAHAWK WIFI | Thương hiệu: MSI | Giá: 5.890.000 đ | Tồn kho: 14 | Thông số: Socket AM5, Chipset B650, ATX, Hỗ trợ RAM DDR5.
            - [Bộ nhớ trong (RAM)] RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz | Thương hiệu: Corsair | Giá: 3.290.000 đ | Tồn kho: 25 | Thông số: DDR5, 32GB (2x16GB), Bus 6000MHz.
            - [Ổ cứng (SSD)] Ổ cứng SSD Kingston KC3000 1TB M.2 PCIe Gen4 NVMe | Thương hiệu: Kingston | Giá: 2.390.000 đ | Tồn kho: 30 | Thông số: M.2 NVMe PCIe 4.0, 1TB, Đọc 7000MB/s, Ghi 6000MB/s.
            - [Nguồn máy tính (PSU)] Nguồn Corsair RM750e 750W 80 Plus Gold Full Modular | Thương hiệu: Corsair | Giá: 2.890.000 đ | Tồn kho: 18 | Thông số: 750W, 80 Plus Gold, Full Modular, Chuẩn ATX 3.0 / PCIe 5.0.
            - [Vỏ case] Vỏ case NZXT H5 Flow RGB Black | Thương hiệu: NZXT | Giá: 2.390.000 đ | Tồn kho: 16 | Thông số: Mid Tower, Kính cường lực, Hỗ trợ Main ATX, VGA dài đến 365mm, Tản CPU cao 165mm.
            - [Tản nhiệt CPU] Tản nhiệt khí DeepCool AK620 Digital | Thương hiệu: DeepCool | Giá: 1.690.000 đ | Tồn kho: 22 | Thông số: Tản tháp đôi 2 quạt, Chiều cao 162mm, Socket LGA1700 / AM5, Màn hình số hiển thị nhiệt độ.
            """;

    @Value("${GEMINI_API_KEY:${smartpc.ai.gemini.api-key:}}")
    private String apiKey;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final ProductRepository productRepository;

    public GeminiChatService(ObjectMapper objectMapper) {
        this(objectMapper, null);
    }

    @Autowired
    public GeminiChatService(ObjectMapper objectMapper, @Autowired(required = false) ProductRepository productRepository) {
        this.objectMapper = objectMapper;
        this.productRepository = productRepository;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(4));
        requestFactory.setReadTimeout(Duration.ofSeconds(8));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    public ChatResponse sendMessage(ChatRequest request) {
        String userMessage = request.getMessage().trim();

        // 1. Kiểm tra nếu chưa cấu hình Key
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("dummy_key")) {
            log.info("GEMINI_API_KEY chưa được cấu hình. Sử dụng phản hồi dự phòng SmartPC.");
            return generateFallbackResponse(userMessage);
        }

        Map<String, Object> requestPayload = buildGeminiPayload(userMessage, request.getHistory());

        // 2. Lặp qua chuỗi model từ mạnh nhất -> yếu hơn (Dynamic Model Fallback)
        for (String candidateModel : MODEL_PRIORITY_CHAIN) {
            try {
                log.info("Đang gọi mô hình Gemini: {}...", candidateModel);
                String url = String.format(GEMINI_API_URL_TEMPLATE, candidateModel, apiKey);

                String rawResponse = restClient.post()
                        .uri(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(requestPayload)
                        .retrieve()
                        .body(String.class);

                String replyText = parseGeminiResponse(rawResponse);
                if (replyText != null && !replyText.isBlank()) {
                    log.info("Thành công nhận kết quả từ mô hình: {}", candidateModel);
                    return ChatResponse.builder()
                            .reply(replyText.trim())
                            .suggestions(generateDynamicSuggestions(userMessage))
                            .fallback(false)
                            .build();
                }
            } catch (Exception ex) {
                log.warn("Mô hình {} gặp sự cố hoặc hết quota ({}: {}). Đang chuyển sang mô hình tiếp theo...",
                        candidateModel, ex.getClass().getSimpleName(), ex.getMessage());
            }
        }

        // 3. Fallback dự phòng khi toàn bộ model trong chuỗi đều hết quota hoặc mất mạng
        log.warn("Tất cả mô hình trong chuỗi ưu tiên đều không phản hồi. Kích hoạt phản hồi dự phòng.");
        return generateFallbackResponse(userMessage);
    }

    public String getStoreCatalogContext() {
        if (productRepository != null) {
            try {
                List<Product> products = productRepository.findByIsActiveTrueAndDeletedAtIsNull();
                if (products != null && !products.isEmpty()) {
                    StringBuilder sb = new StringBuilder();
                    for (Product p : products) {
                        String categoryName = (p.getCategory() != null && p.getCategory().getCategoryName() != null)
                                ? p.getCategory().getCategoryName()
                                : "Linh kiện";
                        sb.append(String.format("- [%s] %s | Thương hiệu: %s | Giá: %,d đ | Tồn kho: %d | Thông số: %s\n",
                                categoryName,
                                p.getName(),
                                p.getBrand(),
                                p.getPrice() != null ? p.getPrice() : 0,
                                p.getStockQuantity() != null ? p.getStockQuantity() : 0,
                                formatSpecs(p.getSpecs())));
                    }
                    return sb.toString();
                }
            } catch (Exception e) {
                log.warn("Không thể tải danh mục từ ProductRepository ({}), sử dụng catalog mặc định.", e.getMessage());
            }
        }
        return DEFAULT_CATALOG_SNAPSHOT;
    }

    private String formatSpecs(Map<String, Object> specs) {
        if (specs == null || specs.isEmpty()) {
            return "Tiêu chuẩn";
        }
        StringBuilder sb = new StringBuilder();
        int count = 0;
        for (Map.Entry<String, Object> entry : specs.entrySet()) {
            if (entry.getValue() != null) {
                if (count > 0) sb.append(", ");
                sb.append(entry.getKey()).append(": ").append(entry.getValue());
                count++;
                if (count >= 5) break;
            }
        }
        return sb.toString();
    }

    private Map<String, Object> buildGeminiPayload(String currentMessage, List<ChatMessage> history) {
        Map<String, Object> payload = new HashMap<>();

        // System Instruction gắn kèm danh mục mặt hàng có sẵn trong kho SmartPC
        String finalSystemInstruction = String.format(SYSTEM_INSTRUCTION_TEMPLATE, getStoreCatalogContext());
        Map<String, Object> sysText = new HashMap<>();
        sysText.put("text", finalSystemInstruction);
        Map<String, Object> sysInstruction = new HashMap<>();
        sysInstruction.put("parts", List.of(sysText));
        payload.put("systemInstruction", sysInstruction);

        // Contents (History + Current message)
        List<Map<String, Object>> contents = new ArrayList<>();

        if (history != null && !history.isEmpty()) {
            int startIdx = Math.max(0, history.size() - 6);
            for (int i = startIdx; i < history.size(); i++) {
                ChatMessage msg = history.get(i);
                if (msg.getContent() != null && !msg.getContent().isBlank()) {
                    String role = "assistant".equalsIgnoreCase(msg.getRole()) ? "model" : "user";
                    Map<String, Object> part = new HashMap<>();
                    part.put("text", msg.getContent());
                    Map<String, Object> item = new HashMap<>();
                    item.put("role", role);
                    item.put("parts", List.of(part));
                    contents.add(item);
                }
            }
        }

        Map<String, Object> currentPart = new HashMap<>();
        currentPart.put("text", currentMessage);
        Map<String, Object> currentItem = new HashMap<>();
        currentItem.put("role", "user");
        currentItem.put("parts", List.of(currentPart));
        contents.add(currentItem);

        payload.put("contents", contents);

        // Generation Config
        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.7);
        genConfig.put("topK", 40);
        genConfig.put("topP", 0.95);
        genConfig.put("maxOutputTokens", 1500);
        payload.put("generationConfig", genConfig);

        return payload;
    }

    private String parseGeminiResponse(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }
        } catch (Exception e) {
            log.error("Lỗi parse kết quả JSON từ Gemini: {}", e.getMessage());
        }
        return null;
    }

    private ChatResponse generateFallbackResponse(String userMessage) {
        String lower = userMessage.toLowerCase();
        String reply;
        List<String> suggestions;

        if (lower.contains("15 triệu") || lower.contains("15tr") || lower.contains("tầm 15") || lower.contains("ngân sách")) {
            reply = """
                    Chào bạn! Hiện tại trong kho của **SmartPC** đang có sẵn các linh kiện chính hãng sau:
                    * **Card màn hình (GPU):** ASUS Dual GeForce RTX 4060 V2 OC 8GB (~ 7.990.000đ)
                    * **Bộ vi xử lý (CPU):** Intel Core i5-13600K (~ 7.890.000đ)
                    * **Bo mạch chủ:** ASUS ROG STRIX B760-A GAMING WIFI D4 (~ 5.490.000đ)
                    * **Bộ nhớ RAM:** Corsair Vengeance RGB 32GB DDR5 6000MHz (~ 3.290.000đ)
                    * **Ổ cứng SSD:** Kingston KC3000 1TB M.2 Gen4 NVMe (~ 2.390.000đ)
                    * **Nguồn PSU:** Corsair RM750e 750W 80 Plus Gold (~ 2.890.000đ)
                    * **Vỏ Case:** NZXT H5 Flow RGB Black (~ 2.390.000đ)
                    * **Tản nhiệt:** DeepCool AK620 Digital (~ 1.690.000đ)

                    ⚡ Với mức ngân sách khoảng 15 triệu, bạn có thể chọn linh kiện trọng tâm là **Card màn hình ASUS Dual GeForce RTX 4060 8GB** (7.990.000đ) kết hợp cùng ổ cứng SSD Kingston KC3000 1TB có sẵn trong kho SmartPC để đạt hiệu năng tối ưu nhất!
                    """;
            suggestions = List.of("Xem chi tiết ASUS Dual RTX 4060", "Nguồn Corsair RM750e có đủ cho RTX 4060?", "Đưa linh kiện vào PC Builder");
        } else if (lower.contains("vga") || lower.contains("card") || lower.contains("đồ họa")) {
            reply = """
                    Dưới đây là các mẫu Card màn hình (VGA) **đang có sẵn hàng trong kho SmartPC**:

                    * 🟢 **ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6** — Giá: **7.990.000đ** (Còn 15 chiếc)
                      - Thiết kế 2 quạt Axial-tech, tiết kiệm điện (TDP 115W), chiến mượt game 1080p/2K và hỗ trợ DLSS 3.
                    * 🟢 **MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM** — Giá: **24.490.000đ** (Còn 8 chiếc)
                      - VRAM 16GB GDDR6X cực khủng, tản TRI FROZR 3 quạt TORX 5.0, cân trọn gaming 4K max setting và Render 3D nặng.

                    Cửa hàng SmartPC cam kết chỉ tư vấn sản phẩm chính hãng có sẵn kho. Bạn đang cần mẫu nào để mình kiểm tra độ tương thích với case và nguồn máy nhé!
                    """;
            suggestions = List.of("Nguồn Corsair 750W kéo được RTX 4070 Ti Super không?", "So sánh RTX 4060 vs RTX 4070 Ti Super", "Thêm RTX 4060 vào PC Builder");
        } else if (lower.contains("nâng cấp") || lower.contains("upgrade")) {
            reply = """
                    Để SmartPC tư vấn lộ trình nâng cấp chính xác nhất từ **các mặt hàng đang có sẵn trong kho**, bạn vui lòng chia sẻ thông tin cấu hình hiện tại gồm:
                    1. **CPU & Mainboard** đang dùng.
                    2. **Dung lượng RAM** hiện tại (Chuẩn DDR4 hay DDR5).
                    3. **Card màn hình (VGA)** và **Công suất Nguồn (PSU)**.
                    4. **Ngân sách dự kiến** và **Nhu cầu chính** (Gaming, Đồ họa hay công việc văn phòng).

                    SmartPC sẽ đối soát trực tiếp với kho linh kiện sẵn có để đề xuất mẫu nâng cấp tối ưu nhất!
                    """;
            suggestions = List.of("Nâng cấp lên Core i5-13600K cần đổi mainboard không?", "RTX 4060 cần nguồn tối thiểu bao nhiêu?", "Mở công cụ PC Builder");
        } else {
            reply = """
                    Chào bạn! Mình là **Chuyên gia AI Tư vấn Phần cứng của SmartPC**.

                    Mình sẽ hỗ trợ tư vấn và lên cấu hình dựa trên **danh mục linh kiện chính hãng đang có sẵn trong kho SmartPC**:
                    * 🖥️ **Tư vấn cấu hình PC sẵn hàng:** CPU Intel i5-13600K, AMD Ryzen 7 7800X3D, RTX 4060, RTX 4070 Ti Super...
                    * 🔍 **Kiểm tra tương thích phần cứng:** Socket LGA1700/AM5, nguồn Corsair RM750e, case NZXT H5 Flow, tản DeepCool AK620.
                    * 💰 **Báo giá niêm yết chuẩn:** Theo đúng giá bán thực tế trên sàn SmartPC.

                    Bạn đang cần tìm kiếm linh kiện hoặc tư vấn cấu hình cho nhu cầu nào?
                    """;
            suggestions = List.of("Tư vấn cấu hình với Card RTX 4060", "Xem các linh kiện CPU đang có sẵn", "Cách chọn nguồn PSU đủ công suất");
        }

        return ChatResponse.builder()
                .reply(reply.trim())
                .suggestions(suggestions)
                .fallback(true)
                .build();
    }

    private List<String> generateDynamicSuggestions(String userMessage) {
        String lower = userMessage.toLowerCase();
        if (lower.contains("vga") || lower.contains("card")) {
            return List.of("Nguồn Corsair 750W có đủ cho card này?", "Xem chi tiết ASUS Dual RTX 4060", "Thêm card này vào PC Builder");
        }
        if (lower.contains("cpu") || lower.contains("chip")) {
            return List.of("Mainboard B760 hay B650 tương thích?", "Tản DeepCool AK620 có đủ mát không?", "So sánh i5-13600K vs Ryzen 7 7800X3D");
        }
        return List.of("Linh kiện này còn hàng sẵn không?", "Xem chính sách bảo hành SmartPC", "Đưa toàn bộ cấu hình vào PC Builder");
    }
}
