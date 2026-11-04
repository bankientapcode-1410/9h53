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
import jakarta.annotation.PostConstruct;

import java.time.Duration;
import java.util.*;

@Service
public class GeminiChatService {

    private static final Logger log = LoggerFactory.getLogger(GeminiChatService.class);

    private static final String GEMINI_API_URL_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    // Chuỗi ưu tiên model từ cao -> thấp: 3.1 pro -> 3.8 flash -> 3.5 flash-lite
    private static final List<String> MODEL_PRIORITY_CHAIN = List.of(
            "gemini-3.1-pro-preview", // 3.1 pro (Model tư duy phân tích cao nhất)
            "gemini-3.8-flash",       // 3.8 flash (Model tốc độ cao)
            "gemini-3.5-flash-lite"   // 3.5 flash-lite (Model tối ưu ngạch & phản hồi cực nhanh)
    );

    private static final String SYSTEM_INSTRUCTION_TEMPLATE = """
            Bạn là "Chuyên gia AI SmartPC" — trợ lý AI của sàn thương mại điện tử linh kiện máy tính SmartPC.

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
            - [Bộ vi xử lý (CPU)] Bộ vi xử lý Intel Core i3-12100F | Thương hiệu: INTEL | Giá: 2.190.000 đ | Tồn kho: 45 | Thông số: Socket LGA1700, 4 nhân 8 luồng, TDP 58W, Bus DDR4/DDR5.
            - [Bộ vi xử lý (CPU)] Bộ vi xử lý Intel Core i5-12400F | Thương hiệu: INTEL | Giá: 3.190.000 đ | Tồn kho: 38 | Thông số: Socket LGA1700, 6 nhân 12 luồng, TDP 65W, Bus DDR4/DDR5.
            - [Bộ vi xử lý (CPU)] Bộ vi xử lý Intel Core i5-13600K | Thương hiệu: INTEL | Giá: 7.490.000 đ | Tồn kho: 25 | Thông số: Socket LGA1700, 14 nhân 20 luồng, TDP 125W, Bus DDR4/DDR5.
            - [Bộ vi xử lý (CPU)] Bộ vi xử lý AMD Ryzen 5 7600 | Thương hiệu: AMD | Giá: 5.290.000 đ | Tồn kho: 22 | Thông số: Socket AM5, 6 nhân 12 luồng, TDP 65W, Bus DDR5.
            - [Bộ vi xử lý (CPU)] Bộ vi xử lý AMD Ryzen 7 7800X3D | Thương hiệu: AMD | Giá: 10.490.000 đ | Tồn kho: 12 | Thông số: Socket AM5, 8 nhân 16 luồng, 3D V-Cache, TDP 120W, Bus DDR5.
            - [Card màn hình (GPU)] Card màn hình ASUS Dual Radeon RX 6600 V2 8GB GDDR6 | Thương hiệu: ASUS | Giá: 5.390.000 đ | Tồn kho: 26 | Thông số: VRAM 8GB GDDR6, TDP 132W, Dài 243mm, Nguồn đề nghị 500W.
            - [Card màn hình (GPU)] Card màn hình ASUS Dual GeForce RTX 3060 White OC 12GB GDDR6 | Thương hiệu: ASUS | Giá: 7.290.000 đ | Tồn kho: 19 | Thông số: VRAM 12GB GDDR6, TDP 170W, Dài 200mm, Nguồn đề nghị 550W.
            - [Card màn hình (GPU)] Card màn hình ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6 | Thương hiệu: ASUS | Giá: 7.990.000 đ | Tồn kho: 15 | Thông số: VRAM 8GB GDDR6, TDP 115W, Dài 227.2mm, Nguồn đề nghị 550W.
            - [Card màn hình (GPU)] Card màn hình ASUS TUF Gaming GeForce RTX 4070 SUPER 12GB GDDR6X | Thương hiệu: ASUS | Giá: 18.990.000 đ | Tồn kho: 11 | Thông số: VRAM 12GB GDDR6X, TDP 220W, Dài 301mm, Nguồn đề nghị 750W.
            - [Card màn hình (GPU)] Card màn hình MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM | Thương hiệu: MSI | Giá: 24.490.000 đ | Tồn kho: 8 | Thông số: VRAM 16GB GDDR6X, TDP 285W, Dài 307mm, Nguồn đề nghị 750W.
            - [Bo mạch chủ (Mainboard)] Bo mạch chủ ASUS PRIME H610M-K D4 | Thương hiệu: ASUS | Giá: 1.790.000 đ | Tồn kho: 40 | Thông số: Socket LGA1700, Chipset H610, Micro-ATX, Hỗ trợ RAM DDR4, 1 M.2.
            - [Bo mạch chủ (Mainboard)] Bo mạch chủ MSI PRO B760M-A WIFI DDR4 | Thương hiệu: MSI | Giá: 3.390.000 đ | Tồn kho: 28 | Thông số: Socket LGA1700, Chipset B760, Micro-ATX, Hỗ trợ RAM DDR4, 2 M.2, Wi-Fi 6E.
            - [Bo mạch chủ (Mainboard)] Bo mạch chủ ASUS ROG STRIX B760-A GAMING WIFI D4 | Thương hiệu: ASUS | Giá: 5.490.000 đ | Tồn kho: 12 | Thông số: Socket LGA1700, Chipset B760, ATX, Hỗ trợ RAM DDR4, 3 M.2.
            - [Bo mạch chủ (Mainboard)] Bo mạch chủ MSI MAG B650 TOMAHAWK WIFI | Thương hiệu: MSI | Giá: 5.890.000 đ | Tồn kho: 17 | Thông số: Socket AM5, Chipset B650, ATX, Hỗ trợ RAM DDR5, 3 M.2, Wi-Fi 6E.
            - [Bộ nhớ trong (RAM)] RAM Kingston Fury Beast Black 8GB DDR4 3200MHz | Thương hiệu: KINGSTON | Giá: 550.000 đ | Tồn kho: 60 | Thông số: DDR4, 8GB (1x8GB), Bus 3200MHz.
            - [Bộ nhớ trong (RAM)] RAM Kingston Fury Beast RGB 16GB (2x8GB) DDR4 3200MHz | Thương hiệu: KINGSTON | Giá: 1.190.000 đ | Tồn kho: 45 | Thông số: DDR4, 16GB (2x8GB), Bus 3200MHz, RGB.
            - [Bộ nhớ trong (RAM)] RAM Corsair Vengeance LPX 32GB (2x16GB) DDR4 3200MHz Black | Thương hiệu: CORSAIR | Giá: 1.890.000 đ | Tồn kho: 30 | Thông số: DDR4, 32GB (2x16GB), Bus 3200MHz.
            - [Bộ nhớ trong (RAM)] RAM Kingston Fury Beast Black 16GB (1x16GB) DDR5 5600MHz | Thương hiệu: KINGSTON | Giá: 1.490.000 đ | Tồn kho: 25 | Thông số: DDR5, 16GB (1x16GB), Bus 5600MHz.
            - [Bộ nhớ trong (RAM)] RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz Black | Thương hiệu: CORSAIR | Giá: 3.290.000 đ | Tồn kho: 20 | Thông số: DDR5, 32GB (2x16GB), Bus 6000MHz, RGB.
            - [Ổ cứng (SSD)] Ổ cứng SSD Kingston NV2 500GB M.2 2280 NVMe PCIe Gen 4.0 x4 | Thương hiệu: KINGSTON | Giá: 1.090.000 đ | Tồn kho: 50 | Thông số: M.2 NVMe PCIe 4.0, 500GB, Đọc 3500MB/s.
            - [Ổ cứng (SSD)] Ổ cứng SSD Kingston NV2 1TB M.2 2280 NVMe PCIe Gen 4.0 x4 | Thương hiệu: KINGSTON | Giá: 1.690.000 đ | Tồn kho: 42 | Thông số: M.2 NVMe PCIe 4.0, 1TB, Đọc 3500MB/s.
            - [Ổ cứng (SSD)] Ổ cứng SSD Kingston KC3000 1TB M.2 PCIe Gen 4.0 x4 NVMe | Thương hiệu: KINGSTON | Giá: 2.390.000 đ | Tồn kho: 32 | Thông số: M.2 NVMe PCIe 4.0, 1TB, Đọc 7000MB/s, Ghi 6000MB/s.
            - [Ổ cứng (SSD)] Ổ cứng SSD Samsung 990 PRO 1TB M.2 PCIe Gen 4.0 x4 NVMe | Thương hiệu: SAMSUNG | Giá: 2.890.000 đ | Tồn kho: 35 | Thông số: M.2 NVMe PCIe 4.0, 1TB, Đọc 7450MB/s, Ghi 6900MB/s.
            - [Nguồn máy tính (PSU)] Nguồn máy tính MSI MAG A550BN 550W 80 Plus Bronze | Thương hiệu: MSI | Giá: 1.090.000 đ | Tồn kho: 35 | Thông số: 550W, 80 Plus Bronze, Quạt 120mm.
            - [Nguồn máy tính (PSU)] Nguồn máy tính Corsair CV650 650W 80 Plus Bronze | Thương hiệu: CORSAIR | Giá: 1.490.000 đ | Tồn kho: 28 | Thông số: 650W, 80 Plus Bronze, Quạt 120mm.
            - [Nguồn máy tính (PSU)] Nguồn máy tính Corsair RM750e 750W 80 Plus Gold ATX 3.0 Full Modular | Thương hiệu: CORSAIR | Giá: 2.890.000 đ | Tồn kho: 24 | Thông số: 750W, 80 Plus Gold, Full Modular, ATX 3.0 PCIe 5.0.
            - [Nguồn máy tính (PSU)] Nguồn máy tính Corsair RM850e 850W 80 Plus Gold Full Modular | Thương hiệu: CORSAIR | Giá: 3.390.000 đ | Tồn kho: 18 | Thông số: 850W, 80 Plus Gold, Full Modular, ATX 3.0 PCIe 5.0.
            - [Vỏ case] Vỏ máy tính Xigmatek NYX 3F Micro-ATX kèm 3 quạt RGB | Thương hiệu: XIGMATEK | Giá: 690.000 đ | Tồn kho: 40 | Thông số: Micro-ATX / Mini-ITX, VGA dài đến 320mm, Tản CPU cao 160mm, 3 fan RGB.
            - [Vỏ case] Vỏ máy tính Montech AIR 100 ARGB Black kèm 4 quạt ARGB | Thương hiệu: MONTECH | Giá: 1.190.000 đ | Tồn kho: 25 | Thông số: Micro-ATX / Mini-ITX, VGA dài đến 330mm, Tản CPU cao 161mm, 4 fan ARGB.
            - [Vỏ case] Vỏ máy tính NZXT H5 Flow RGB Black | Thương hiệu: NZXT | Giá: 2.590.000 đ | Tồn kho: 14 | Thông số: ATX / Micro-ATX, VGA dài đến 365mm, Tản CPU cao 165mm, Kính cường lực.
            - [Vỏ case] Vỏ máy tính Lian Li O11 Dynamic EVO Black | Thương hiệu: LIAN LI | Giá: 3.990.000 đ | Tồn kho: 12 | Thông số: ATX / Micro-ATX / E-ATX, VGA dài đến 422mm, Tản CPU cao 167mm, 2 mặt kính.
            - [Tản nhiệt CPU] Tản nhiệt khí Thermalright Assassin X 120 Refined SE ARGB | Thương hiệu: THERMALRIGHT | Giá: 390.000 đ | Tồn kho: 55 | Thông số: Tản tháp đơn 4 ống đồng, Chiều cao 148mm, Socket LGA1700 / AM5 / AM4, Fan ARGB.
            - [Tản nhiệt CPU] Tản nhiệt khí DeepCool AK620 Digital Black | Thương hiệu: DEEPCOOL | Giá: 1.690.000 đ | Tồn kho: 25 | Thông số: Tản tháp đôi 6 ống đồng, Chiều cao 162mm, Socket LGA1700 / AM5 / AM4, Màn hình số.
            - [Tản nhiệt CPU] Tản nhiệt nước AIO Thermalright Aqua Elite 240 Black ARGB V3 | Thương hiệu: THERMALRIGHT | Giá: 1.290.000 đ | Tồn kho: 30 | Thông số: Tản nước AIO 240mm, Socket LGA1700 / AM5 / AM4, Fan ARGB, Mặt vô cực.
            - [Tản nhiệt CPU] Tản nhiệt nước AIO DeepCool LT720 360mm Black | Thương hiệu: DEEPCOOL | Giá: 3.490.000 đ | Tồn kho: 9 | Thông số: Tản nước AIO 360mm, Socket LGA1700 / AM5 / AM4, Bơm Gen 4, Mặt gương đa chiều.
            - [Tản nhiệt CPU] Tản nhiệt nước AIO NZXT Kraken 360 RGB Black | Thương hiệu: NZXT | Giá: 4.790.000 đ | Tồn kho: 15 | Thông số: Tản nước AIO 360mm, Socket LGA1700 / AM5 / AM4, Màn LCD 1.54 inch, Bơm Asetek Gen 7.
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
        requestFactory.setConnectTimeout(Duration.ZERO); // Không giới hạn timeout (0 = infinite)
        requestFactory.setReadTimeout(Duration.ZERO);    // Không giới hạn timeout (0 = infinite)

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    @PostConstruct
    public void init() {
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("dummy_key")) {
            apiKey = tryLoadApiKeyFromDotEnv();
        }
    }

    private String tryLoadApiKeyFromDotEnv() {
        List<java.nio.file.Path> candidates = List.of(
                java.nio.file.Paths.get(".env"),
                java.nio.file.Paths.get("../.env"),
                java.nio.file.Paths.get("E:/SmartPC/9h53/.env")
        );
        for (java.nio.file.Path p : candidates) {
            try {
                if (java.nio.file.Files.exists(p)) {
                    for (String line : java.nio.file.Files.readAllLines(p)) {
                        line = line.trim();
                        if (line.startsWith("GEMINI_API_KEY=")) {
                            String val = line.substring("GEMINI_API_KEY=".length()).trim();
                            if (!val.isBlank()) {
                                log.info("Tự động nạp GEMINI_API_KEY từ file: {}", p.toAbsolutePath());
                                return val;
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return null;
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
        List<Map<String, String>> rawTurns = new ArrayList<>();

        if (history != null && !history.isEmpty()) {
            int startIdx = Math.max(0, history.size() - 6);
            for (int i = startIdx; i < history.size(); i++) {
                ChatMessage msg = history.get(i);
                if (msg.getContent() != null && !msg.getContent().isBlank()
                        && !msg.getContent().contains("Chào bạn! Mình là **Chuyên gia AI")) {
                    String role = "assistant".equalsIgnoreCase(msg.getRole()) ? "model" : "user";
                    rawTurns.add(Map.of("role", role, "text", msg.getContent().trim()));
                }
            }
        }
        rawTurns.add(Map.of("role", "user", "text", currentMessage.trim()));

        // Luân phiên role, đảm bảo lượt đầu là user
        List<Map<String, Object>> contents = new ArrayList<>();
        for (Map<String, String> turn : rawTurns) {
            String role = turn.get("role");
            String text = turn.get("text");
            if (contents.isEmpty()) {
                if ("user".equals(role)) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("role", "user");
                    item.put("parts", List.of(Map.of("text", text)));
                    contents.add(item);
                }
            } else {
                Map<String, Object> prev = contents.get(contents.size() - 1);
                if (role.equals(prev.get("role"))) {
                    // Cùng role thì gộp text
                    @SuppressWarnings("unchecked")
                    List<Map<String, String>> parts = (List<Map<String, String>>) prev.get("parts");
                    String prevText = parts.get(0).get("text");
                    prev.put("parts", List.of(Map.of("text", prevText + "\n" + text)));
                } else {
                    Map<String, Object> item = new HashMap<>();
                    item.put("role", role);
                    item.put("parts", List.of(Map.of("text", text)));
                    contents.add(item);
                }
            }
        }

        if (contents.isEmpty()) {
            Map<String, Object> item = new HashMap<>();
            item.put("role", "user");
            item.put("parts", List.of(Map.of("text", currentMessage.trim())));
            contents.add(item);
        }

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

        if (lower.contains("20 triệu") || lower.contains("20tr") || lower.contains("tầm 20")) {
            reply = """
                    Chào bạn! Mình là **Chuyên gia AI SmartPC**.

