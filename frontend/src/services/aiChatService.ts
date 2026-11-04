import apiClient from './apiClient';
import { ApiResponse } from '../features/product-catalog/types/product.types';
import { ChatRequest, ChatResponse } from '../features/ai-chat/types/chat.types';
import { MOCK_PRODUCTS } from './mockData';

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

// Chuỗi mô hình AI từ cao xuống thấp theo yêu cầu: 3.1 pro -> 3.8 flash -> 3.5 flash-lite (Không giới hạn timeout)
const MODEL_PRIORITY_CHAIN = [
  { model: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
  { model: 'gemini-3.8-flash',       name: 'Gemini 3.8 Flash' },
  { model: 'gemini-3.5-flash-lite',  name: 'Gemini 3.5 Flash-Lite' },
];

// Bộ nhớ tạm lưu trữ thời điểm các model bị lỗi quota/demand (Circuit Breaker)
// Tránh việc mỗi câu chat đều phải gửi request vào các model đã biết là đang hết ngạch (429)
const modelCooldownMap: Record<string, number> = {};

function isModelCoolingDown(model: string): boolean {
  const cooldownUntil = modelCooldownMap[model];
  if (!cooldownUntil) return false;
  if (Date.now() < cooldownUntil) {
    return true;
  }
  delete modelCooldownMap[model];
  return false;
}

function setModelCooldown(model: string, durationMs: number) {
  modelCooldownMap[model] = Date.now() + durationMs;
}

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
  return `Bạn là "Chuyên gia AI SmartPC" — trợ lý AI tư vấn phần cứng và máy tính chuyên nghiệp của SmartPC.

${buildStoreCatalogPrompt()}

QUY TẮC BẮT BUỘC VỀ KHO HÀNG & TƯ VẤN (GROUNDING CONSTRAINTS):
1. Bạn CHỈ ĐƯỢC đề xuất, tư vấn hoặc lên cấu hình từ NHỮNG SẢN PHẨM CÓ TRONG KHO HÀNG Ở TRÊN.
2. TUYỆT ĐỐI KHÔNG tự bịa đặt các linh kiện mà kho hàng không có (ví dụ: kho không có RTX 4090, i9-14900K,... thì không đề xuất mua).
3. Luôn trả lời trực tiếp vào trọng tâm câu hỏi của khách hàng:
   - Nếu khách hỏi về 1 linh kiện cụ thể: Báo giá, thông số, tồn kho và tư vấn độ tương thích.
   - Nếu khách hỏi về ngân sách / tựa game: Đưa ra cấu hình chi tiết (CPU, GPU, RAM, Main, Nguồn, SSD, Case) có tổng giá sát nhất với ngân sách.
   - Nếu khách hỏi so sánh: Phân tích ưu/nhược điểm hiệu năng và giá thành.
4. Khi tư vấn, luôn nêu rõ: Tên sản phẩm, Thương hiệu (Brand), Giá niêm yết chính xác để khách hàng có thể mua ngay trên web.
5. Luôn kiểm tra tính tương thích phần cứng: Socket CPU khớp Mainboard, tổng TDP hệ thống không vượt quá công suất nguồn, chuẩn RAM (DDR4/DDR5) và kích thước VGA vừa vỏ case.
6. Trả lời nhiệt tình, thân thiện, súc tích, định dạng Markdown rõ ràng (sử dụng gạch đầu dòng và in đậm tên linh kiện).`;
}

