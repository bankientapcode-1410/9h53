import {
  CategoryTreeDTO,
  AdminProductDTO,
  SpecMetadataDTO,
} from '../features/product-catalog/types/product.types';

export const MOCK_CATEGORY_TREE: CategoryTreeDTO[] = [
  {
    category_id: 'g0000001-0000-0000-0000-000000000001',
    category_code: 'PC_CORE',
    category_name: 'Linh kiện cốt lõi',
    description: 'CPU, Bo mạch chủ, RAM, Card đồ họa',
    parent_category_id: null,
    has_schema: false,
    children: [
      {
        category_id: 'c0000001-0000-0000-0000-000000000001',
        category_code: 'CPU',
        category_name: 'Bộ vi xử lý (CPU)',
        description: 'Bộ xử lý trung tâm Intel & AMD',
        parent_category_id: 'g0000001-0000-0000-0000-000000000001',
        has_schema: true,
        children: [],
      },
      {
        category_id: 'c0000001-0000-0000-0000-000000000002',
        category_code: 'MOTHERBOARD',
        category_name: 'Bo mạch chủ (Mainboard)',
        description: 'Mainboard chuẩn ATX, mATX, ITX các dòng chipset',
        parent_category_id: 'g0000001-0000-0000-0000-000000000001',
        has_schema: true,
        children: [],
      },
      {
        category_id: 'c0000001-0000-0000-0000-000000000003',
        category_code: 'RAM',
        category_name: 'Bộ nhớ trong (RAM)',
        description: 'Bộ nhớ DDR4, DDR5 tốc độ cao',
        parent_category_id: 'g0000001-0000-0000-0000-000000000001',
        has_schema: true,
        children: [],
      },
      {
        category_id: 'c0000001-0000-0000-0000-000000000004',
        category_code: 'GPU',
        category_name: 'Card màn hình (VGA)',
        description: 'Card xử lý đồ họa NVIDIA RTX, AMD Radeon',
        parent_category_id: 'g0000001-0000-0000-0000-000000000001',
        has_schema: true,
        children: [],
      },
    ],
  },
  {
    category_id: 'g0000001-0000-0000-0000-000000000002',
    category_code: 'STORAGE_DEVICES',
    category_name: 'Thiết bị lưu trữ',
    description: 'Ổ cứng SSD NVMe M.2 & SATA',
    parent_category_id: null,
    has_schema: false,
    children: [
      {
        category_id: 'c0000001-0000-0000-0000-000000000005',
        category_code: 'SSD_M2',
        category_name: 'Ổ cứng SSD M.2 NVMe',
        description: 'Tốc độ đọc ghi cực cao chuẩn PCIe 3.0, 4.0, 5.0',
        parent_category_id: 'g0000001-0000-0000-0000-000000000002',
        has_schema: true,
        children: [],
      },
    ],
  },
  {
    category_id: 'g0000001-0000-0000-0000-000000000003',
    category_code: 'POWER_COOLING_CASE',
    category_name: 'Nguồn, Tản nhiệt & Vỏ máy',
    description: 'PSU, Case và Tản nhiệt CPU nước/khí',
    parent_category_id: null,
    has_schema: false,
    children: [
      {
        category_id: 'c0000001-0000-0000-0000-000000000006',
        category_code: 'PSU',
        category_name: 'Nguồn máy tính (PSU)',
        description: 'Bộ cấp nguồn chuẩn 80 Plus Bronze/Gold/Platinum',
        parent_category_id: 'g0000001-0000-0000-0000-000000000003',
        has_schema: true,
        children: [],
      },
      {
        category_id: 'c0000001-0000-0000-0000-000000000007',
        category_code: 'CASE',
        category_name: 'Vỏ máy tính (Case)',
        description: 'Vỏ case thông gió tối ưu, hỗ trợ đa dạng kích thước mainboard',
        parent_category_id: 'g0000001-0000-0000-0000-000000000003',
        has_schema: true,
        children: [],
      },
      {
        category_id: 'c0000001-0000-0000-0000-000000000008',
        category_code: 'CPU_COOLER',
        category_name: 'Tản nhiệt CPU',
        description: 'Tản nhiệt khí tháp đôi & tản nhiệt nước AIO 240/360',
        parent_category_id: 'g0000001-0000-0000-0000-000000000003',
        has_schema: true,
        children: [],
      },
    ],
  },
];