                    Với mức ngân sách **khoảng 20 triệu đồng**, đây là tầm giá tuyệt hảo để build dàn máy chiến max settings mượt mà **FC Online (FO4)** và **LOL (Liên Minh Huyền Thoại)** ở mức 200+ FPS, đồng thời chiến tốt các tựa game đồ họa nặng với linh kiện chính hãng sẵn kho tại SmartPC:
                    * **Bộ vi xử lý (CPU):** Intel Core i5-12400F (6 nhân 12 luồng, Turbo 4.4GHz) — **3.190.000đ**
                    * **Bo mạch chủ:** Bo mạch chủ MSI PRO B760M-A WIFI DDR4 — **3.390.000đ**
                    * **Bộ nhớ RAM:** RAM Kingston Fury Beast RGB 16GB (2x8GB) DDR4 3200MHz — **1.190.000đ**
                    * **Card màn hình (GPU):** ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6 — **7.990.000đ**
                    * **Ổ cứng SSD:** Kingston NV2 1TB M.2 PCIe Gen 4.0 x4 NVMe — **1.690.000đ**
                    * **Nguồn PSU:** Nguồn Corsair CV650 650W 80 Plus Bronze — **1.490.000đ**
                    * **Vỏ Case:** Vỏ case Montech AIR 100 ARGB Black (kèm 4 quạt ARGB) — **1.190.000đ**
                    * **Tản nhiệt CPU:** Thermalright Assassin X 120 Refined SE ARGB — **390.000đ**

