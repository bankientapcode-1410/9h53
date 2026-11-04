import apiClient from './apiClient';
import { ApiResponse } from '../features/product-catalog/types/product.types';
import { ChatRequest, ChatResponse } from '../features/ai-chat/types/chat.types';
import { MOCK_PRODUCTS } from './mockData';

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

// Chuỗi mô hình AI từ mạnh nhất -> nhẹ hơn (Dynamic Model Fallback)
const MODEL_PRIORITY_CHAIN = [
  'gemini-3.1-pro-preview', // Model Pro tư duy mạnh nhất
  'gemini-3.5-flash',       // Model Flash thế hệ mới
  'gemini-3-flash-preview', // Model Flash preview
  'gemini-3.5-flash-lite',  // Model Flash Lite 3.5
  'gemini-3.1-flash-lite',  // Model Flash Lite ổn định nhất
];

function buildStoreCatalogPrompt(): string {
  const activeProducts = MOCK_PRODUCTS.filter((p) => p.is_active && p.stock_quantity > 0);
  const items = activeProducts
    .map((p) => {
      const specsSummary = Object.entries(p.specs || {})
        .slice(0, 5)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(', ');
      return `- [${p.category.category_name}] ${p.name} | Thương hiệu: ${p.brand} | Giá: ${p.price.toLocaleString('vi-VN')} đ | Tồn kho: ${p.stock_quantity} | Thông số: ${specsSummary}`;
    })
    .join('\n');

  return `=== DANH SÁCH MẶT HÀNG ĐANG CÓ SẴN TRONG KHO SMARTPC ===\n${items}\n======================================================`;
}

function buildSystemInstruction(): string {
  return `Bạn là "Chuyên gia Tư vấn Phần cứng SmartPC" — trợ lý AI của sàn thương mại điện tử linh kiện máy tính SmartPC.

${buildStoreCatalogPrompt()}

QUY TẮC BẮT BUỘC VỀ KHO HÀNG & TƯ VẤN (GROUNDING CONSTRAINTS):
1. Bạn CHỈ ĐƯỢC đề xuất, tư vấn hoặc lên cấu hình từ NHỮNG SẢN PHẨM CÓ TRONG KHO HÀNG Ở TRÊN.
2. TUYỆT ĐỐI KHÔNG ĐƯỢC tự bịa đặt, đề xuất hoặc khuyên mua các linh kiện hoặc mã sản phẩm mà kho hàng không có (ví dụ: kho không có RTX 3060, RTX 4090, i9-14900K,... thì KHÔNG ĐƯỢC gợi ý mua những mã đó).
3. Nếu khách hàng hỏi về một sản phẩm hoặc một mức giá/cấu hình mà kho hàng hiện tại không có linh kiện chính xác khớp hoàn toàn, hãy giải thích khéo léo: "Hiện tại SmartPC đang có sẵn các sản phẩm sau trong kho phù hợp nhất với nhu cầu của bạn..." và đề xuất các sản phẩm tương đương đang có sẵn trong kho để thay thế.
4. Khi tư vấn, luôn nêu rõ: Tên sản phẩm, Thương hiệu (Brand), Giá niêm yết chính xác như trong danh sách để khách hàng có thể mua ngay trên web.
5. Luôn lưu ý tính tương thích phần cứng: Socket CPU khớp Mainboard, tổng TDP hệ thống không vượt quá công suất nguồn, chuẩn RAM (DDR4/DDR5) và kích thước VGA vừa vỏ case.
6. Trả lời nhiệt tình, thân thiện, súc tích, định dạng Markdown rõ ràng (sử dụng bảng hoặc gạch đầu dòng và in đậm tên linh kiện).
7. Nếu người dùng hỏi các câu hỏi không liên quan đến máy tính hay thiết bị công nghệ, hãy lịch sự từ chối và nhắc nhở bạn chỉ chuyên sâu về phần cứng máy tính.`;
}