export const MOCK_SPECS_SCHEMA: Record<string, SpecMetadataDTO> = {
  CPU: {
    category_code: 'CPU',
    category_name: 'Bộ vi xử lý (CPU)',
    has_schema: true,
    fields: [
      { key: 'socket_type', label: 'Socket CPU', type: 'STRING', required: true, filterable: true, allowedValues: ['LGA1700', 'AM5', 'AM4', 'LGA1851'] },
      { key: 'tdp_w', label: 'Điện năng tiêu thụ (TDP)', type: 'NUMBER', required: true, filterable: false, unit: 'W', minValue: 1 },
      { key: 'core_count', label: 'Số nhân (Cores)', type: 'INTEGER', required: true, filterable: true, unit: 'nhân', minValue: 1 },
      { key: 'thread_count', label: 'Số luồng (Threads)', type: 'INTEGER', required: false, filterable: false, unit: 'luồng', minValue: 1 },
      { key: 'integrated_graphics', label: 'Đồ họa tích hợp (iGPU)', type: 'BOOLEAN', required: false, filterable: true },
    ],
  },
  MOTHERBOARD: {
    category_code: 'MOTHERBOARD',
    category_name: 'Bo mạch chủ (Mainboard)',
    has_schema: true,
    fields: [
      { key: 'supported_sockets', label: 'Socket hỗ trợ', type: 'ARRAY_STRING', required: true, filterable: true, allowedValues: ['LGA1700', 'AM5', 'AM4', 'LGA1851'] },
      { key: 'form_factor', label: 'Kích thước (Form Factor)', type: 'STRING', required: true, filterable: true, allowedValues: ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'] },
      { key: 'supported_memory_types', label: 'Chuẩn RAM hỗ trợ', type: 'ARRAY_STRING', required: true, filterable: false, allowedValues: ['DDR4', 'DDR5'] },
      { key: 'ram_slots', label: 'Số khe cắm RAM', type: 'INTEGER', required: true, filterable: false, minValue: 1 },
      { key: 'max_ram_gb', label: 'Dung lượng RAM tối đa', type: 'INTEGER', required: true, filterable: false, unit: 'GB', minValue: 1 },
      { key: 'm2_slots', label: 'Số khe cắm M.2', type: 'INTEGER', required: true, filterable: false, minValue: 0 },
      { key: 'chipset', label: 'Chipset', type: 'STRING', required: false, filterable: true },
    ],
  },
  RAM: {
    category_code: 'RAM',
    category_name: 'Bộ nhớ trong (RAM)',
    has_schema: true,
    fields: [
      { key: 'memory_type', label: 'Chuẩn bộ nhớ', type: 'STRING', required: true, filterable: true, allowedValues: ['DDR4', 'DDR5'] },
      { key: 'capacity_gb', label: 'Tổng dung lượng', type: 'INTEGER', required: true, filterable: true, unit: 'GB', minValue: 4 },
      { key: 'bus_speed_mhz', label: 'Tốc độ Bus', type: 'INTEGER', required: true, filterable: false, unit: 'MHz', minValue: 1600 },
      { key: 'modules_per_kit', label: 'Số thanh trong kit', type: 'INTEGER', required: true, filterable: false, minValue: 1 },
    ],
  },
  GPU: {
    category_code: 'GPU',
    category_name: 'Card màn hình (VGA)',
    has_schema: true,
    fields: [
      { key: 'vram_gb', label: 'Dung lượng VRAM', type: 'INTEGER', required: true, filterable: true, unit: 'GB', minValue: 2 },
      { key: 'length_mm', label: 'Chiều dài card', type: 'NUMBER', required: true, filterable: false, unit: 'mm', minValue: 50 },
      { key: 'tdp_w', label: 'Công suất tiêu thụ (TDP)', type: 'NUMBER', required: true, filterable: false, unit: 'W', minValue: 20 },
      { key: 'recommended_psu_w', label: 'Nguồn khuyến nghị', type: 'INTEGER', required: false, filterable: false, unit: 'W' },
      { key: 'pcie_gen', label: 'Chuẩn giao tiếp PCIe', type: 'NUMBER', required: false, filterable: false },
      { key: 'vram_type', label: 'Loại VRAM', type: 'STRING', required: false, filterable: false },
    ],
  },
  SSD_M2: {
    category_code: 'SSD_M2',
    category_name: 'Ổ cứng SSD M.2 NVMe',
    has_schema: true,
    fields: [
      { key: 'interface_type', label: 'Chuẩn kết nối', type: 'STRING', required: true, filterable: true, allowedValues: ['NVMe PCIe 3.0', 'NVMe PCIe 4.0', 'NVMe PCIe 5.0'] },
      { key: 'capacity_gb', label: 'Dung lượng ổ cứng', type: 'INTEGER', required: true, filterable: true, unit: 'GB', minValue: 120 },
      { key: 'read_speed_mbps', label: 'Tốc độ đọc tối đa', type: 'INTEGER', required: false, filterable: false, unit: 'MB/s' },
      { key: 'tdp_w', label: 'Công suất', type: 'NUMBER', required: false, filterable: false, unit: 'W' },
    ],
  },
  PSU: {
    category_code: 'PSU',
    category_name: 'Nguồn máy tính (PSU)',
    has_schema: true,
    fields: [
      { key: 'rated_wattage_w', label: 'Công suất định mức', type: 'INTEGER', required: true, filterable: true, unit: 'W', minValue: 200 },
      { key: 'efficiency_rating', label: 'Chuẩn hiệu suất', type: 'STRING', required: false, filterable: true, allowedValues: ['80 Plus Bronze', '80 Plus Gold', '80 Plus Platinum'] },
      { key: 'form_factor', label: 'Kích cỡ nguồn', type: 'STRING', required: false, filterable: false, allowedValues: ['ATX', 'SFX'] },
    ],
  },
  CASE: {
    category_code: 'CASE',
    category_name: 'Vỏ máy tính (Case)',
    has_schema: true,
    fields: [
      { key: 'supported_form_factors', label: 'Hỗ trợ mainboard', type: 'ARRAY_STRING', required: true, filterable: false, allowedValues: ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'] },
      { key: 'max_gpu_length_mm', label: 'Hỗ trợ VGA tối đa', type: 'NUMBER', required: true, filterable: false, unit: 'mm', minValue: 100 },
      { key: 'max_cooler_height_mm', label: 'Chiều cao tản tối đa', type: 'NUMBER', required: false, filterable: false, unit: 'mm' },
    ],
  },
  CPU_COOLER: {
    category_code: 'CPU_COOLER',
    category_name: 'Tản nhiệt CPU',
    has_schema: true,
    fields: [
      { key: 'supported_sockets', label: 'Socket hỗ trợ', type: 'ARRAY_STRING', required: true, filterable: true, allowedValues: ['LGA1700', 'AM5', 'AM4', 'LGA1851'] },
      { key: 'cooler_type', label: 'Loại tản nhiệt', type: 'STRING', required: true, filterable: true, allowedValues: ['AIR', 'AIO_240', 'AIO_280', 'AIO_360'] },
      { key: 'height_mm', label: 'Chiều cao tản', type: 'NUMBER', required: false, filterable: false, unit: 'mm' },
    ],
  },
};

export const MOCK_PRODUCTS: AdminProductDTO[] = [
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910001",
    "name": "Card màn hình ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Kiến trúc NVIDIA Ada Lovelace tân tiến, trang bị 2 quạt công nghệ Axial-tech với vòng chắn giúp tăng áp suất khí, chiến mượt mà mọi game 1080p/2K.",
    "price": 7990000,
    "stock_quantity": 15,
    "benchmark_score": 78.5,
    "image_url": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [
      "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80"
    ],
    "specs": {
      "vram_gb": 8,
      "vram_type": "GDDR6",
      "length_mm": 227.2,
      "tdp_w": 115,
      "recommended_psu_w": 550,
      "pcie_gen": 4,
      "outputs": [
        "HDMI 2.1a",
        "DisplayPort 1.4a x3"
      ]
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-18T10:30:00Z",
    "updated_at": "2026-10-18T10:30:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910002",
    "name": "Card màn hình MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM",
    "brand": "MSI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Cực phẩm 16GB VRAM xử lý 2K/4K max settings, tản nhiệt TRI FROZR 3 với quạt TORX Fan 5.0 tối ưu luồng gió.",
    "price": 24490000,
    "stock_quantity": 8,
    "benchmark_score": 94.2,
    "image_url": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "vram_gb": 16,
      "vram_type": "GDDR6X",
      "length_mm": 307,
      "tdp_w": 285,
      "recommended_psu_w": 750,
      "pcie_gen": 4
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 1,
    "created_at": "2026-10-18T11:00:00Z",
    "updated_at": "2026-10-18T11:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910014",
    "name": "Card màn hình ASUS Dual Radeon RX 6600 V2 8GB GDDR6",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Lựa chọn card đồ họa ngon bổ rẻ số 1 cho game thủ Esports, chiến max setting Liên Minh Huyền Thoại (LOL) 200+ FPS, Valorant, FO4, CS2 cực mát.",
    "price": 5390000,
    "stock_quantity": 26,
    "benchmark_score": 68,
    "image_url": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "vram_gb": 8,
      "vram_type": "GDDR6",
      "length_mm": 243,
      "tdp_w": 132,
      "recommended_psu_w": 500,
      "pcie_gen": 4
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T09:00:00Z",
    "updated_at": "2026-10-19T09:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910015",
    "name": "Card màn hình ASUS Dual GeForce RTX 3060 White OC 12GB GDDR6",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Phiên bản màu trắng tinh tế trang bị 12GB VRAM dung lượng lớn, đáp ứng tốt đồ họa 3D, Premiere, AI tạo ảnh và chiến mượt game FPS, MOBA.",
    "price": 7290000,
    "stock_quantity": 19,
    "benchmark_score": 72,
    "image_url": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "vram_gb": 12,
      "vram_type": "GDDR6",
      "length_mm": 200,
      "tdp_w": 170,
      "recommended_psu_w": 550,
      "pcie_gen": 4
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T09:10:00Z",
    "updated_at": "2026-10-19T09:10:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910016",
    "name": "Card màn hình ASUS TUF Gaming GeForce RTX 4070 SUPER 12GB GDDR6X",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Dòng TUF Gaming siêu bền đạt chuẩn quân đội, tản nhiệt 3 quạt Axial-tech làm mát đỉnh cao, cân tốt mọi tựa game AAA ở độ phân giải 2K 144Hz.",
    "price": 18990000,
    "stock_quantity": 11,
    "benchmark_score": 91,
    "image_url": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "vram_gb": 12,
      "vram_type": "GDDR6X",
      "length_mm": 301,
      "tdp_w": 220,
      "recommended_psu_w": 750,
      "pcie_gen": 4
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T09:20:00Z",
    "updated_at": "2026-10-19T09:20:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910003",
    "name": "Bộ vi xử lý Intel Core i5-13600K (Up to 5.1GHz, 14 Cores 20 Threads, 24MB Cache)",
    "brand": "INTEL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "Vi xử lý Raptor Lake thế hệ 13 socket LGA1700, hỗ trợ cả RAM DDR4 và DDR5, hiệu năng render và game vượt trội.",
    "price": 7490000,
    "stock_quantity": 25,
    "benchmark_score": 88,
    "image_url": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "socket_type": "LGA1700",
      "tdp_w": 125,
      "core_count": 14,
      "thread_count": 20,
      "integrated_graphics": true
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-18T09:15:00Z",
    "updated_at": "2026-10-18T09:15:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910004",
    "name": "Bộ vi xử lý AMD Ryzen 7 7800X3D (4.2GHz~5.0GHz, 8 Cores 16 Threads, 104MB Cache, Socket AM5)",
    "brand": "AMD",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "Vua vi xử lý Gaming thế giới với công nghệ 3D V-Cache độc quyền, tiết kiệm điện năng cực tốt trên nền tảng AM5 DDR5.",
    "price": 10490000,
    "stock_quantity": 12,
    "benchmark_score": 96.5,
    "image_url": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "socket_type": "AM5",
      "tdp_w": 120,
      "core_count": 8,
      "thread_count": 16,
      "integrated_graphics": true
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 2,
    "created_at": "2026-10-18T14:20:00Z",
    "updated_at": "2026-10-18T14:20:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910011",
    "name": "Bộ vi xử lý Intel Core i3-12100F (Up to 4.3GHz, 4 Cores 8 Threads, 12MB Cache, Socket LGA1700)",
    "brand": "INTEL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "CPU quốc dân phân khúc phổ thông giá rẻ, 4 nhân 8 luồng hiệu năng đơn nhân khỏe, chiến mượt mà Liên Minh Huyền Thoại, FO4, Valorant, CS2.",
    "price": 2190000,
    "stock_quantity": 45,
    "benchmark_score": 65,
    "image_url": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "socket_type": "LGA1700",
      "tdp_w": 58,
      "core_count": 4,
      "thread_count": 8,
      "integrated_graphics": false
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T10:00:00Z",
    "updated_at": "2026-10-19T10:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910012",
    "name": "Bộ vi xử lý Intel Core i5-12400F (Up to 4.4GHz, 6 Cores 12 Threads, 18MB Cache, Socket LGA1700)",
    "brand": "INTEL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "Vua phân khúc tầm trung giá tốt, 6 nhân 12 luồng mạnh mẽ, cân tốt các dòng card RX 6600, RTX 3060, RTX 4060 mà không lo nghẽn cổ chai.",
    "price": 3190000,
    "stock_quantity": 38,
    "benchmark_score": 75,
    "image_url": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "socket_type": "LGA1700",
      "tdp_w": 65,
      "core_count": 6,
      "thread_count": 12,
      "integrated_graphics": false
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T10:10:00Z",
    "updated_at": "2026-10-19T10:10:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910013",
    "name": "Bộ vi xử lý AMD Ryzen 5 7600 (Up to 5.1GHz, 6 Cores 12 Threads, 32MB Cache, Socket AM5)",
    "brand": "AMD",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "Vi xử lý kiến trúc Zen 4 tiến trình 5nm vượt bậc, hỗ trợ RAM DDR5 và PCIe 5.0, tích hợp sẵn nhân đồ họa AMD Radeon Graphics tiện lợi.",
    "price": 5290000,
    "stock_quantity": 22,
    "benchmark_score": 83.5,
    "image_url": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "socket_type": "AM5",
      "tdp_w": 65,
      "core_count": 6,
      "thread_count": 12,
      "integrated_graphics": true
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T10:20:00Z",
    "updated_at": "2026-10-19T10:20:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910005",
    "name": "Bo mạch chủ ASUS ROG STRIX B760-A GAMING WIFI D4",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Bo mạch chủ tone trắng sang trọng, hỗ trợ CPU Intel Gen 12/13/14 LGA1700, Wi-Fi 6E và 3 khe M.2 NVMe PCIe 4.0.",
    "price": 5490000,
    "stock_quantity": 12,
    "benchmark_score": 82,
    "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_sockets": [
        "LGA1700"
      ],
      "form_factor": "ATX",
      "supported_memory_types": [
        "DDR4"
      ],
      "ram_slots": 4,
      "max_ram_gb": 128,
      "m2_slots": 3,
      "chipset": "B760"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-18T12:00:00Z",
    "updated_at": "2026-10-18T12:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910017",
    "name": "Bo mạch chủ ASUS PRIME H610M-K D4",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Bo mạch chủ phổ thông socket LGA1700, hỗ trợ CPU Intel Gen 12/13/14, 2 khe cắm RAM DDR4, cổng xuất hình HDMI và D-Sub.",
    "price": 1790000,
    "stock_quantity": 40,
    "benchmark_score": 60,
    "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_sockets": [
        "LGA1700"
      ],
      "form_factor": "Micro-ATX",
      "supported_memory_types": [
        "DDR4"
      ],
      "ram_slots": 2,
      "max_ram_gb": 64,
      "m2_slots": 1,
      "chipset": "H610"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T11:00:00Z",
    "updated_at": "2026-10-19T11:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910018",
    "name": "Bo mạch chủ MSI PRO B760M-A WIFI DDR4",
    "brand": "MSI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Mainboard quốc dân tầm trung với tản VRM dày dặn, hỗ trợ Wi-Fi 6E, 4 khe RAM DDR4 và 2 khe cắm SSD M.2 PCIe 4.0 tốc độ cao.",
    "price": 3390000,
    "stock_quantity": 28,
    "benchmark_score": 76,
    "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_sockets": [
        "LGA1700"
      ],
      "form_factor": "Micro-ATX",
      "supported_memory_types": [
        "DDR4"
      ],
      "ram_slots": 4,
      "max_ram_gb": 128,
      "m2_slots": 2,
      "chipset": "B760"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T11:10:00Z",
    "updated_at": "2026-10-19T11:10:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910019",
    "name": "Bo mạch chủ MSI MAG B650 TOMAHAWK WIFI",
    "brand": "MSI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Dòng bo mạch chủ Gaming đỉnh cao cho socket AM5 AMD Ryzen 7000/8000 series, mạch nguồn 14+2+1 pha mạnh mẽ, 3 khe M.2 Shield Frozr.",
    "price": 5890000,
    "stock_quantity": 17,
    "benchmark_score": 87,
    "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_sockets": [
        "AM5"
      ],
      "form_factor": "ATX",
      "supported_memory_types": [
        "DDR5"
      ],
      "ram_slots": 4,
      "max_ram_gb": 128,
      "m2_slots": 3,
      "chipset": "B650"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T11:20:00Z",
    "updated_at": "2026-10-19T11:20:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910006",
    "name": "RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz Black",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Kit RAM DDR5 hiệu năng cao với dải LED RGB sống động, hỗ trợ Intel XMP 3.0 và AMD EXPO.",
    "price": 3290000,
    "stock_quantity": 20,
    "benchmark_score": 89,
    "image_url": "https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "memory_type": "DDR5",
      "capacity_gb": 32,
      "bus_speed_mhz": 6000,
      "modules_per_kit": 2
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-18T13:00:00Z",
    "updated_at": "2026-10-18T13:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910020",
    "name": "RAM Kingston Fury Beast Black 8GB DDR4 3200MHz",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Thanh RAM chuẩn DDR4 8GB độ tương thích cao, tản nhiệt nhôm đen đơn giản mà tinh tế, tự động ép xung Plug N Play mượt mà.",
    "price": 550000,
    "stock_quantity": 60,
    "benchmark_score": 65,
    "image_url": "https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "memory_type": "DDR4",
      "capacity_gb": 8,
      "bus_speed_mhz": 3200,
      "modules_per_kit": 1
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T12:00:00Z",
    "updated_at": "2026-10-19T12:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910021",
    "name": "RAM Kingston Fury Beast RGB 16GB (2x8GB) DDR4 3200MHz",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Bộ kit RAM đôi chạy Dual Channel tối ưu băng thông, tích hợp dải đèn LED RGB mượt mà tương thích Asus Aura Sync, MSI Mystic Light.",
    "price": 1190000,
    "stock_quantity": 45,
    "benchmark_score": 75,
    "image_url": "https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "memory_type": "DDR4",
      "capacity_gb": 16,
      "bus_speed_mhz": 3200,
      "modules_per_kit": 2
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T12:10:00Z",
    "updated_at": "2026-10-19T12:10:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910022",
    "name": "RAM Corsair Vengeance LPX 32GB (2x16GB) DDR4 3200MHz Black",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Dung lượng lớn 32GB đáp ứng đa nhiệm mượt mà, mở hàng trăm tab trình duyệt, thiết kế tản nhiệt cấu hình thấp không lo cấn tản khí.",
    "price": 1890000,
    "stock_quantity": 30,
    "benchmark_score": 80,
    "image_url": "https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "memory_type": "DDR4",
      "capacity_gb": 32,
      "bus_speed_mhz": 3200,
      "modules_per_kit": 2
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T12:20:00Z",
    "updated_at": "2026-10-19T12:20:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910023",
    "name": "RAM Kingston Fury Beast Black 16GB (1x16GB) DDR5 5600MHz",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "RAM DDR5 tốc độ cao 5600MHz, tích hợp chip quản lý nguồn on-die PMIC và tính năng sửa lỗi On-die ECC giúp hệ thống vận hành bền bỉ.",
    "price": 1490000,
    "stock_quantity": 25,
    "benchmark_score": 84,
    "image_url": "https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "memory_type": "DDR5",
      "capacity_gb": 16,
      "bus_speed_mhz": 5600,
      "modules_per_kit": 1
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T12:30:00Z",
    "updated_at": "2026-10-19T12:30:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910007",
    "name": "Ổ cứng SSD Samsung 990 PRO 1TB M.2 PCIe Gen 4.0 x4 NVMe",
    "brand": "SAMSUNG",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000005",
      "category_code": "SSD_M2",
      "category_name": "Ổ cứng SSD M.2 NVMe"
    },
    "description": "Tốc độ đọc lên tới 7450 MB/s và ghi 6900 MB/s, dẫn đầu về độ tin cậy và tốc độ tải game cũng như render video nặng.",
    "price": 2890000,
    "stock_quantity": 35,
    "benchmark_score": 95,
    "image_url": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "interface_type": "NVMe PCIe 4.0",
      "capacity_gb": 1000,
      "read_speed_mbps": 7450,
      "tdp_w": 8.5
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-18T08:00:00Z",
    "updated_at": "2026-10-18T08:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910024",
    "name": "Ổ cứng SSD Kingston NV2 500GB M.2 2280 NVMe PCIe Gen 4.0 x4",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000005",
      "category_code": "SSD_M2",
      "category_name": "Ổ cứng SSD M.2 NVMe"
    },
    "description": "Ổ cứng NVMe Gen4 giá mềm nhất cho người dùng phổ thông, tốc độ đọc 3500MB/s khởi động Windows và load game cực nhanh trong tích tắc.",
    "price": 1090000,
    "stock_quantity": 50,
    "benchmark_score": 72,
    "image_url": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "interface_type": "NVMe PCIe 4.0",
      "capacity_gb": 500,
      "read_speed_mbps": 3500,
      "tdp_w": 3.5
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T13:00:00Z",
    "updated_at": "2026-10-19T13:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910025",
    "name": "Ổ cứng SSD Kingston NV2 1TB M.2 2280 NVMe PCIe Gen 4.0 x4",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000005",
      "category_code": "SSD_M2",
      "category_name": "Ổ cứng SSD M.2 NVMe"
    },
    "description": "Dung lượng 1TB thoải mái cài hệ điều hành, phần mềm đồ họa và lưu trữ thư viện game đồ sộ với tốc độ đọc 3500MB/s.",
    "price": 1690000,
    "stock_quantity": 42,
    "benchmark_score": 77,
    "image_url": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "interface_type": "NVMe PCIe 4.0",
      "capacity_gb": 1000,
      "read_speed_mbps": 3500,
      "tdp_w": 4
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T13:10:00Z",
    "updated_at": "2026-10-19T13:10:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910026",
    "name": "Ổ cứng SSD Kingston KC3000 1TB M.2 PCIe Gen 4.0 x4 NVMe",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000005",
      "category_code": "SSD_M2",
      "category_name": "Ổ cứng SSD M.2 NVMe"
    },
    "description": "Trang bị controller Phison E18 và 3D TLC NAND cao cấp, tốc độ đọc 7000MB/s, kèm miếng tản nhiệt nhôm graphene tản nhiệt hiệu quả cao.",
    "price": 2390000,
    "stock_quantity": 32,
    "benchmark_score": 93,
    "image_url": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "interface_type": "NVMe PCIe 4.0",
      "capacity_gb": 1000,
      "read_speed_mbps": 7000,
      "tdp_w": 5
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T13:20:00Z",
    "updated_at": "2026-10-19T13:20:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910008",
    "name": "Nguồn máy tính Corsair RM850e 850W 80 Plus Gold Full Modular",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000006",
      "category_code": "PSU",
      "category_name": "Nguồn máy tính (PSU)"
    },
    "description": "Chuẩn ATX 3.0 PCIe 5.0 12VHPWR sẵn sàng cho card RTX 40 series, chứng nhận 80 Plus Gold siêu êm ái.",
    "price": 3390000,
    "stock_quantity": 18,
    "benchmark_score": 90,
    "image_url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "rated_wattage_w": 850,
      "efficiency_rating": "80 Plus Gold",
      "form_factor": "ATX"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-18T15:00:00Z",
    "updated_at": "2026-10-18T15:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910027",
    "name": "Nguồn máy tính MSI MAG A550BN 550W 80 Plus Bronze",
    "brand": "MSI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000006",
      "category_code": "PSU",
      "category_name": "Nguồn máy tính (PSU)"
    },
    "description": "Bộ nguồn quốc dân 550W chuẩn 80 Plus Bronze với tụ cao cấp, quạt 120mm độ ồn thấp, bảo vệ quá dòng OCP/OVP/OPP toàn diện.",
    "price": 1090000,
    "stock_quantity": 35,
    "benchmark_score": 68,
    "image_url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "rated_wattage_w": 550,
      "efficiency_rating": "80 Plus Bronze",
      "form_factor": "ATX"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T14:00:00Z",
    "updated_at": "2026-10-19T14:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910028",
    "name": "Nguồn máy tính Corsair CV650 650W 80 Plus Bronze",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000006",
      "category_code": "PSU",
      "category_name": "Nguồn máy tính (PSU)"
    },
    "description": "Nguồn công suất thực 650W chuẩn 80 Plus Bronze phù hợp cho dàn máy trang bị RX 6600, RTX 3060, RTX 4060, quạt tản nhiệt làm mát tự động theo tải.",
    "price": 1490000,
    "stock_quantity": 28,
    "benchmark_score": 74,
    "image_url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "rated_wattage_w": 650,
      "efficiency_rating": "80 Plus Bronze",
      "form_factor": "ATX"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T14:10:00Z",
    "updated_at": "2026-10-19T14:10:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910029",
    "name": "Nguồn máy tính Corsair RM750e 750W 80 Plus Gold ATX 3.0 Full Modular",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000006",
      "category_code": "PSU",
      "category_name": "Nguồn máy tính (PSU)"
    },
    "description": "Bộ nguồn 750W chuẩn ATX 3.0 với cáp 12VHPWR cấp nguồn trực tiếp cho GPU đời mới, chứng nhận hiệu suất 80 Plus Gold, dây cáp rời tiện lợi.",
    "price": 2890000,
    "stock_quantity": 24,
    "benchmark_score": 88,
    "image_url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "rated_wattage_w": 750,
      "efficiency_rating": "80 Plus Gold",
      "form_factor": "ATX"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T14:20:00Z",
    "updated_at": "2026-10-19T14:20:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910009",
    "name": "Vỏ máy tính NZXT H5 Flow RGB Black",
    "brand": "NZXT",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000007",
      "category_code": "CASE",
      "category_name": "Vỏ máy tính (Case)"
    },
    "description": "Thiết kế thông thoáng tối đa luồng khí, quạt chuyên dụng làm mát trực tiếp VGA, kính cường lực cao cấp.",
    "price": 2590000,
    "stock_quantity": 14,
    "benchmark_score": 85,
    "image_url": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_form_factors": [
        "ATX",
        "Micro-ATX",
        "Mini-ITX"
      ],
      "max_gpu_length_mm": 365,
      "max_cooler_height_mm": 165
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-18T16:00:00Z",
    "updated_at": "2026-10-18T16:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910030",
    "name": "Vỏ máy tính Xigmatek NYX 3F Micro-ATX kèm 3 quạt RGB",
    "brand": "XIGMATEK",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000007",
      "category_code": "CASE",
      "category_name": "Vỏ máy tính (Case)"
    },
    "description": "Vỏ case bể cá nhỏ gọn giá sinh viên, tặng kèm sẵn 3 quạt làm mát LED RGB rực rỡ, mặt hông kính cường lực trong suốt khoe trọn linh kiện.",
    "price": 690000,
    "stock_quantity": 40,
    "benchmark_score": 65,
    "image_url": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_form_factors": [
        "Micro-ATX",
        "Mini-ITX"
      ],
      "max_gpu_length_mm": 320,
      "max_cooler_height_mm": 160
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T15:00:00Z",
    "updated_at": "2026-10-19T15:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910031",
    "name": "Vỏ máy tính Montech AIR 100 ARGB Black kèm 4 quạt ARGB",
    "brand": "MONTECH",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000007",
      "category_code": "CASE",
      "category_name": "Vỏ máy tính (Case)"
    },
    "description": "Mặt trước dạng lưới lượn sóng hút gió thông thoáng, đi kèm 4 fan ARGB xịn xò có hub điều tốc, cửa kính đóng mở nam châm cao cấp.",
    "price": 1190000,
    "stock_quantity": 25,
    "benchmark_score": 78,
    "image_url": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_form_factors": [
        "Micro-ATX",
        "Mini-ITX"
      ],
      "max_gpu_length_mm": 330,
      "max_cooler_height_mm": 161
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T15:10:00Z",
    "updated_at": "2026-10-19T15:10:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910032",
    "name": "Vỏ máy tính Lian Li O11 Dynamic EVO Black",
    "brand": "LIAN LI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000007",
      "category_code": "CASE",
      "category_name": "Vỏ máy tính (Case)"
    },
    "description": "Biểu tượng vỏ case bể cá 2 mặt kính cường lực, khả năng đảo ngược chiều linh kiện độc đáo, hỗ trợ tối đa 3 rad tản nhiệt nước 360mm.",
    "price": 3990000,
    "stock_quantity": 12,
    "benchmark_score": 95,
    "image_url": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_form_factors": [
        "ATX",
        "Micro-ATX",
        "Mini-ITX",
        "E-ATX"
      ],
      "max_gpu_length_mm": 422,
      "max_cooler_height_mm": 167
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T15:20:00Z",
    "updated_at": "2026-10-19T15:20:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910010",
    "name": "Tản nhiệt nước AIO DeepCool LT720 360mm Black",
    "brand": "DEEPCOOL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000008",
      "category_code": "CPU_COOLER",
      "category_name": "Tản nhiệt CPU"
    },
    "description": "Bơm nước thế hệ thứ 4 công suất cao, mặt gương vô cực đa chiều tuyệt đẹp, làm mát tối ưu cho CPU Intel & AMD.",
    "price": 3490000,
    "stock_quantity": 9,
    "benchmark_score": 91.5,
    "image_url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_sockets": [
        "LGA1700",
        "AM5",
        "AM4"
      ],
      "cooler_type": "AIO_360",
      "height_mm": 52
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-18T17:00:00Z",
    "updated_at": "2026-10-18T17:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910033",
    "name": "Tản nhiệt khí Thermalright Assassin X 120 Refined SE ARGB",
    "brand": "THERMALRIGHT",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000008",
      "category_code": "CPU_COOLER",
      "category_name": "Tản nhiệt CPU"
    },
    "description": "Tản nhiệt khí tháp đơn 4 ống đồng AGHP chống trọng lực, hiệu năng tản nhiệt vượt tầm giá, quạt ARGB 120mm êm ái.",
    "price": 390000,
    "stock_quantity": 55,
    "benchmark_score": 70,
    "image_url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_sockets": [
        "LGA1700",
        "AM5",
        "AM4"
      ],
      "cooler_type": "AIR",
      "height_mm": 148
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T16:00:00Z",
    "updated_at": "2026-10-19T16:00:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910034",
    "name": "Tản nhiệt khí DeepCool AK620 Digital Black",
    "brand": "DEEPCOOL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000008",
      "category_code": "CPU_COOLER",
      "category_name": "Tản nhiệt CPU"
    },
    "description": "Tản tháp đôi 6 ống đồng hiệu năng tản nhiệt lên đến 260W TDP, tích hợp màn hình LED kỹ thuật số theo dõi nhiệt độ và mức sử dụng CPU thời gian thực.",
    "price": 1690000,
    "stock_quantity": 25,
    "benchmark_score": 88,
    "image_url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_sockets": [
        "LGA1700",
        "AM5",
        "AM4"
      ],
      "cooler_type": "AIR",
      "height_mm": 162
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T16:10:00Z",
    "updated_at": "2026-10-19T16:10:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910035",
    "name": "Tản nhiệt nước AIO Thermalright Aqua Elite 240 Black ARGB V3",
    "brand": "THERMALRIGHT",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000008",
      "category_code": "CPU_COOLER",
      "category_name": "Tản nhiệt CPU"
    },
    "description": "Tản nhiệt nước All-In-One kích thước két nước 240mm, mặt block hiệu ứng gương vô cực kèm 2 quạt làm mát ARGB áp suất tĩnh cao.",
    "price": 1290000,
    "stock_quantity": 30,
    "benchmark_score": 83,
    "image_url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_sockets": [
        "LGA1700",
        "AM5",
        "AM4"
      ],
      "cooler_type": "AIO_240",
      "height_mm": 52
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T16:20:00Z",
    "updated_at": "2026-10-19T16:20:00Z"
  },
  {
    "product_id": "7f000001-92cb-1428-8192-cb8a37910036",
    "name": "Tản nhiệt nước AIO NZXT Kraken 360 RGB Black",
    "brand": "NZXT",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000008",
      "category_code": "CPU_COOLER",
      "category_name": "Tản nhiệt CPU"
    },
    "description": "Tản AIO cao cấp trang bị màn hình LCD 1.54 inch hiển thị ảnh GIF tùy chỉnh và thông số CPU, bơm Asetek Gen 7 siêu êm ái.",
    "price": 4790000,
    "stock_quantity": 15,
    "benchmark_score": 94,
    "image_url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [],
    "specs": {
      "supported_sockets": [
        "LGA1700",
        "AM5",
        "AM4"
      ],
      "cooler_type": "AIO_360",
      "height_mm": 53
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-10-19T16:30:00Z",
    "updated_at": "2026-10-19T16:30:00Z"
  }
];