                    ⚡ **Tổng chi phí ước tính:** ~ **20.520.000đ** — Cấu hình chuẩn tương thích 100%, bảo hành chính hãng tại SmartPC!
                    """;
            suggestions = List.of("Đưa toàn bộ cấu hình vào PC Builder", "Nguồn Corsair 650W có đủ cho RTX 4060?", "Xem chi tiết card ASUS Dual RTX 4060");
        } else if (lower.contains("15 triệu") || lower.contains("15tr") || lower.contains("tầm 15") || lower.contains("ngân sách")) {
            reply = """
                    Chào bạn! Với mức ngân sách **khoảng 15 triệu**, bạn có thể build một dàn PC cân mượt mọi game Esports (LOL, Valorant, CS2) và làm đồ họa với các linh kiện đang có sẵn trong kho SmartPC:
                    * **Bộ vi xử lý (CPU):** Intel Core i5-12400F (hoặc tùy chọn cao cấp hơn Intel Core i5-13600K) — **3.190.000đ**
                    * **Bo mạch chủ:** Bo mạch chủ ASUS PRIME H610M-K D4 — **1.790.000đ**
                    * **Bộ nhớ RAM:** RAM Kingston Fury Beast RGB 16GB (2x8GB) DDR4 3200MHz — **1.190.000đ**
                    * **Card màn hình (GPU):** ASUS Dual Radeon RX 6600 V2 8GB (hoặc ASUS Dual RTX 4060 V2 OC 8GB) — **5.390.000đ**
                    * **Ổ cứng SSD:** Kingston NV2 500GB M.2 PCIe Gen4 NVMe — **1.090.000đ**
                    * **Nguồn PSU:** MSI MAG A550BN 550W 80 Plus Bronze — **1.090.000đ**
                    * **Vỏ Case:** Vỏ case Xigmatek NYX 3F Micro-ATX (kèm 3 quạt RGB) — **690.000đ**
                    * **Tản nhiệt CPU:** Thermalright Assassin X 120 Refined SE ARGB — **390.000đ**