export const aiChatService = {
  /**
   * Gửi câu hỏi tư vấn sang Backend (/api/v1/ai/chat).
   * Nếu Backend chưa bật hoặc offline, tự động gọi trực tiếp Gemini API theo chuỗi model 3.1 pro -> 3.8 flash -> 3.5 flash-lite (không giới hạn timeout).
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // 1. Thử gọi qua Backend API trước nếu backend online
    try {
      const response = await apiClient.post<ApiResponse<ChatResponse>>('/api/v1/ai/chat', request);
      if (response.data && response.data.data) {
        const resData = response.data.data;
        if (!resData.fallback && !resData.is_fallback) {
          return resData;
        }
      }
    } catch {
      // Backend offline hoặc chưa có API key, tự động chuyển sang gọi trực tiếp Gemini API
    }

    // 2. Gọi trực tiếp Gemini API theo chuỗi model từ cao xuống thấp (3.1 pro -> 3.8 flash -> 3.5 flash-lite) không giới hạn timeout
    const directResult = await callDirectGeminiChain(request.message, request.history);
    if (directResult) {
      return directResult;
    }

    // 3. Fallback dự phòng thông minh dựa trên 36 sản phẩm thực tế
    return generateLocalFallback(request.message);
  },
};

/**
 * Chuẩn hóa lịch sử hội thoại thành danh sách lượt nói user/model luân phiên chuẩn xác theo yêu cầu Gemini API
 */
function sanitizeConversationTurns(
  userMessage: string,
  history?: Array<{ role: string; content: string }>
): Array<{ role: string; parts: Array<{ text: string }> }> {
  const rawList: Array<{ role: 'user' | 'model'; text: string }> = [];

  if (history && history.length > 0) {
    const recent = history.slice(-6);
    for (const msg of recent) {
      // Bỏ qua tin nhắn chào mừng mặc định của hệ thống
      if (!msg.content || msg.content.includes('Chào bạn! Mình là **Chuyên gia AI') || msg.content.includes('welcome')) {
        continue;
      }
      rawList.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        text: msg.content.trim(),
      });
    }
  }

  rawList.push({
    role: 'user',
    text: userMessage.trim(),
  });

  // Đảm bảo lượt đầu tiên luôn là 'user' và các lượt nói phải luân phiên xen kẽ
  const sanitized: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const item of rawList) {
    if (!item.text) continue;

    if (sanitized.length === 0) {
      if (item.role === 'user') {
        sanitized.push({ role: 'user', parts: [{ text: item.text }] });
      }
    } else {
      const prev = sanitized[sanitized.length - 1];
      if (prev.role === item.role) {
        // Gộp hai tin nhắn cùng role liên tiếp
        prev.parts[0].text += '\n' + item.text;
      } else {
        sanitized.push({ role: item.role, parts: [{ text: item.text }] });
      }
    }
  }

  // Dự phòng nếu danh sách rỗng
  if (sanitized.length === 0) {
    sanitized.push({ role: 'user', parts: [{ text: userMessage.trim() }] });
  }

  return sanitized;
}

async function callDirectGeminiChain(
  userMessage: string,
  history?: Array<{ role: string; content: string }>
): Promise<ChatResponse | null> {
  if (!GEMINI_API_KEY) {
    console.warn('[aiChatService] VITE_GEMINI_API_KEY chưa được cấu hình.');
    return null;
  }

  const contents = sanitizeConversationTurns(userMessage, history);

  const payload = {
    systemInstruction: {
      parts: [{ text: buildSystemInstruction() }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1200,
    },
  };

  // Thử lần lượt từ model mạnh nhất -> nhẹ hơn: 3.1 pro -> 3.8 flash -> 3.5 flash-lite (hoàn toàn không giới hạn timeout)
  for (const item of MODEL_PRIORITY_CHAIN) {
    const { model, name } = item;

    // Kiểm tra nếu model đang trong thời gian cooldown do vừa lỗi quota hoặc 503
    if (isModelCoolingDown(model)) {
      console.info(`[aiChatService] Bỏ qua ${name} (${model}) vì đang trong thời gian giãn cách quota/demand.`);
      continue;
    }

    try {
      console.log(`[aiChatService] Đang gửi câu hỏi tới ${name} (${model}) (không giới hạn timeout, chờ đến khi có phản hồi)...`);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim()) {
          console.log(`[aiChatService] ✅ Thành công nhận phản hồi đầy đủ từ ${name} (${model})!`);
          return {
            reply: reply.trim(),
            suggestions: generateDynamicSuggestions(userMessage),
            is_fallback: false,
          };
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        const status = res.status;
        console.warn(`[aiChatService] ⚠️ ${name} trả về lỗi HTTP ${status}:`, errorData);

        if (status === 429) {
          // Hết quota ngày hoặc phút -> giãn cách 5 phút
          setModelCooldown(model, 5 * 60 * 1000);
        } else if (status === 503 || status === 500) {
          // Quá tải máy chủ -> giãn cách 1 phút
          setModelCooldown(model, 60 * 1000);
        }
      }
    } catch (err: any) {
      console.warn(`[aiChatService] ❌ Lỗi kết nối ${name}:`, err);
    }
  }

  return null;
}