export const aiChatService = {
  /**
   * Gửi câu hỏi tư vấn sang Backend (/api/v1/ai/chat).
   * Nếu Backend chưa bật, tự động gọi trực tiếp Gemini API theo chuỗi model mạnh nhất -> yếu hơn.
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // 1. Thử gọi qua Backend API trước
    try {
      const response = await apiClient.post<ApiResponse<ChatResponse>>('/api/v1/ai/chat', request);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      console.info('[aiChatService] Backend offline, chuyển sang gọi trực tiếp Gemini API với chuỗi model fallback...');
    }

    // 2. Gọi trực tiếp Gemini API với chuỗi Fallback Model Chain
    const directResult = await callDirectGeminiChain(request.message, request.history);
    if (directResult) {
      return directResult;
    }

    // 3. Fallback dự phòng cuối cùng
    return generateLocalFallback(request.message);
  },
};

async function callDirectGeminiChain(
  userMessage: string,
  history?: Array<{ role: string; content: string }>
): Promise<ChatResponse | null> {
  if (!GEMINI_API_KEY) {
    return null;
  }

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  if (history && history.length > 0) {
    const recent = history.slice(-6);
    for (const msg of recent) {
      if (msg.content) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const payload = {
    systemInstruction: {
      parts: [{ text: buildSystemInstruction() }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1500,
    },
  };

  // Thử lần lượt từ model mạnh nhất -> nhẹ hơn
  for (const model of MODEL_PRIORITY_CHAIN) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          console.log(`[aiChatService] Thành công nhận phản hồi từ model: ${model}`);
          return {
            reply: reply.trim(),
            suggestions: generateDynamicSuggestions(userMessage),
            is_fallback: false,
          };
        }
      } else {
        console.warn(`[aiChatService] Model ${model} không khả dụng hoặc hết quota (${res.status}), thử model tiếp theo...`);
      }
    } catch (err) {
      console.warn(`[aiChatService] Lỗi kết nối model ${model}:`, err);
    }
  }

  return null;
}

function generateDynamicSuggestions(userMessage: string): string[] {
  const lower = userMessage.toLowerCase();
  if (lower.includes('vga') || lower.includes('card')) {
    return [
      'Nguồn Corsair RM750e có đủ cho card này?',
      'Xem chi tiết ASUS Dual RTX 4060',
      'Thêm card này vào PC Builder',
    ];
  }
  if (lower.includes('cpu') || lower.includes('chip')) {
    return [
      'Mainboard ASUS B760 hay MSI B650 tương thích?',
      'Tản DeepCool AK620 có đủ mát không?',
      'So sánh i5-13600K vs Ryzen 7 7800X3D',
    ];
  }
  return [
    'Linh kiện này còn hàng sẵn không?',
    'Xem chính sách bảo hành SmartPC',
    'Đưa toàn bộ cấu hình vào PC Builder',
  ];
}

function generateLocalFallback(userMessage: string): ChatResponse {
  const lower = userMessage.toLowerCase();

  if (lower.includes('15 triệu') || lower.includes('15tr') || lower.includes('tầm 15') || lower.includes('ngân sách')) {
    return {
      reply: `Chào bạn! Hiện tại trong kho của **SmartPC** đang có sẵn các linh kiện chính hãng sau:
* **Card màn hình (GPU):** ASUS Dual GeForce RTX 4060 V2 OC 8GB (~ 7.990.000đ)
* **Bộ vi xử lý (CPU):** Intel Core i5-13600K (~ 7.890.000đ)
* **Bo mạch chủ:** ASUS ROG STRIX B760-A GAMING WIFI D4 (~ 5.490.000đ)
* **Bộ nhớ RAM:** Corsair Vengeance RGB 32GB DDR5 6000MHz (~ 3.290.000đ)
* **Ổ cứng SSD:** Kingston KC3000 1TB M.2 Gen4 NVMe (~ 2.390.000đ)
* **Nguồn PSU:** Corsair RM750e 750W 80 Plus Gold (~ 2.890.000đ)
* **Vỏ Case:** NZXT H5 Flow RGB Black (~ 2.390.000đ)
* **Tản nhiệt:** DeepCool AK620 Digital (~ 1.690.000đ)

⚡ Với mức ngân sách khoảng 15 triệu, bạn có thể chọn linh kiện trọng tâm là **Card màn hình ASUS Dual GeForce RTX 4060 8GB** (7.990.000đ) kết hợp cùng ổ cứng SSD Kingston KC3000 1TB có sẵn trong kho SmartPC để đạt hiệu năng tối ưu nhất!`,
      suggestions: [
        'Xem chi tiết ASUS Dual RTX 4060',
        'Nguồn Corsair RM750e có đủ cho RTX 4060?',
        'Đưa linh kiện vào PC Builder',
      ],
      is_fallback: true,
    };
  }

  if (lower.includes('vga') || lower.includes('card') || lower.includes('đồ họa')) {
    return {
      reply: `Dưới đây là các mẫu Card màn hình (VGA) **đang có sẵn hàng trong kho SmartPC**:

* 🟢 **ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6** — Giá: **7.990.000đ** (Còn 15 chiếc)
  - Thiết kế 2 quạt Axial-tech, tiết kiệm điện (TDP 115W), chiến mượt game 1080p/2K và hỗ trợ DLSS 3.
* 🟢 **MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM** — Giá: **24.490.000đ** (Còn 8 chiếc)
  - VRAM 16GB GDDR6X cực khủng, tản TRI FROZR 3 quạt TORX 5.0, cân trọn gaming 4K max setting và Render 3D nặng.

Cửa hàng SmartPC cam kết chỉ tư vấn sản phẩm chính hãng có sẵn kho. Bạn đang cần mẫu nào để mình kiểm tra độ tương thích với case và nguồn máy nhé!`,
      suggestions: [
        'Nguồn Corsair 750W kéo được RTX 4070 Ti Super không?',
        'So sánh RTX 4060 vs RTX 4070 Ti Super',
        'Thêm RTX 4060 vào PC Builder',
      ],
      is_fallback: true,
    };
  }

  return {
    reply: `Chào bạn! Mình là **Chuyên gia AI Tư vấn Phần cứng của SmartPC**.

Mình sẽ hỗ trợ tư vấn và lên cấu hình dựa trên **danh mục linh kiện chính hãng đang có sẵn trong kho SmartPC**:
* 🖥️ **Tư vấn cấu hình PC sẵn hàng:** CPU Intel i5-13600K, AMD Ryzen 7 7800X3D, RTX 4060, RTX 4070 Ti Super...
* 🔍 **Kiểm tra tương thích phần cứng:** Socket LGA1700/AM5, nguồn Corsair RM750e, case NZXT H5 Flow, tản DeepCool AK620.
* 💰 **Báo giá niêm yết chuẩn:** Theo đúng giá bán thực tế trên sàn SmartPC.

Bạn đang cần tìm kiếm linh kiện hoặc tư vấn cấu hình cho nhu cầu nào?`,
    suggestions: [
      'Tư vấn cấu hình với Card RTX 4060',
      'Xem các linh kiện CPU đang có sẵn',
      'Cách chọn nguồn PSU đủ công suất',
    ],
    is_fallback: true,
  };
}