                    ⚡ **Tổng chi phí ước tính:** ~ **14.740.000đ** — Cấu hình chuẩn tương thích 100%, bảo hành chính hãng tại SmartPC!
                    """;
            suggestions = List.of("Đưa toàn bộ cấu hình vào PC Builder", "Nâng cấp lên card RTX 4060 bù thêm bao nhiêu?", "Xem chi tiết Intel Core i5-12400F");
        } else if (lower.contains("lol") || lower.contains("chiến lol") || lower.contains("esports") || lower.contains("vga") || lower.contains("card") || lower.contains("đồ họa")) {
            reply = """
                    Dưới đây là các mẫu Card màn hình (VGA) **đang có sẵn hàng tại kho SmartPC** phù hợp từ chiến game LOL, Esports đến đồ họa 2K/4K nặng:

                    * 🟢 **ASUS Dual Radeon RX 6600 V2 8GB GDDR6** — Giá: **5.390.000đ** (Còn 26 chiếc)
                      - *Cực phẩm chiến LOL, Valorant, FO4 max setting 200+ FPS*, nhiệt độ mát mẻ, p/p vô địch tầm giá 5 triệu.
                    * 🟢 **ASUS Dual GeForce RTX 3060 White OC 12GB GDDR6** — Giá: **7.290.000đ** (Còn 19 chiếc)
                      - 12GB VRAM thoải mái làm đồ họa 3D, Premiere, AI và chiến mượt game Full HD.
                    * 🟢 **ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6** — Giá: **7.990.000đ** (Còn 15 chiếc)
                      - Kiến trúc Ada Lovelace, công nghệ DLSS 3 tăng vọt FPS, tiêu thụ điện chỉ 115W.
                    * 🟢 **ASUS TUF Gaming GeForce RTX 4070 SUPER 12GB GDDR6X** — Giá: **18.990.000đ** (Còn 11 chiếc)
                      - Chuẩn độ bền quân đội, 3 quạt tản nhiệt mát lạnh, cân tốt gaming 2K Max Setting.
                    * 🟢 **MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM** — Giá: **24.490.000đ** (Còn 8 chiếc)
                      - VRAM 16GB GDDR6X cực khủng, tản TRI FROZR 3 quạt TORX 5.0, cân trọn gaming 4K và Render 3D chuyên nghiệp.