function generateDynamicSuggestions(userMessage: string): string[] {
  const lower = userMessage.toLowerCase();
  if (lower.includes('vga') || lower.includes('card') || lower.includes('đồ họa')) {
    return [
      'Nguồn Corsair RM750e có đủ cho card này?',
      'Xem chi tiết ASUS Dual RTX 4060',
      'Thêm card này vào PC Builder',
    ];
  }
  if (lower.includes('cpu') || lower.includes('chip') || lower.includes('intel') || lower.includes('ryzen')) {
    return [
      'Mainboard ASUS B760 hay MSI B650 tương thích?',
      'Tản DeepCool AK620 có đủ mát không?',
      'So sánh i5-13600K vs Ryzen 7 7800X3D',
    ];
  }
  if (lower.includes('ram') || lower.includes('bộ nhớ')) {
    return [
      'Nên chọn RAM Kingston DDR4 hay DDR5?',
      'Mainboard B760 hỗ trợ tối đa bao nhiêu GB RAM?',
      'Thêm 32GB Corsair Vengeance vào cấu hình',
    ];
  }
  if (lower.includes('nguồn') || lower.includes('psu') || lower.includes('watt')) {
    return [
      'Nguồn Corsair 650W có đủ kéo RTX 4060 không?',
      'Chuẩn 80 Plus Gold khác Bronze như thế nào?',
      'Xem chi tiết Corsair RM750e 750W',
    ];
  }
  return [
    'Tư vấn cấu hình PC gaming 15 - 20 triệu',
    'Kiểm tra tính tương thích toàn bộ dàn máy',
    'Xem chính sách bảo hành chính hãng SmartPC',
  ];
}

/**
 * Bộ sinh phản hồi nội bộ thông minh dựa trên 36 linh kiện có sẵn trong kho SmartPC
 * Đảm bảo mọi câu hỏi đều nhận được câu trả lời cụ thể, chi tiết, không bao giờ lặp lại tin nhắn chào
 */