                    Tất cả linh kiện đều là hàng mới chính hãng 100%. Bạn muốn chọn mẫu nào để mình kiểm tra nguồn và vỏ case tương thích nhé!
                    """;
            suggestions = List.of("Nguồn 550W kéo được ASUS RX 6600 không?", "So sánh RTX 3060 12GB vs RTX 4060 8GB", "Thêm RX 6600 vào PC Builder");
        } else if (lower.contains("cpu") || lower.contains("chip") || lower.contains("vi xử lý")) {
            reply = """
                    Dưới đây là danh sách **Bộ vi xử lý (CPU) Intel & AMD chính hãng có sẵn tại kho SmartPC**:

                    * 🔵 **Intel Core i3-12100F** (4 nhân 8 luồng, Turbo 4.3GHz, LGA1700) — Giá: **2.190.000đ** (Còn 45 chiếc)
                    * 🔵 **Intel Core i5-12400F** (6 nhân 12 luồng, Turbo 4.4GHz, LGA1700) — Giá: **3.190.000đ** (Còn 38 chiếc)
                    * 🔵 **Intel Core i5-13600K** (14 nhân 20 luồng, Turbo 5.1GHz, LGA1700) — Giá: **7.490.000đ** (Còn 25 chiếc)
                    * 🔴 **AMD Ryzen 5 7600** (6 nhân 12 luồng, Turbo 5.1GHz, AM5) — Giá: **5.290.000đ** (Còn 22 chiếc)
                    * 🔴 **AMD Ryzen 7 7800X3D** (8 nhân 16 luồng, 3D V-Cache, AM5) — Giá: **10.490.000đ** (Còn 12 chiếc)

                    Tùy theo nhu cầu chơi game hay làm việc, bạn có thể kết hợp với Mainboard H610/B760 hoặc B650 tương ứng đang có sẵn trong kho SmartPC!
                    """;
            suggestions = List.of("Mainboard H610 chạy được i5-12400F không?", "So sánh i5-13600K vs Ryzen 7 7800X3D", "Chọn tản nhiệt cho i5-13600K");
        } else if (lower.contains("ram") || lower.contains("bộ nhớ")) {
            reply = """
                    Dưới đây là các dòng **Bộ nhớ trong (RAM) DDR4 & DDR5 có sẵn tại SmartPC**:

                    * 🔹 **Kingston Fury Beast Black 8GB DDR4 3200MHz** — Giá: **550.000đ** (Còn 60 thanh)
                    * 🔹 **Kingston Fury Beast RGB 16GB (2x8GB) DDR4 3200MHz** — Giá: **1.190.000đ** (Còn 45 kit)
                    * 🔹 **Corsair Vengeance LPX 32GB (2x16GB) DDR4 3200MHz** — Giá: **1.890.000đ** (Còn 30 kit)
                    * 🔶 **Kingston Fury Beast Black 16GB (1x16GB) DDR5 5600MHz** — Giá: **1.490.000đ** (Còn 25 thanh)
                    * 🔶 **Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz** — Giá: **3.290.000đ** (Còn 20 kit)