function generateLocalFallback(userMessage: string): ChatResponse {
  const lower = userMessage.toLowerCase();

  // 1. Phân loại theo ngân sách
  if (lower.includes('20 triệu') || lower.includes('20tr') || lower.includes('tầm 20') || lower.includes('khoảng 20')) {
    return {
      reply: `Chào bạn! Mình là **Chuyên gia AI SmartPC**.

Với mức ngân sách **khoảng 20 triệu đồng**, đây là tầm giá tuyệt hảo để build dàn máy chiến mượt mà **FC Online (FO4)** và **LOL (Liên Minh Huyền Thoại)** ở mức 200+ FPS max setting, đồng thời chiến tốt các game AAA với linh kiện chính hãng sẵn kho tại SmartPC:
* **Bộ vi xử lý (CPU):** Intel Core i5-12400F (6 nhân 12 luồng, Turbo 4.4GHz) — **3.190.000 đ**
* **Bo mạch chủ:** Bo mạch chủ MSI PRO B760M-A WIFI DDR4 — **3.390.000 đ**
* **Bộ nhớ RAM:** RAM Kingston Fury Beast RGB 16GB (2x8GB) DDR4 3200MHz — **1.190.000 đ**
* **Card màn hình (GPU):** ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6 — **7.990.000 đ**
* **Ổ cứng SSD:** Kingston NV2 1TB M.2 PCIe Gen 4.0 x4 NVMe — **1.690.000 đ**
* **Nguồn PSU:** Nguồn Corsair CV650 650W 80 Plus Bronze — **1.490.000 đ**
* **Vỏ Case:** Vỏ case Montech AIR 100 ARGB Black (kèm 4 quạt ARGB) — **1.190.000 đ**
* **Tản nhiệt CPU:** Thermalright Assassin X 120 Refined SE ARGB — **390.000 đ**

⚡ **Tổng chi phí ước tính:** ~ **20.520.000 đ** — Linh kiện chính hãng SmartPC 100%, bảo hành 36 tháng!`,
      suggestions: [
        'Đưa toàn bộ cấu hình vào PC Builder',
        'Nguồn Corsair 650W có đủ cho RTX 4060?',
        'Xem chi tiết card ASUS Dual RTX 4060',
      ],
      is_fallback: true,
    };
  }

  if (lower.includes('15 triệu') || lower.includes('15tr') || lower.includes('tầm 15') || lower.includes('khoảng 15')) {
    return {
      reply: `Chào bạn! Với ngân sách **khoảng 15 triệu đồng**, SmartPC đề xuất cấu hình tối ưu hiệu năng/giá thành (P/P) tốt nhất:
* **Bộ vi xử lý (CPU):** AMD Ryzen 5 5600X hoặc Intel Core i5-12400F (~ **3.190.000 đ**)
* **Bo mạch chủ:** ASUS PRIME H610M-K D4 — **1.790.000 đ**
* **Bộ nhớ RAM:** RAM Kingston Fury Beast Black 16GB (2x8GB) DDR4 3200MHz — **1.100.000 đ**
* **Card màn hình (GPU):** ASUS Dual Radeon RX 6600 V2 8GB GDDR6 — **5.390.000 đ**
* **Ổ cứng SSD:** Kingston NV2 500GB M.2 PCIe Gen 4.0 — **1.090.000 đ**
* **Nguồn PSU:** MSI MAG A550BN 550W 80 Plus Bronze — **1.090.000 đ**
* **Vỏ Case:** Xigmatek NYX 3F Micro-ATX (kèm 3 quạt RGB) — **690.000 đ**

⚡ **Tổng chi phí ước tính:** ~ **14.350.000 đ** — Cân tốt mọi game eSports LOL, FO4, CS2 ở mức khung hình 150 - 200+ FPS!`,
      suggestions: [
        'RX 6600 chơi game có mượt hơn RTX 3050 không?',
        'Thêm cấu hình này vào PC Builder',
        'Nâng cấp lên SSD 1TB thêm bao nhiêu?',
      ],
      is_fallback: true,
    };
  }

  // 2. Phân loại theo CPU / Chip
  if (lower.includes('cpu') || lower.includes('chip') || lower.includes('vi xử lý')) {
    return {
      reply: `Dưới đây là các mã **Bộ vi xử lý (CPU) chính hãng đang có sẵn hàng trong kho SmartPC**:

* 🔹 **Intel Core i5-12400F** (6 nhân 12 luồng, Socket LGA1700) — **3.190.000 đ** (P/P quốc dân cho gaming tầm trung)
* 🔹 **Intel Core i5-13600K** (14 nhân 20 luồng, Turbo 5.1GHz) — **7.890.000 đ** (Cực mạnh cho render và đồ họa nặng)
* 🔹 **AMD Ryzen 5 5600X** (6 nhân 12 luồng, Socket AM4) — **3.490.000 đ** (Mát mẻ, ổn định)
* 🔹 **AMD Ryzen 7 7800X3D** (8 nhân 16 luồng, 3D V-Cache đỉnh cao) — **10.490.000 đ** (Vua CPU Gaming thế giới)

💡 **Lưu ý tương thích:**
- CPU Intel thế hệ 12/13 tương thích Socket **LGA1700** (đi cùng Mainboard H610, B760).
- CPU Ryzen 7 7800X3D yêu cầu Socket **AM5** và chuẩn **RAM DDR5** (đi cùng Mainboard B650 Tomahawk).`,
      suggestions: [
        'Mainboard nào đi cùng i5-13600K tốt nhất?',
        'So sánh i5-12400F vs Ryzen 5 5600X',
        'Ryzen 7 7800X3D nên chọn tản nhiệt nước nào?',
      ],
      is_fallback: true,
    };
  }

  // 3. Phân loại theo Card màn hình (VGA / GPU)
  if (lower.includes('vga') || lower.includes('card') || lower.includes('gpu') || lower.includes('đồ họa')) {
    return {
      reply: `Kho hàng **SmartPC** đang có sẵn các dòng Card màn hình chính hãng mới 100%:

* 🟢 **ASUS Dual Radeon RX 6600 V2 8GB GDDR6** — Giá: **5.390.000 đ** (TDP 132W, đề nghị nguồn 500W, best choice dưới 6 triệu).
* 🟢 **ASUS Dual GeForce RTX 3060 White OC 12GB** — Giá: **7.290.000 đ** (12GB VRAM thoải mái làm đồ họa Premiere, 3D).
* 🟢 **ASUS Dual GeForce RTX 4060 V2 OC 8GB** — Giá: **7.990.000 đ** (Kiến trúc Ada Lovelace, hỗ trợ DLSS 3 Frame Gen, ăn cực ít điện 115W).
* 🟢 **ASUS TUF Gaming GeForce RTX 4070 SUPER 12GB** — Giá: **18.990.000 đ** (Cân tốt game 2K/4K max setting).
* 🟢 **MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM** — Giá: **24.490.000 đ** (VRAM 16GB đỉnh chóp cho dựng hình AI/3D và game 4K).

Bạn đang nhắm tới mẫu nào để mình tư vấn bộ nguồn và kích thước case phù hợp nhé!`,
      suggestions: [
        'Nguồn Corsair 650W có đủ kéo RTX 4060 không?',
        'So sánh RTX 3060 12GB vs RTX 4060 8GB',
        'Thêm RTX 4060 vào PC Builder',
      ],
      is_fallback: true,
    };
  }

  // 4. Phân loại theo RAM
  if (lower.includes('ram') || lower.includes('bộ nhớ trong')) {
    return {
      reply: `Các dòng **RAM chính hãng có sẵn kho tại SmartPC**:

* 🔸 **Kingston Fury Beast Black 8GB DDR4 3200MHz** — **550.000 đ**
* 🔸 **Kingston Fury Beast RGB 16GB (2x8GB) DDR4 3200MHz** — **1.190.000 đ**
* 🔸 **Corsair Vengeance LPX 32GB (2x16GB) DDR4 3200MHz** — **1.890.000 đ**
* 🔸 **Kingston Fury Beast Black 16GB DDR5 5600MHz** — **1.490.000 đ**
* 🔸 **Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz** — **3.290.000 đ**

💡 **Khuyên dùng:** Nếu chơi game và làm việc văn phòng, 16GB Dual Channel (2x8GB) là tiêu chuẩn vàng. Nếu làm đồ họa Render hoặc dựng video 4K, bạn nên chọn kit 32GB (2x16GB).`,
      suggestions: [
        'Mainboard B760 nên dùng RAM DDR4 hay DDR5?',
        'Nâng cấp từ 16GB lên 32GB RAM thêm bao nhiêu tiền?',
        'Xem chi tiết kit RAM Corsair Vengeance RGB',
      ],
      is_fallback: true,
    };
  }

  // 5. Phân loại theo Ổ cứng SSD
  if (lower.includes('ssd') || lower.includes('ổ cứng') || lower.includes('dung lượng')) {
    return {
      reply: `SmartPC đang có sẵn các dòng **Ổ cứng SSD M.2 NVMe PCIe Gen 4.0** tốc độ cao:

* 💾 **Kingston NV2 500GB PCIe Gen 4.0 x4** — **1.090.000 đ** (Tốc độ đọc 3500MB/s)
* 💾 **Kingston NV2 1TB PCIe Gen 4.0 x4** — **1.690.000 đ** (Dung lượng lớn, giá cực êm)
* 💾 **Kingston KC3000 1TB PCIe Gen 4.0 x4** — **2.390.000 đ** (Đọc 7000MB/s, có DRAM Cache xịn)
* 💾 **Samsung 990 PRO 1TB PCIe Gen 4.0 x4** — **2.890.000 đ** (Đỉnh cao tốc độ 7450MB/s, siêu bền)

Khuyên dùng SSD Kingston KC3000 hoặc Samsung 990 Pro nếu bạn thường xuyên render video nặng hoặc load game AAA.`,
      suggestions: [
        'Nên chọn Kingston NV2 1TB hay KC3000 1TB?',
        'Mainboard H610 có lắp được SSD Gen 4 không?',
        'Thêm SSD Samsung 990 PRO vào giỏ',
      ],
      is_fallback: true,
    };
  }

  // 6. Phân loại theo Nguồn (PSU)
  if (lower.includes('nguồn') || lower.includes('psu') || lower.includes('công suất') || lower.includes('watt')) {
    return {
      reply: `Các mẫu **Nguồn máy tính (PSU) chính hãng sẵn kho SmartPC**:

* ⚡ **MSI MAG A550BN 550W 80 Plus Bronze** — **1.090.000 đ** (Phù hợp i5-12400F + RX 6600)
* ⚡ **Corsair CV650 650W 80 Plus Bronze** — **1.490.000 đ** (Kéo mượt RTX 4060, i5-13400)
* ⚡ **Corsair RM750e 750W 80 Plus Gold ATX 3.0 Full Modular** — **2.890.000 đ** (Chuẩn PCIe 5.0, kéo tốt RTX 4070 Super)
* ⚡ **Corsair RM850e 850W 80 Plus Gold ATX 3.0 Full Modular** — **3.390.000 đ** (Công suất dồi dào cho RTX 4070 Ti Super + Ryzen 7)

💡 **Quy tắc an toàn:** Luôn chọn nguồn có công suất thực dư ra 20-30% so với tổng TDP hệ thống để nguồn chạy êm và bền bỉ nhất.`,
      suggestions: [
        'Nguồn Corsair 650W có đủ cho RTX 4060?',
        'Full Modular khác nguồn thường chỗ nào?',
        'Thêm nguồn RM750e vào cấu hình PC',
      ],
      is_fallback: true,
    };
  }

  // 7. Phân loại theo Vỏ Case / Tản nhiệt
  if (lower.includes('case') || lower.includes('vỏ') || lower.includes('tản nhiệt') || lower.includes('fan')) {
    return {
      reply: `SmartPC có sẵn đầy đủ **Vỏ Case & Tản nhiệt CPU**:

**Vỏ Case thời trang, luồng gió thoáng:**
* 📦 **Xigmatek NYX 3F Micro-ATX** (kèm 3 fan RGB) — **690.000 đ**
* 📦 **Montech AIR 100 ARGB Black** (kèm 4 fan ARGB) — **1.190.000 đ**
* 📦 **NZXT H5 Flow RGB Black** (Kính cường lực cao cấp) — **2.590.000 đ**
* 📦 **Lian Li O11 Dynamic EVO Black** (Showroom bể cá 2 mặt kính) — **3.990.000 đ**

**Tản nhiệt CPU mát mẻ:**
* ❄️ **Thermalright Assassin X 120 SE ARGB** (Tản khí 4 ống đồng) — **390.000 đ**
* ❄️ **DeepCool AK620 Digital Black** (Tản khí tháp đôi có màn hình số) — **1.690.000 đ**
* ❄️ **AIO Thermalright Aqua Elite 240 ARGB** (Tản nước 240mm) — **1.290.000 đ**
* ❄️ **AIO DeepCool LT720 360mm** (Bơm Gen 4 mặt vô cực) — **3.490.000 đ**
* ❄️ **AIO NZXT Kraken 360 RGB Black** (Màn LCD 1.54 inch hiển thị nhiệt độ) — **4.790.000 đ**`,
      suggestions: [
        'Case Montech AIR 100 có lắp vừa tản DeepCool AK620 không?',
        'Tản khí Assassin X 120 có cân nổi i5-13600K?',
        'Xem kích thước VGA tối đa của Lian Li O11',
      ],
      is_fallback: true,
    };
  }

  // 8. Trả lời mặc định hữu ích cho các câu hỏi tổng quát khác
  return {
    reply: `Chào bạn! Mình là **Chuyên gia AI SmartPC** — trợ lý tư vấn phần cứng máy tính.

SmartPC hiện có sẵn kho đầy đủ linh kiện chính hãng được kiểm định tương thích 100%:
* 🖥️ **CPU:** Intel Core i5-12400F, i5-13600K, AMD Ryzen 5 5600X, Ryzen 7 7800X3D.
* 🎮 **GPU:** ASUS Dual RX 6600, RTX 3060 12GB, RTX 4060 8GB, RTX 4070 Super, RTX 4070 Ti Super.
* ⚡ **Mainboard & RAM:** H610, B760, B650; RAM Kingston / Corsair DDR4 & DDR5 từ 8GB đến 32GB.
* 🔌 **Nguồn & Tản nhiệt:** Corsair RM750e Gold, DeepCool AK620, AIO NZXT Kraken 360.

Bạn đang tìm linh kiện cụ thể nào hay cần lên cấu hình trọn gói theo mức ngân sách bao nhiêu? Hãy cho mình biết nhu cầu để mình tư vấn cấu hình chuẩn xác nhất nhé!`,
    suggestions: [
      'Tư vấn PC Gaming tầm giá 15 - 20 triệu',
      'Card đồ họa nào chiến mượt LOL và FC Online?',
      'Kiểm tra độ tương thích giữa CPU và Mainboard',
    ],
    is_fallback: true,
  };
}