                    Lưu ý: Mainboard chuẩn DDR4 chỉ cắm được RAM DDR4; Mainboard socket đời mới chuẩn DDR5 cần chọn kit RAM DDR5 nhé bạn!
                    """;
            suggestions = List.of("Tư vấn RAM cho Mainboard ASUS B760-A", "Nên mua 16GB hay 32GB RAM để làm đồ họa?", "Thêm RAM Kingston vào PC Builder");
        } else if (lower.contains("ssd") || lower.contains("ổ cứng") || lower.contains("lưu trữ")) {
            reply = """
                    Các dòng **Ổ cứng SSD M.2 NVMe PCIe Gen4 tốc độ cao có sẵn tại SmartPC**:

                    * 💾 **Kingston NV2 500GB M.2 PCIe Gen 4.0** (Đọc 3500MB/s) — Giá: **1.090.000đ** (Còn 50 chiếc)
                    * 💾 **Kingston NV2 1TB M.2 PCIe Gen 4.0** (Đọc 3500MB/s) — Giá: **1.690.000đ** (Còn 42 chiếc)
                    * 💾 **Kingston KC3000 1TB M.2 PCIe Gen 4.0** (Đọc 7000MB/s, có tản Graphene) — Giá: **2.390.000đ** (Còn 32 chiếc)
                    * 💾 **Samsung 990 PRO 1TB M.2 PCIe Gen 4.0** (Đọc 7450MB/s đỉnh cao) — Giá: **2.890.000đ** (Còn 35 chiếc)
                    """;
            suggestions = List.of("So sánh Kingston NV2 vs KC3000", "Mainboard H610 có lắp được SSD Gen 4?", "Thêm SSD Samsung 990 PRO vào PC Builder");
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
                    Chào bạn! Mình là **Chuyên gia AI SmartPC**.

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
