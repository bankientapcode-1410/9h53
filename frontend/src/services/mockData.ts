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
  {
    category_id: 'g0000001-0000-0000-0000-000000000004',
    category_code: 'PERIPHERALS',
    category_name: 'Màn hình & Thiết bị ngoại vi',
    description: 'Màn hình máy tính, bàn phím cơ, chuột gaming cao cấp',
    parent_category_id: null,
    has_schema: false,
    children: [
      {
        category_id: 'c0000001-0000-0000-0000-000000000009',
        category_code: 'MONITOR',
        category_name: 'Màn hình máy tính (Monitor)',
        description: 'Màn hình Gaming, Đồ họa IPS/OLED 144Hz-240Hz',
        parent_category_id: 'g0000001-0000-0000-0000-000000000004',
        has_schema: true,
        children: [],
      },
      {
        category_id: 'c0000001-0000-0000-0000-000000000010',
        category_code: 'KEYBOARD',
        category_name: 'Bàn phím cơ (Keyboard)',
        description: 'Bàn phím cơ Gaming, văn phòng, switch cơ học, wireless',
        parent_category_id: 'g0000001-0000-0000-0000-000000000004',
        has_schema: true,
        children: [],
      },
      {
        category_id: 'c0000001-0000-0000-0000-000000000011',
        category_code: 'MOUSE',
        category_name: 'Chuột máy tính (Mouse)',
        description: 'Chuột gaming không dây/có dây, cảm biến quang học DPI cao',
        parent_category_id: 'g0000001-0000-0000-0000-000000000004',
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
      { key: 'form_factor', label: 'Kích cỡ (Form Factor)', type: 'STRING', required: true, filterable: true, allowedValues: ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'] },
      { key: 'supported_memory_types', label: 'Chuẩn RAM hỗ trợ', type: 'ARRAY_STRING', required: true, filterable: true, allowedValues: ['DDR4', 'DDR5'] },
      { key: 'ram_slots', label: 'Số khe RAM', type: 'INTEGER', required: true, filterable: false, minValue: 2 },
      { key: 'max_ram_gb', label: 'RAM tối đa', type: 'INTEGER', required: false, filterable: false, unit: 'GB' },
      { key: 'm2_slots', label: 'Số khe M.2 NVMe', type: 'INTEGER', required: false, filterable: false, minValue: 1 },
      { key: 'max_pcie_gen', label: 'Chuẩn PCIe cao nhất', type: 'NUMBER', required: false, filterable: false },
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
  MONITOR: {
    category_code: 'MONITOR',
    category_name: 'Màn hình máy tính (Monitor)',
    has_schema: true,
    fields: [
      { key: 'screen_size_inch', label: 'Kích thước màn hình', type: 'NUMBER', required: true, filterable: true, unit: 'inch', minValue: 10 },
      { key: 'resolution', label: 'Độ phân giải', type: 'STRING', required: true, filterable: true, allowedValues: ['FHD (1920x1080)', '2K QHD (2560x1440)', '4K UHD (3840x2160)'] },
      { key: 'refresh_rate_hz', label: 'Tần số quét', type: 'INTEGER', required: true, filterable: true, unit: 'Hz', minValue: 30 },
      { key: 'panel_type', label: 'Tấm nền', type: 'STRING', required: true, filterable: true, allowedValues: ['IPS', 'VA', 'OLED', 'Fast IPS'] },
      { key: 'response_time_ms', label: 'Thời gian phản hồi', type: 'NUMBER', required: false, filterable: false, unit: 'ms', minValue: 0.1 },
    ],
  },
  KEYBOARD: {
    category_code: 'KEYBOARD',
    category_name: 'Bàn phím cơ (Keyboard)',
    has_schema: true,
    fields: [
      { key: 'connection_type', label: 'Chuẩn kết nối', type: 'STRING', required: true, filterable: true, allowedValues: ['Wired', 'Wireless', 'Bluetooth / Wireless / Type-C'] },
      { key: 'switch_type', label: 'Loại Switch', type: 'STRING', required: true, filterable: true, allowedValues: ['Mechanical Red', 'Mechanical Blue', 'Mechanical Brown', 'Optical Switch'] },
      { key: 'layout', label: 'Layout phím', type: 'STRING', required: true, filterable: true, allowedValues: ['Fullsize 104', 'Tenkeyless (TKL)', '75%', '68%'] },
      { key: 'led_type', label: 'Đèn LED', type: 'STRING', required: false, filterable: true, allowedValues: ['RGB', 'Monochrome', 'Rainbow', 'None'] },
    ],
  },
  MOUSE: {
    category_code: 'MOUSE',
    category_name: 'Chuột máy tính (Mouse)',
    has_schema: true,
    fields: [
      { key: 'connection_type', label: 'Chuẩn kết nối', type: 'STRING', required: true, filterable: true, allowedValues: ['Wired', 'Wireless', 'Bluetooth / Wireless'] },
      { key: 'dpi', label: 'Độ nhạy (DPI)', type: 'INTEGER', required: true, filterable: true, unit: 'DPI', minValue: 100 },
      { key: 'sensor', label: 'Cảm biến', type: 'STRING', required: false, filterable: false },
      { key: 'weight_g', label: 'Trọng lượng', type: 'INTEGER', required: false, filterable: false, unit: 'g', minValue: 10 },
    ],
  },
};

export const MOCK_PRODUCTS: AdminProductDTO[] = [
  {
    "product_id": "e0000001-0000-0000-0000-000000000001",
    "name": "Bộ vi xử lý Intel Core i5-13600K (Up to 5.1GHz, 14 Cores 20 Threads, 24MB Cache)",
    "brand": "INTEL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "Vi xử lý Raptor Lake socket LGA1700, 14 nhân 20 luồng, hỗ trợ cả RAM DDR4 và DDR5, hiệu năng render và gaming vượt trội.",
    "price": 7490000,
    "stock_quantity": 25,
    "benchmark_score": 88.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000001.jpg",
    "gallery_urls": [
      "https://tpucdn.com/cpu-specs/images/chips/2829-front.jpg"
    ],
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
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000002",
    "name": "Bộ vi xử lý Intel Core i7-14700K (Up to 5.6GHz, 20 Cores 28 Threads, 33MB Cache)",
    "brand": "INTEL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "Vi xử lý thế hệ 14 Raptor Lake Refresh socket LGA1700, bổ sung thêm E-core, xử lý đa nhiệm cực mạnh cho Creator và Streamer.",
    "price": 10890000,
    "stock_quantity": 15,
    "benchmark_score": 94.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000002.jpg",
    "gallery_urls": [
      "https://tpucdn.com/cpu-specs/images/chips/3067-front.jpg"
    ],
    "specs": {
      "socket_type": "LGA1700",
      "tdp_w": 125,
      "core_count": 20,
      "thread_count": 28,
      "integrated_graphics": true
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000003",
    "name": "Bộ vi xử lý AMD Ryzen 7 7800X3D (4.2GHz~5.0GHz, 8 Cores 16 Threads, 104MB Cache, Socket AM5)",
    "brand": "AMD",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "Vua vi xử lý Gaming với công nghệ 3D V-Cache độc quyền, tiết kiệm điện năng cực tốt trên nền tảng socket AM5 tân tiến.",
    "price": 10490000,
    "stock_quantity": 20,
    "benchmark_score": 96.5,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000003.jpg",
    "gallery_urls": [
      "https://tpucdn.com/cpu-specs/images/chips/2990-front.jpg"
    ],
    "specs": {
      "socket_type": "AM5",
      "tdp_w": 120,
      "core_count": 8,
      "thread_count": 16,
      "integrated_graphics": true
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000004",
    "name": "Bộ vi xử lý AMD Ryzen 5 7600 (3.8GHz~5.1GHz, 6 Cores 12 Threads, 38MB Cache, Socket AM5)",
    "brand": "AMD",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "Lựa chọn quốc dân phân khúc tầm trung cho socket AM5, hiệu năng đơn nhân tuyệt vời, đi kèm quạt tản nhiệt Wraith Stealth.",
    "price": 5190000,
    "stock_quantity": 0,
    "benchmark_score": 82.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000004.jpg",
    "gallery_urls": [
      "https://tpucdn.com/cpu-specs/images/chips/2988-front.jpg"
    ],
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
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000005",
    "name": "Bo mạch chủ ASUS ROG STRIX B760-A GAMING WIFI D4",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Bo mạch chủ tone trắng sang trọng, hỗ trợ CPU Intel Gen 12/13/14 LGA1700, Wi-Fi 6E, 3 khe M.2 NVMe PCIe 4.0 và RAM DDR4.",
    "price": 5490000,
    "stock_quantity": 12,
    "benchmark_score": 82.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000005.png",
    "gallery_urls": [
      "https://dlcdnwebimgs.asus.com/files/media/7D58E51C-E86B-4746-881D-A6DB99216A36/v1/img/kv/ROG-Strix-B760-A-Gaming.png"
    ],
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
      "max_pcie_gen": 4.0,
      "chipset": "B760"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000006",
    "name": "Bo mạch chủ MSI MAG Z790 TOMAHAWK WIFI DDR5",
    "brand": "MSI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Bo mạch chủ quân sự bền bỉ, tản nhiệt VRM dày dặn, hỗ trợ ép xung CPU Intel LGA1700, 4 khe M.2 PCIe 4.0 và RAM DDR5 tốc độ cao.",
    "price": 7290000,
    "stock_quantity": 18,
    "benchmark_score": 90.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000006.webp",
    "gallery_urls": [
      "https://storage-asset.msi.com/global/picture/product/product_1664265391459c76c55d481a806150407f1b07a6bb.webp"
    ],
    "specs": {
      "supported_sockets": [
        "LGA1700"
      ],
      "form_factor": "ATX",
      "supported_memory_types": [
        "DDR5"
      ],
      "ram_slots": 4,
      "max_ram_gb": 192,
      "m2_slots": 4,
      "max_pcie_gen": 5.0,
      "chipset": "Z790"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000007",
    "name": "Bo mạch chủ GIGABYTE B650 AORUS ELITE AX",
    "brand": "GIGABYTE",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Nền tảng tối ưu cho AMD Ryzen 7000/8000/9000 series socket AM5, PCIe 5.0 M.2, Wi-Fi 6E, tản nhiệt M.2 Thermal Guard.",
    "price": 5890000,
    "stock_quantity": 22,
    "benchmark_score": 86.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000007.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81JFKzNyl+L._AC_SL1500_.jpg"
    ],
    "specs": {
      "supported_sockets": [
        "AM5"
      ],
      "form_factor": "ATX",
      "supported_memory_types": [
        "DDR5"
      ],
      "ram_slots": 4,
      "max_ram_gb": 192,
      "m2_slots": 3,
      "max_pcie_gen": 5.0,
      "chipset": "B650"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000008",
    "name": "Bo mạch chủ ASRock B650M-HDV/M.2 Micro-ATX",
    "brand": "ASROCK",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Bo mạch chủ Micro-ATX nhỏ gọn, giá thành tối ưu cho AM5, 2 khe cắm RAM DDR5, trang bị sẵn khe cắm Wi-Fi M.2 Key E.",
    "price": 3190000,
    "stock_quantity": 30,
    "benchmark_score": 75.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000008.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81sUb3eg3YL._AC_SX679_.jpg"
    ],
    "specs": {
      "supported_sockets": [
        "AM5"
      ],
      "form_factor": "Micro-ATX",
      "supported_memory_types": [
        "DDR5"
      ],
      "ram_slots": 2,
      "max_ram_gb": 96,
      "m2_slots": 2,
      "max_pcie_gen": 5.0,
      "chipset": "B650"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000009",
    "name": "RAM Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz Black",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Dòng RAM DDR4 quốc dân tản nhiệt nhôm nguyên chất cấu hình thấp (low profile), tương thích hoàn hảo mọi tản nhiệt khí.",
    "price": 1190000,
    "stock_quantity": 40,
    "benchmark_score": 72.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000009.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71lmVVC09jL._AC_.jpg"
    ],
    "specs": {
      "memory_type": "DDR4",
      "capacity_gb": 16,
      "bus_speed_mhz": 3200,
      "modules_per_kit": 2
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000010",
    "name": "RAM Kingston Fury Beast RGB 32GB (2x16GB) DDR4 3600MHz",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Bộ nhớ DDR4 hiệu năng cao với dải LED RGB đồng bộ ấn tượng, xung nhịp 3600MHz tối ưu độ trễ cho nền tảng Intel và AMD.",
    "price": 2190000,
    "stock_quantity": 25,
    "benchmark_score": 78.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000010.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71CpgA2mMCL._AC_SL1500_.jpg"
    ],
    "specs": {
      "memory_type": "DDR4",
      "capacity_gb": 32,
      "bus_speed_mhz": 3600,
      "modules_per_kit": 2
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000011",
    "name": "RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz Black",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Kit RAM DDR5 thế hệ mới, hỗ trợ cả Intel XMP 3.0 và AMD EXPO, tích hợp PMIC điều áp trên mạch đem lại độ ổn định tối đa.",
    "price": 3290000,
    "stock_quantity": 20,
    "benchmark_score": 89.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000011.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71AV5PQu1yL._AC_.jpg"
    ],
    "specs": {
      "memory_type": "DDR5",
      "capacity_gb": 32,
      "bus_speed_mhz": 6000,
      "modules_per_kit": 2
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000012",
    "name": "RAM G.Skill Trident Z5 RGB 64GB (2x32GB) DDR5 6000MHz Silver",
    "brand": "GSKILL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Siêu phẩm RAM DDR5 thân nhôm phay xước bạc sang trọng, dung lượng khủng 64GB phục vụ dựng phim 4K/8K và đồ họa 3D hạng nặng.",
    "price": 5990000,
    "stock_quantity": 10,
    "benchmark_score": 95.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000012.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71fq1NtkAPL._AC_.jpg"
    ],
    "specs": {
      "memory_type": "DDR5",
      "capacity_gb": 64,
      "bus_speed_mhz": 6000,
      "modules_per_kit": 2
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000013",
    "name": "Card màn hình ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Kiến trúc NVIDIA Ada Lovelace tân tiến, 2 quạt công nghệ Axial-tech với vòng chắn giúp tăng áp suất khí, chiều dài chỉ 227mm.",
    "price": 7990000,
    "stock_quantity": 15,
    "benchmark_score": 78.5,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000013.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81O6t+EEjLL._AC_.jpg"
    ],
    "specs": {
      "vram_gb": 8,
      "length_mm": 227.2,
      "tdp_w": 115,
      "recommended_psu_w": 550,
      "pcie_gen": 4.0,
      "vram_type": "GDDR6"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000014",
    "name": "Card màn hình MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM",
    "brand": "MSI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Bộ nhớ VRAM 16GB GDDR6X thoải mái chơi game 2K/4K max settings, tản nhiệt TRI FROZR 3 với quạt TORX Fan 5.0 tối ưu luồng gió.",
    "price": 24490000,
    "stock_quantity": 8,
    "benchmark_score": 94.2,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000014.jpg",
    "gallery_urls": [
      "https://storage-asset.msi.com/global/picture/product/product_1704770020d2c3dfa5cfd37e293021f4bc5ea35593.png"
    ],
    "specs": {
      "vram_gb": 16,
      "length_mm": 307.0,
      "tdp_w": 285,
      "recommended_psu_w": 750,
      "pcie_gen": 4.0,
      "vram_type": "GDDR6X"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000015",
    "name": "Card màn hình GIGABYTE Radeon RX 7800 XT GAMING OC 16GB",
    "brand": "GIGABYTE",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Kiến trúc AMD RDNA 3, 16GB VRAM, hệ thống làm mát WINDFORCE 3 quạt quay đảo chiều, hỗ trợ công nghệ AMD HYPR-RX và FSR 3.",
    "price": 15290000,
    "stock_quantity": 12,
    "benchmark_score": 89.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000015.jpg",
    "gallery_urls": [
      "https://philong.com.vn/media/product/30678-vga-gigabyte-radeon-rx-7800-xt-gaming-oc-16gd-philong-1.png"
    ],
    "specs": {
      "vram_gb": 16,
      "length_mm": 302.0,
      "tdp_w": 263,
      "recommended_psu_w": 700,
      "pcie_gen": 4.0,
      "vram_type": "GDDR6"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000016",
    "name": "Card màn hình ASUS ROG Strix GeForce RTX 4090 OC Edition 24GB",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Đỉnh cao đồ họa thế giới với 24GB VRAM GDDR6X, khung kim loại nguyên khối, quạt tản nhiệt lớn hơn 23% so với thế hệ trước.",
    "price": 52990000,
    "stock_quantity": 4,
    "benchmark_score": 99.5,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000016.png",
    "gallery_urls": [
      "https://dlcdnwebimgs.asus.com/gain/2486AE38-B7C7-443A-9615-FD08D5430992/w1000/h732"
    ],
    "specs": {
      "vram_gb": 24,
      "length_mm": 357.6,
      "tdp_w": 450,
      "recommended_psu_w": 1000,
      "pcie_gen": 4.0,
      "vram_type": "GDDR6X"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000017",
    "name": "Ổ cứng SSD Kingston NV2 500GB M.2 2280 NVMe PCIe 4.0",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000005",
      "category_code": "SSD_M2",
      "category_name": "Ổ cứng SSD M.2 NVMe"
    },
    "description": "Giải pháp nâng cấp lưu trữ thế hệ mới tốc độ đọc 3500 MB/s, thiết kế nhỏ gọn M.2 2280 một mặt, tối ưu điện năng.",
    "price": 1090000,
    "stock_quantity": 50,
    "benchmark_score": 75.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000017.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81qEG5iHiML.jpg"
    ],
    "specs": {
      "interface_type": "NVMe PCIe 4.0",
      "capacity_gb": 500,
      "read_speed_mbps": 3500,
      "tdp_w": 5.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000018",
    "name": "Ổ cứng SSD Samsung 990 PRO 1TB M.2 PCIe Gen 4.0 x4 NVMe",
    "brand": "SAMSUNG",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000005",
      "category_code": "SSD_M2",
      "category_name": "Ổ cứng SSD M.2 NVMe"
    },
    "description": "Tốc độ đọc lên tới 7450 MB/s và ghi 6900 MB/s, bộ điều khiển phủ niken tản nhiệt thông minh, dẫn đầu độ bền và tốc độ load game.",
    "price": 2890000,
    "stock_quantity": 35,
    "benchmark_score": 95.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000018.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71bLTK7y9lL._AC_.jpg"
    ],
    "specs": {
      "interface_type": "NVMe PCIe 4.0",
      "capacity_gb": 1000,
      "read_speed_mbps": 7450,
      "tdp_w": 8.5
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000019",
    "name": "Ổ cứng SSD Crucial T700 2TB PCIe Gen 5.0 x4 NVMe M.2",
    "brand": "CRUCIAL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000005",
      "category_code": "SSD_M2",
      "category_name": "Ổ cứng SSD M.2 NVMe"
    },
    "description": "Tốc độ đọc cực khủng lên tới 12,400 MB/s chuẩn PCIe 5.0, sẵn sàng cho công nghệ Microsoft DirectStorage và AI training.",
    "price": 7490000,
    "stock_quantity": 8,
    "benchmark_score": 99.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000019.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/51F8pWLLVeL._AC_SL1500_.jpg"
    ],
    "specs": {
      "interface_type": "NVMe PCIe 5.0",
      "capacity_gb": 2000,
      "read_speed_mbps": 12400,
      "tdp_w": 11.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000020",
    "name": "Nguồn máy tính Corsair CV650 650W 80 Plus Bronze",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000006",
      "category_code": "PSU",
      "category_name": "Nguồn máy tính (PSU)"
    },
    "description": "Nguồn công suất thực 650W chuẩn 80 Plus Bronze đáng tin cậy, quạt làm mát 120mm tự điều tốc giữ cho hệ thống êm ái.",
    "price": 1490000,
    "stock_quantity": 30,
    "benchmark_score": 74.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000020.webp",
    "gallery_urls": [
      "https://elitehubs.com/cdn/shop/products/1-1-6.png?v=1695323233"
    ],
    "specs": {
      "rated_wattage_w": 650,
      "efficiency_rating": "80 Plus Bronze",
      "form_factor": "ATX"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000021",
    "name": "Nguồn máy tính MSI MAG A750GL PCIE5 750W 80 Plus Gold Modular",
    "brand": "MSI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000006",
      "category_code": "PSU",
      "category_name": "Nguồn máy tính (PSU)"
    },
    "description": "Hỗ trợ chuẩn ATX 3.0 và PCIe 5.0 với đầu nối 12VHPWR nguyên bản màu vàng chống cắm lỏng, hiệu suất 80 Plus Gold cao cấp.",
    "price": 2690000,
    "stock_quantity": 25,
    "benchmark_score": 86.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000021.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/716c-SjLwPL.jpg"
    ],
    "specs": {
      "rated_wattage_w": 750,
      "efficiency_rating": "80 Plus Gold",
      "form_factor": "ATX"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000022",
    "name": "Nguồn máy tính Corsair RM850e 850W 80 Plus Gold Full Modular",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000006",
      "category_code": "PSU",
      "category_name": "Nguồn máy tính (PSU)"
    },
    "description": "Bộ nguồn fully modular đạt chuẩn Cybenetics Platinum về độ ồn thấp, tụ điện 105°C công nghiệp Nhật Bản vận hành bền bỉ 24/7.",
    "price": 3390000,
    "stock_quantity": 18,
    "benchmark_score": 90.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000022.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71CnFDhomCL._AC_SL1500_.jpg"
    ],
    "specs": {
      "rated_wattage_w": 850,
      "efficiency_rating": "80 Plus Gold",
      "form_factor": "ATX"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000023",
    "name": "Vỏ máy tính NZXT H5 Flow RGB Black Mid-Tower",
    "brand": "NZXT",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000007",
      "category_code": "CASE",
      "category_name": "Vỏ máy tính (Case)"
    },
    "description": "Thiết kế thông thoáng tối đa luồng khí, quạt đáy chuyên dụng hút gió làm mát trực tiếp cho VGA, kính cường lực nguyên khối.",
    "price": 2590000,
    "stock_quantity": 14,
    "benchmark_score": 85.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000023.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81SwxuNUxdL._AC_.jpg"
    ],
    "specs": {
      "supported_form_factors": [
        "ATX",
        "Micro-ATX",
        "Mini-ITX"
      ],
      "max_gpu_length_mm": 365.0,
      "max_cooler_height_mm": 165.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000024",
    "name": "Vỏ máy tính Montech AIR 903 MAX Black E-ATX",
    "brand": "MONTECH",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000007",
      "category_code": "CASE",
      "category_name": "Vỏ máy tính (Case)"
    },
    "description": "Vỏ case lưới thoáng khí cực đại, lắp sẵn 4 quạt HP140 ARGB mạnh mẽ, khoang lắp VGA rộng tới 400mm, tản nhiệt khí tới 180mm.",
    "price": 1790000,
    "stock_quantity": 20,
    "benchmark_score": 88.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000024.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/91U5KxXJDgL._AC_.jpg"
    ],
    "specs": {
      "supported_form_factors": [
        "ATX",
        "Micro-ATX",
        "Mini-ITX",
        "E-ATX"
      ],
      "max_gpu_length_mm": 400.0,
      "max_cooler_height_mm": 180.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000025",
    "name": "Vỏ máy tính Lian Li O11 Dynamic EVO RGB Black",
    "brand": "LIANLI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000007",
      "category_code": "CASE",
      "category_name": "Vỏ máy tính (Case)"
    },
    "description": "Case bể cá 2 mặt kính cường lực không cột góc, dải LED RGB viền kép, lắp vừa card đồ họa dài tới 455mm và 3 radiator 360mm cùng lúc.",
    "price": 4190000,
    "stock_quantity": 10,
    "benchmark_score": 94.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000025.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/712giHWFxxL.jpg"
    ],
    "specs": {
      "supported_form_factors": [
        "ATX",
        "Micro-ATX",
        "Mini-ITX",
        "E-ATX"
      ],
      "max_gpu_length_mm": 455.0,
      "max_cooler_height_mm": 167.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000026",
    "name": "Tản nhiệt khí CPU Thermalright Peerless Assassin 120 SE",
    "brand": "THERMALRIGHT",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000008",
      "category_code": "CPU_COOLER",
      "category_name": "Tản nhiệt CPU"
    },
    "description": "Vua tản nhiệt khí tháp đôi 6 ống đồng AGHP thế hệ 4, quạt TL-C12C-S êm ái, cân tốt các dòng CPU công suất tiêu thụ lên tới 245W.",
    "price": 890000,
    "stock_quantity": 35,
    "benchmark_score": 83.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000026.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71sEMx7F+TL._SL1500_.jpg"
    ],
    "specs": {
      "supported_sockets": [
        "LGA1700",
        "AM5",
        "AM4"
      ],
      "cooler_type": "AIR",
      "height_mm": 155.0,
      "tdp_w": 245.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000027",
    "name": "Tản nhiệt nước AIO DeepCool LT720 360mm Black",
    "brand": "DEEPCOOL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000008",
      "category_code": "CPU_COOLER",
      "category_name": "Tản nhiệt CPU"
    },
    "description": "Bơm nước thế hệ thứ 4 công suất cao, mặt gương vô cực đa chiều tuyệt đẹp, làm mát tối ưu cho CPU Intel & AMD TDP tới 300W.",
    "price": 3490000,
    "stock_quantity": 12,
    "benchmark_score": 91.5,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000027.jpg",
    "gallery_urls": [
      "https://www.pcstudio.in/wp-content/uploads/2022/12/Deepcool-LT720-360mm-Liquid-Cooler-Black-3.jpg"
    ],
    "specs": {
      "supported_sockets": [
        "LGA1700",
        "AM5",
        "AM4"
      ],
      "cooler_type": "AIO_360",
      "height_mm": 52.0,
      "tdp_w": 300.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000028",
    "name": "Tản nhiệt nước AIO NZXT Kraken 240 RGB White",
    "brand": "NZXT",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000008",
      "category_code": "CPU_COOLER",
      "category_name": "Tản nhiệt CPU"
    },
    "description": "Màn hình LCD 1.54 inch hiển thị nhiệt độ thời gian thực, quạt tản nhiệt F120 RGB Core áp suất tĩnh cao, ống bọc dù bện cao cấp.",
    "price": 3990000,
    "stock_quantity": 9,
    "benchmark_score": 88.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000028.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/51WFKhfnDvL._SL1000_.jpg"
    ],
    "specs": {
      "supported_sockets": [
        "LGA1700",
        "AM5",
        "AM4"
      ],
      "cooler_type": "AIO_240",
      "height_mm": 53.0,
      "tdp_w": 250.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000029",
    "name": "Bộ vi xử lý Intel Core i5-13400F (Up to 4.6GHz, 10 Cores 16 Threads, 20MB Cache)",
    "brand": "INTEL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "CPU Intel Gen 13 socket LGA1700 quốc dân cho phân khúc tầm trung giá rẻ, không iGPU, tối ưu chi phí khi lắp kèm card đồ họa rời.",
    "price": 4890000,
    "stock_quantity": 35,
    "benchmark_score": 80.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000029.jpg",
    "gallery_urls": [
      "https://tpucdn.com/cpu-specs/images/chips/2927-front.jpg"
    ],
    "specs": {
      "socket_type": "LGA1700",
      "tdp_w": 65,
      "core_count": 10,
      "thread_count": 16,
      "integrated_graphics": false
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000030",
    "name": "Bộ vi xử lý Intel Core i5-14600KF (Up to 5.3GHz, 14 Cores 20 Threads, 24MB Cache)",
    "brand": "INTEL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "CPU thế hệ 14 mở khóa ép xung Raptor Lake Refresh socket LGA1700, hiệu năng đơn nhân và đa nhiệm cực mạnh, không tích hợp iGPU.",
    "price": 7690000,
    "stock_quantity": 20,
    "benchmark_score": 89.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000030.jpg",
    "gallery_urls": [
      "https://tpucdn.com/cpu-specs/images/chips/3070-front.jpg"
    ],
    "specs": {
      "socket_type": "LGA1700",
      "tdp_w": 125,
      "core_count": 14,
      "thread_count": 20,
      "integrated_graphics": false
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000031",
    "name": "Bộ vi xử lý AMD Ryzen 5 7500F (3.7GHz~5.0GHz, 6 Cores 12 Threads, 38MB Cache, Socket AM5)",
    "brand": "AMD",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000001",
      "category_code": "CPU",
      "category_name": "Bộ vi xử lý (CPU)"
    },
    "description": "Lựa chọn tối ưu hiệu năng trên giá thành cho socket AM5, 6 nhân 12 luồng kiến trúc Zen 4, không tích hợp iGPU, nhiệt độ mát mẻ.",
    "price": 3990000,
    "stock_quantity": 40,
    "benchmark_score": 81.5,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000031.jpg",
    "gallery_urls": [
      "https://tpucdn.com/cpu-specs/images/chips/3042-front.jpg"
    ],
    "specs": {
      "socket_type": "AM5",
      "tdp_w": 65,
      "core_count": 6,
      "thread_count": 12,
      "integrated_graphics": false
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000032",
    "name": "Bo mạch chủ MSI PRO B760M-P DDR4 Micro-ATX",
    "brand": "MSI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Bo mạch chủ Micro-ATX kinh tế cho Intel Gen 12/13/14 LGA1700, hỗ trợ 4 khe RAM DDR4 dung lượng tối đa 128GB, 2 khe M.2 NVMe PCIe 4.0.",
    "price": 2890000,
    "stock_quantity": 25,
    "benchmark_score": 76.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000032.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/91dC-a6V6rL._AC_SL1500_.jpg"
    ],
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
      "max_pcie_gen": 4.0,
      "chipset": "B760"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000033",
    "name": "Bo mạch chủ ASUS TUF GAMING B650-PLUS WIFI ATX",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Bo mạch chủ chuẩn độ bền quân đội TUF cho socket AM5, PCIe 5.0 M.2, Wi-Fi 6, tản nhiệt VRM lớn, hỗ trợ RAM DDR5 bus cao.",
    "price": 5490000,
    "stock_quantity": 15,
    "benchmark_score": 87.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000033.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81SXll1-k8L._AC_SL1500_.jpg"
    ],
    "specs": {
      "supported_sockets": [
        "AM5"
      ],
      "form_factor": "ATX",
      "supported_memory_types": [
        "DDR5"
      ],
      "ram_slots": 4,
      "max_ram_gb": 192,
      "m2_slots": 3,
      "max_pcie_gen": 5.0,
      "chipset": "B650"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000034",
    "name": "Bo mạch chủ MSI PRO B650M-A WIFI Micro-ATX",
    "brand": "MSI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Bo mạch chủ Micro-ATX socket AM5 trang bị sẵn Wi-Fi 6E, tản nhiệt M.2 Shield Frozr, kết nối mạng LAN 2.5G tốc độ cao.",
    "price": 3990000,
    "stock_quantity": 18,
    "benchmark_score": 80.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000034.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81r6gJjhzHL._AC_SL1500_.jpg"
    ],
    "specs": {
      "supported_sockets": [
        "AM5"
      ],
      "form_factor": "Micro-ATX",
      "supported_memory_types": [
        "DDR5"
      ],
      "ram_slots": 4,
      "max_ram_gb": 192,
      "m2_slots": 2,
      "max_pcie_gen": 4.0,
      "chipset": "B650"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000035",
    "name": "Bộ nhớ RAM Kingston FURY Beast Black 16GB (2x8GB) DDR4 3200MHz",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Kit 2 thanh RAM 8GB DDR4 bus 3200MHz tản nhiệt nhôm đen nguyên khối, hỗ trợ Intel XMP 2.0 tự động nhận cấu hình tối ưu.",
    "price": 990000,
    "stock_quantity": 60,
    "benchmark_score": 75.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000035.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/61uXihcspuL._AC_.jpg"
    ],
    "specs": {
      "memory_type": "DDR4",
      "capacity_gb": 16,
      "bus_speed_mhz": 3200,
      "modules_per_kit": 2
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000036",
    "name": "Bộ nhớ RAM Corsair Vengeance RGB RS 32GB (2x16GB) DDR4 3600MHz",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Kit RAM DDR4 32GB hiệu năng cao bus 3600MHz, dải LED RGB rực rỡ đồng bộ phần mềm iCUE, tản nhiệt nhôm anodized đen bóng bẩy.",
    "price": 1990000,
    "stock_quantity": 40,
    "benchmark_score": 84.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000036.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71JPAVZ-pfL._AC_.jpg"
    ],
    "specs": {
      "memory_type": "DDR4",
      "capacity_gb": 32,
      "bus_speed_mhz": 3600,
      "modules_per_kit": 2
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000037",
    "name": "Bộ nhớ RAM Kingston FURY Beast RGB 32GB (2x16GB) DDR5 5600MHz",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Kit RAM DDR5 thế hệ mới tích hợp công nghệ FURY Infrared Sync, bus 5600MHz CL36 hỗ trợ cả Intel XMP 3.0 và AMD EXPO.",
    "price": 2890000,
    "stock_quantity": 30,
    "benchmark_score": 89.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000037.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/61OkIqQkxBL._AC_SL1500_.jpg"
    ],
    "specs": {
      "memory_type": "DDR5",
      "capacity_gb": 32,
      "bus_speed_mhz": 5600,
      "modules_per_kit": 2
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000038",
    "name": "Bộ nhớ RAM Corsair Dominator Titanium RGB 64GB (2x32GB) DDR5 6000MHz",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000003",
      "category_code": "RAM",
      "category_name": "Bộ nhớ trong (RAM)"
    },
    "description": "Kit RAM DDR5 cao cấp bậc nhất với linh kiện chọn lọc tỉ mỉ, công nghệ làm mát DHX đã được cấp bằng sáng chế, bus 6000MHz.",
    "price": 6490000,
    "stock_quantity": 10,
    "benchmark_score": 97.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000038.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71Tyd3prKVL._AC_SL1500_.jpg"
    ],
    "specs": {
      "memory_type": "DDR5",
      "capacity_gb": 64,
      "bus_speed_mhz": 6000,
      "modules_per_kit": 2
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000039",
    "name": "Card màn hình GIGABYTE GeForce RTX 4070 WINDFORCE OC 12GB",
    "brand": "GIGABYTE",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Card đồ họa kiến trúc Ada Lovelace với hệ thống tản nhiệt 3 quạt WINDFORCE độc quyền, 12GB GDDR6X, cân mượt game 2K Ray Tracing và DLSS 3.",
    "price": 15990000,
    "stock_quantity": 14,
    "benchmark_score": 91.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000039.jpg",
    "gallery_urls": [
      "https://philong.com.vn/media/product/29845-vga-gigabyte-geforce-rtx-4070-windforce-oc-12g-philong-1.png"
    ],
    "specs": {
      "vram_gb": 12,
      "length_mm": 261.0,
      "tdp_w": 200.0,
      "recommended_psu_w": 650,
      "pcie_gen": 4.0,
      "vram_type": "GDDR6X"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000040",
    "name": "Card màn hình MSI GeForce RTX 4080 SUPER 16GB GAMING X SLIM",
    "brand": "MSI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Siêu card đồ họa 16GB VRAM thiết kế GAMING X SLIM nhỏ gọn hơn, quạt TORX FAN 5.0, sức mạnh vượt trội cho Gaming 4K và tác vụ AI tạo sinh.",
    "price": 28990000,
    "stock_quantity": 8,
    "benchmark_score": 98.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000040.jpg",
    "gallery_urls": [
      "https://storage-asset.msi.com/global/picture/product/product_1704768393e157774d6c4125b20625d9961f5c6e83.png"
    ],
    "specs": {
      "vram_gb": 16,
      "length_mm": 322.0,
      "tdp_w": 320.0,
      "recommended_psu_w": 750,
      "pcie_gen": 4.0,
      "vram_type": "GDDR6X"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000041",
    "name": "Ổ cứng SSD Kingston KC3000 1TB M.2 PCIe 4.0 NVMe",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000005",
      "category_code": "SSD_M2",
      "category_name": "Ổ cứng SSD M.2 NVMe"
    },
    "description": "Ổ cứng SSD chuẩn PCIe 4.0 NVMe tốc độ cao 7000MB/s, trang bị miếng tản nhiệt nhôm graphene mỏng nhẹ, tối ưu cho PC Gaming và PS5.",
    "price": 2390000,
    "stock_quantity": 45,
    "benchmark_score": 93.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000041.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/61pz6mN3ghL._AC_.jpg"
    ],
    "specs": {
      "interface_type": "NVMe PCIe 4.0",
      "capacity_gb": 1000,
      "read_speed_mbps": 7000,
      "tdp_w": 8.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000042",
    "name": "Ổ cứng SSD Samsung 990 PRO 2TB M.2 PCIe 4.0 NVMe",
    "brand": "SAMSUNG",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000005",
      "category_code": "SSD_M2",
      "category_name": "Ổ cứng SSD M.2 NVMe"
    },
    "description": "Ông vua tốc độ SSD Gen 4 với tốc độ đọc tuần tự 7450MB/s, dung lượng khủng 2TB, độ bền ghi TBW vượt trội cho Render video 4K/8K.",
    "price": 4990000,
    "stock_quantity": 20,
    "benchmark_score": 99.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000042.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81WuG6lQuDL._AC_.jpg"
    ],
    "specs": {
      "interface_type": "NVMe PCIe 4.0",
      "capacity_gb": 2000,
      "read_speed_mbps": 7450,
      "tdp_w": 8.5
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000043",
    "name": "Ổ cứng SSD Kingston NV2 500GB M.2 PCIe 4.0 NVMe",
    "brand": "KINGSTON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000005",
      "category_code": "SSD_M2",
      "category_name": "Ổ cứng SSD M.2 NVMe"
    },
    "description": "SSD PCIe 4.0 dung lượng 500GB giá phổ thông, tốc độ đọc 3500MB/s, giải pháp nâng cấp dung lượng và cài đặt hệ điều hành mượt mà.",
    "price": 1090000,
    "stock_quantity": 50,
    "benchmark_score": 78.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000043.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71lCFgczaBL._AC_.jpg"
    ],
    "specs": {
      "interface_type": "NVMe PCIe 4.0",
      "capacity_gb": 500,
      "read_speed_mbps": 3500,
      "tdp_w": 5.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000044",
    "name": "Nguồn máy tính Corsair CV650 650W 80 Plus Bronze",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000006",
      "category_code": "PSU",
      "category_name": "Nguồn máy tính (PSU)"
    },
    "description": "Nguồn máy tính công suất thực 650W chuẩn 80 Plus Bronze, quạt 120mm điều khiển thông minh giữ nhiệt độ và độ ồn ở mức tối thiểu.",
    "price": 1450000,
    "stock_quantity": 35,
    "benchmark_score": 78.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000044.webp",
    "gallery_urls": [
      "https://elitehubs.com/cdn/shop/products/1-1-6.png?v=1695323233"
    ],
    "specs": {
      "rated_wattage_w": 650,
      "efficiency_rating": "80 Plus Bronze",
      "form_factor": "ATX"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000045",
    "name": "Nguồn máy tính GIGABYTE UD750GM 750W 80 Plus Gold Full Modular",
    "brand": "GIGABYTE",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000006",
      "category_code": "PSU",
      "category_name": "Nguồn máy tính (PSU)"
    },
    "description": "Nguồn công suất 750W 80 Plus Gold, dây rời Full Modular gọn gàng, tụ điện 100% Nhật Bản đảm bảo độ tin cậy và bền bỉ tối đa.",
    "price": 2290000,
    "stock_quantity": 22,
    "benchmark_score": 88.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000045.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71t3GTuR8pL._AC_SL1500_.jpg"
    ],
    "specs": {
      "rated_wattage_w": 750,
      "efficiency_rating": "80 Plus Gold",
      "form_factor": "ATX"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000046",
    "name": "Nguồn máy tính Corsair RM850e 850W 80 Plus Gold ATX 3.0",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000006",
      "category_code": "PSU",
      "category_name": "Nguồn máy tính (PSU)"
    },
    "description": "Nguồn máy tính 850W chuẩn ATX 3.0 và PCIe 5.0 với dây 12VHPWR cấp nguồn trực tiếp cho VGA dòng RTX 40 series không cần đầu chuyển.",
    "price": 3290000,
    "stock_quantity": 18,
    "benchmark_score": 93.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000046.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71UlVM3qc5L._AC_.jpg"
    ],
    "specs": {
      "rated_wattage_w": 850,
      "efficiency_rating": "80 Plus Gold",
      "form_factor": "ATX"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000047",
    "name": "Vỏ Case Montech AIR 100 ARGB Black Micro-ATX",
    "brand": "MONTECH",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000007",
      "category_code": "CASE",
      "category_name": "Vỏ máy tính (Case)"
    },
    "description": "Vỏ máy tính Micro-ATX nhỏ gọn trang bị sẵn 4 quạt ARGB, mặt lưới trước siêu thoáng khí, hỗ trợ GPU dài tới 330mm.",
    "price": 1190000,
    "stock_quantity": 25,
    "benchmark_score": 82.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000047.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71+vC54eAdS._AC_SL1500_.jpg"
    ],
    "specs": {
      "supported_form_factors": [
        "Micro-ATX",
        "Mini-ITX"
      ],
      "max_gpu_length_mm": 330.0,
      "max_cooler_height_mm": 161.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000048",
    "name": "Vỏ Case Lian Li O11 Dynamic EVO Black ATX",
    "brand": "LIAN LI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000007",
      "category_code": "CASE",
      "category_name": "Vỏ máy tính (Case)"
    },
    "description": "Vỏ case bể cá 2 mặt kính cường lực trong suốt đẳng cấp, không gian rộng rãi lắp đặt linh hoạt, hỗ trợ tản nhiệt nước AIO 360mm nóc và cạnh.",
    "price": 3890000,
    "stock_quantity": 12,
    "benchmark_score": 95.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000048.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71x-3P9loBL._AC_SL1500_.jpg"
    ],
    "specs": {
      "supported_form_factors": [
        "ATX",
        "Micro-ATX",
        "Mini-ITX"
      ],
      "max_gpu_length_mm": 422.0,
      "max_cooler_height_mm": 167.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000049",
    "name": "Tản nhiệt khí Deepcool AK620 Digital Black",
    "brand": "DEEPCOOL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000008",
      "category_code": "CPU_COOLER",
      "category_name": "Tản nhiệt CPU"
    },
    "description": "Tản nhiệt khí tháp đôi 6 ống đồng hiệu năng đỉnh cao tích hợp màn hình số hiển thị nhiệt độ CPU theo thời gian thực, tản nhiệt tốt tới 260W TDP.",
    "price": 1490000,
    "stock_quantity": 20,
    "benchmark_score": 89.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000049.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71jl2CxNoxL._SL1500_.jpg"
    ],
    "specs": {
      "supported_sockets": [
        "LGA1700",
        "AM5"
      ],
      "cooler_type": "AIR",
      "height_mm": 162.0,
      "tdp_w": 260.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000050",
    "name": "Tản nhiệt nước Deepcool LS520 SE 240mm ARGB",
    "brand": "DEEPCOOL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000008",
      "category_code": "CPU_COOLER",
      "category_name": "Tản nhiệt CPU"
    },
    "description": "Tản nhiệt nước AIO 240mm máy bơm thế hệ thứ 4 êm ái, mặt gương vô cực ARGB huyền ảo, công nghệ chống rò rỉ Anti-Leak độc quyền.",
    "price": 1950000,
    "stock_quantity": 18,
    "benchmark_score": 88.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000050.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71ToR4zOJbL._SL1500_.jpg"
    ],
    "specs": {
      "supported_sockets": [
        "LGA1700",
        "AM5"
      ],
      "cooler_type": "AIO_240",
      "height_mm": 52.0,
      "tdp_w": 280.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000051",
    "name": "Tản nhiệt nước NZXT Kraken 360 RGB Black",
    "brand": "NZXT",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000008",
      "category_code": "CPU_COOLER",
      "category_name": "Tản nhiệt CPU"
    },
    "description": "Tản nhiệt nước AIO 360mm trang bị màn hình LCD 1.54 inch hiển thị ảnh GIF và thông số hệ thống, 3 quạt F120 RGB Core làm mát cực êm.",
    "price": 4990000,
    "stock_quantity": 10,
    "benchmark_score": 96.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000051.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/41Yat2-orIL._SL1000_.jpg"
    ],
    "specs": {
      "supported_sockets": [
        "LGA1700",
        "AM5"
      ],
      "cooler_type": "AIO_360",
      "height_mm": 53.0,
      "tdp_w": 350.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000052",
    "name": "Màn hình Gaming LG UltraGear 24GN65R-B 24 inch FHD IPS 144Hz 1ms",
    "brand": "LG",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000009",
      "category_code": "MONITOR",
      "category_name": "Màn hình máy tính (Monitor)"
    },
    "description": "Màn hình gaming quốc dân 24 inch độ phân giải FHD tấm nền IPS màu sắc chuẩn xác, tần số quét 144Hz, thời gian phản hồi 1ms MBR, hỗ trợ AMD FreeSync Premium.",
    "price": 3390000,
    "stock_quantity": 30,
    "benchmark_score": 85.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000052.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/715tAlRV1oL.jpg"
    ],
    "specs": {
      "screen_size_inch": 24.0,
      "resolution": "FHD (1920x1080)",
      "refresh_rate_hz": 144,
      "panel_type": "IPS",
      "response_time_ms": 1.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000053",
    "name": "Màn hình Gaming ASUS TUF Gaming VG249Q3A 24 inch FHD Fast IPS 180Hz 1ms",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000009",
      "category_code": "MONITOR",
      "category_name": "Màn hình máy tính (Monitor)"
    },
    "description": "Màn hình eSports 24 inch FHD sử dụng tấm nền Fast IPS tần số quét siêu mượt 180Hz, công nghệ ELMB chống nhòe chuyển động và DisplayWidget Center tiện lợi.",
    "price": 3590000,
    "stock_quantity": 25,
    "benchmark_score": 87.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000053.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/7175R2o27XL._AC_SL1500_.jpg"
    ],
    "specs": {
      "screen_size_inch": 24.0,
      "resolution": "FHD (1920x1080)",
      "refresh_rate_hz": 180,
      "panel_type": "Fast IPS",
      "response_time_ms": 1.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000054",
    "name": "Màn hình Gaming LG UltraGear 27GP850-B 27 inch 2K QHD Nano IPS 165Hz",
    "brand": "LG",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000009",
      "category_code": "MONITOR",
      "category_name": "Màn hình máy tính (Monitor)"
    },
    "description": "Màn hình đồ họa và gaming cao cấp 27 inch 2K QHD tấm nền Nano IPS 1ms, độ phủ màu 98% DCI-P3, tương thích NVIDIA G-Sync Compatible và VESA DisplayHDR 400.",
    "price": 7890000,
    "stock_quantity": 20,
    "benchmark_score": 93.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000054.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81z8iO86p9L._AC_.jpg"
    ],
    "specs": {
      "screen_size_inch": 27.0,
      "resolution": "2K QHD (2560x1440)",
      "refresh_rate_hz": 165,
      "panel_type": "IPS",
      "response_time_ms": 1.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000055",
    "name": "Màn hình Gaming ASUS ROG Strix XG27ACS 27 inch 2K QHD Fast IPS 180Hz Type-C",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000009",
      "category_code": "MONITOR",
      "category_name": "Màn hình máy tính (Monitor)"
    },
    "description": "Màn hình ROG Strix 27 inch 2K QHD tấm nền Fast IPS 180Hz 1ms, cổng USB Type-C hỗ trợ sạc và xuất hình, tích hợp khe cắm giá đỡ điện thoại trên chân đế.",
    "price": 7490000,
    "stock_quantity": 18,
    "benchmark_score": 92.5,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000055.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71uwdOrLQML._AC_.jpg"
    ],
    "specs": {
      "screen_size_inch": 27.0,
      "resolution": "2K QHD (2560x1440)",
      "refresh_rate_hz": 180,
      "panel_type": "Fast IPS",
      "response_time_ms": 1.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000056",
    "name": "Màn hình Đồ họa Dell UltraSharp U3223QE 31.5 inch 4K UHD IPS Black Type-C Hub",
    "brand": "DELL",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000009",
      "category_code": "MONITOR",
      "category_name": "Màn hình máy tính (Monitor)"
    },
    "description": "Màn hình chuyên nghiệp 32 inch 4K UHD công nghệ IPS Black cho tỷ lệ tương phản 2000:1, độ bao phủ 100% sRGB và 98% DCI-P3, cổng kết nối RJ45 và sạc 90W PD.",
    "price": 18990000,
    "stock_quantity": 10,
    "benchmark_score": 96.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000056.png",
    "gallery_urls": [
      "https://philong.com.vn/media/product/27447-man-hinh-dell-ultrasharp-u3223qe-philong-1.png"
    ],
    "specs": {
      "screen_size_inch": 32.0,
      "resolution": "4K UHD (3840x2160)",
      "refresh_rate_hz": 60,
      "panel_type": "IPS",
      "response_time_ms": 5.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000057",
    "name": "Màn hình Gaming Samsung Odyssey Neo G7 32 inch 4K UHD 165Hz Mini-LED",
    "brand": "SAMSUNG",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000009",
      "category_code": "MONITOR",
      "category_name": "Màn hình máy tính (Monitor)"
    },
    "description": "Màn hình cong 1000R 32 inch 4K UHD công nghệ đèn nền Quantum Mini-LED siêu thực, độ sáng đỉnh 2000 nits, tần số quét 165Hz, trải nghiệm gaming đỉnh cao.",
    "price": 19990000,
    "stock_quantity": 8,
    "benchmark_score": 97.5,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000057.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81F6CeKEkzL._AC_SL1500_.jpg"
    ],
    "specs": {
      "screen_size_inch": 32.0,
      "resolution": "4K UHD (3840x2160)",
      "refresh_rate_hz": 165,
      "panel_type": "VA",
      "response_time_ms": 1.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000058",
    "name": "Bàn phím cơ không dây Akko 5075B Plus Dracula Castle RGB",
    "brand": "AKKO",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím cơ layout 75% núm xoay kim loại, cấu trúc Gasket Mount êm ái, switch Akko CS Cream Yellow mượt mà, 3 chế độ kết nối Bluetooth 5.0, 2.4GHz và Type-C.",
    "price": 2190000,
    "stock_quantity": 35,
    "benchmark_score": 86.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000058.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/S/aplus-media-library-service-media/23bdac8a-7688-4c1f-b059-871b25f04dbb.__CR0,0,970,600_PT0_SX970_V1___.jpg"
    ],
    "specs": {
      "connection_type": "Wireless",
      "switch_type": "Mechanical Red",
      "layout": "75%",
      "led_type": "RGB"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000059",
    "name": "Bàn phím cơ không dây Keychron K2 Pro QMK/VIA Red Switch RGB",
    "brand": "KEYCHRON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím cơ 75% tùy biến QMK/VIA chuyên nghiệp, Keycap PBT Double-shot OSA profile, switch cơ học Keychron K Pro Red gõ đầm tay, hỗ trợ cả Mac và Windows.",
    "price": 2490000,
    "stock_quantity": 25,
    "benchmark_score": 88.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000059.jpg",
    "gallery_urls": [
      "https://assets.msy.com.au/newsite/images/202302/source_img/Keyboards-Keychron-K2-Pro-75-QMK-VIA-RGB-Wireless-Aluminium-Frame-Mechanical-Keyboard-Red-Switch-3.jpg"
    ],
    "specs": {
      "connection_type": "Wireless",
      "switch_type": "Mechanical Red",
      "layout": "75%",
      "led_type": "RGB"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000060",
    "name": "Bàn phím cơ có dây Corsair K70 RGB PRO Cherry MX Red Fullsize 104",
    "brand": "CORSAIR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím gaming Fullsize khung nhôm phay xước cao cấp, switch cơ Cherry MX Red bền bỉ 100 triệu lần nhấn, công nghệ siêu xử lý AXON tần số phản hồi 8000Hz.",
    "price": 3690000,
    "stock_quantity": 20,
    "benchmark_score": 92.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000060.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81NHLnqXopL.jpg"
    ],
    "specs": {
      "connection_type": "Wired",
      "switch_type": "Mechanical Red",
      "layout": "Fullsize 104",
      "led_type": "RGB"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000061",
    "name": "Bàn phím cơ có dây Logitech G512 Carbon Lightsync RGB Brown Switch Fullsize",
    "brand": "LOGITECH",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím hợp kim nhôm-magiê 5052 siêu bền, switch tactile GX Brown đem lại cảm giác phản hồi xúc giác rõ ràng khi gõ văn bản và chơi game.",
    "price": 1990000,
    "stock_quantity": 30,
    "benchmark_score": 84.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000061.jpg",
    "gallery_urls": [
      "https://d3mk240zzrnosz.cloudfront.net/assets/XC8040_logitech-g512-carbon-lightsync-rgb-mechanical-gaming-keyboard-with-gx-brown-switches_124960.jpg"
    ],
    "specs": {
      "connection_type": "Wired",
      "switch_type": "Mechanical Brown",
      "layout": "Fullsize 104",
      "led_type": "RGB"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000062",
    "name": "Bàn phím cơ SteelSeries Apex Pro TKL OmniPoint Switch Có dây",
    "brand": "STEELSERIES",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím gaming TKL số 1 thế giới với switch quang từ OmniPoint 2.0 tùy chỉnh điểm kích hoạt từ 0.2mm đến 3.8mm, màn hình OLED thông minh hiển thị profile.",
    "price": 4890000,
    "stock_quantity": 15,
    "benchmark_score": 96.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000062.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/719h65mTOEL._AC_SL1500_.jpg"
    ],
    "specs": {
      "connection_type": "Wired",
      "switch_type": "Optical Switch",
      "layout": "Tenkeyless (TKL)",
      "led_type": "RGB"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000063",
    "name": "Bàn phím cơ không dây ASUS ROG Strix Scope II 96 Wireless ROG NX Snow",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím không dây layout 96% đầy đủ phím số mà gọn gàng như TKL, switch cơ ROG NX Snow được bôi trơn sẵn cực êm, đệm tiêu âm silicon cao cấp.",
    "price": 3990000,
    "stock_quantity": 14,
    "benchmark_score": 93.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000063.jpg",
    "gallery_urls": [
      "https://dlcdnwebimgs.asus.com/files/media/3F98C626-65EF-4A7A-9EB4-8EFA04C0B6B3/v2/img/omni/bg.jpg"
    ],
    "specs": {
      "connection_type": "Wireless",
      "switch_type": "Mechanical Red",
      "layout": "Tenkeyless (TKL)",
      "led_type": "RGB"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000064",
    "name": "Chuột gaming không dây Logitech G Pro X Superlight 2 Lightspeed Black",
    "brand": "LOGITECH",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000011",
      "category_code": "MOUSE",
      "category_name": "Chuột máy tính (Mouse)"
    },
    "description": "Chuột thi đấu eSports đỉnh cao trọng lượng siêu nhẹ 60g, cảm biến HERO 2 độ phân giải 32000 DPI, switch quang cơ học LIGHTFORCE lai không bao giờ double-click.",
    "price": 3490000,
    "stock_quantity": 25,
    "benchmark_score": 98.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000064.png",
    "gallery_urls": [
      "https://philong.com.vn/media/product/31096-chuot-khong-day-logitech-g-pro-x-superlight-2-black-philong--1-.png"
    ],
    "specs": {
      "connection_type": "Wireless",
      "dpi": 32000,
      "sensor": "Optical",
      "weight_g": 60
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000065",
    "name": "Chuột gaming không dây Razer Viper V2 Pro Ultra-lightweight White",
    "brand": "RAZER",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000011",
      "category_code": "MOUSE",
      "category_name": "Chuột máy tính (Mouse)"
    },
    "description": "Chuột gaming không dây đối xứng chỉ 58g, cảm biến quang học Focus Pro 30K DPI, switch quang Gen-3 độ trễ 0.2ms, pin hoạt động liên tục 80 giờ.",
    "price": 3190000,
    "stock_quantity": 20,
    "benchmark_score": 96.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000065.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/61PZvXc7UFL._AC_.jpg"
    ],
    "specs": {
      "connection_type": "Wireless",
      "dpi": 30000,
      "sensor": "Optical",
      "weight_g": 58
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000066",
    "name": "Chuột gaming không dây Pulsar X2V2 Wireless Black Size 2",
    "brand": "PULSAR",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000011",
      "category_code": "MOUSE",
      "category_name": "Chuột máy tính (Mouse)"
    },
    "description": "Chuột không dây siêu nhẹ 53g không lỗ, cảm biến PixArt PAW3395 26000 DPI, cuộn chuột Pulsar Blue Encoder nảy giòn, hỗ trợ Polling Rate lên đến 4K Hz.",
    "price": 2390000,
    "stock_quantity": 22,
    "benchmark_score": 90.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000066.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/51142H3ylVL._AC_SL1500_.jpg"
    ],
    "specs": {
      "connection_type": "Wireless",
      "dpi": 26000,
      "sensor": "Optical",
      "weight_g": 53
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000067",
    "name": "Chuột gaming có dây Razer DeathAdder V3 Ultra-lightweight Black",
    "brand": "RAZER",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000011",
      "category_code": "MOUSE",
      "category_name": "Chuột máy tính (Mouse)"
    },
    "description": "Huyền thoại công thái học DeathAdder V3 chỉ 59g, cảm biến quang học Focus Pro 30K DPI, tần số lấy mẫu thực 8000Hz phản xạ tức thì trong từng pha vẩy tâm.",
    "price": 1590000,
    "stock_quantity": 35,
    "benchmark_score": 91.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000067.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/61HIJnrPojL._AC_.jpg"
    ],
    "specs": {
      "connection_type": "Wired",
      "dpi": 30000,
      "sensor": "Optical",
      "weight_g": 59
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000068",
    "name": "Chuột gaming có dây Logitech G502 HERO High Performance 25600 DPI",
    "brand": "LOGITECH",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000011",
      "category_code": "MOUSE",
      "category_name": "Chuột máy tính (Mouse)"
    },
    "description": "Biểu tượng gaming với 11 nút bấm có thể lập trình, cảm biến HERO 25K DPI, tạ điều chỉnh trọng lượng linh hoạt và con lăn siêu tốc 2 chế độ độc quyền.",
    "price": 1090000,
    "stock_quantity": 45,
    "benchmark_score": 87.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000068.webp",
    "gallery_urls": [
      "https://resource.logitechg.com/w_544,h_466,c_pad,q_auto,f_auto/d_transparent.gif/content/dam/gaming/en/products/g502-hero/g502-hero-gallery-1.png"
    ],
    "specs": {
      "connection_type": "Wired",
      "dpi": 25600,
      "sensor": "Optical",
      "weight_g": 121
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000069",
    "name": "Chuột gaming có dây SteelSeries Rival 3 RGB Prism Lighting",
    "brand": "STEELSERIES",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000011",
      "category_code": "MOUSE",
      "category_name": "Chuột máy tính (Mouse)"
    },
    "description": "Chuột gaming form cầm đối xứng chất liệu polymer siêu bền, cảm biến TrueMove Core 8500 DPI, switch cơ học độ bền 60 triệu lần nhấn và viền LED Prism RGB.",
    "price": 790000,
    "stock_quantity": 50,
    "benchmark_score": 81.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000069.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71yIvLJ3PjL._AC_SL1500_.jpg"
    ],
    "specs": {
      "connection_type": "Wired",
      "dpi": 8500,
      "sensor": "Optical",
      "weight_g": 77
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000070",
    "name": "Card màn hình MSI GeForce RTX 4060 Ventus 2X Black 8GB GDDR6",
    "brand": "MSI",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Card màn hình 8GB VRAM tối ưu cho Gaming Full HD 1080p, kiến trúc Ada Lovelace tiết kiệm điện năng chỉ 115W, tản nhiệt quạt TORX 4.0.",
    "price": 8290000,
    "stock_quantity": 30,
    "benchmark_score": 85.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000070.jpg",
    "gallery_urls": [
      "https://storage-asset.msi.com/global/picture/product/product_1688029583cbf24a64860b21e86095fc3075c7e146.png"
    ],
    "specs": {
      "vram_gb": 8,
      "length_mm": 199.0,
      "tdp_w": 115.0,
      "recommended_psu_w": 550,
      "pcie_gen": 4.0,
      "vram_type": "GDDR6"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000071",
    "name": "Card màn hình ASUS Dual GeForce RTX 4070 White OC Edition 12GB GDDR6X",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000004",
      "category_code": "GPU",
      "category_name": "Card màn hình (VGA)"
    },
    "description": "Card đồ họa tone màu trắng tuyết sang trọng, 12GB GDDR6X băng thông cao, 2 quạt công nghệ Axial-tech với vòng bi quạt kép siêu bền.",
    "price": 16890000,
    "stock_quantity": 15,
    "benchmark_score": 91.5,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000071.jpg",
    "gallery_urls": [
      "https://dlcdnwebimgs.asus.com/files/media/64AEB53F-9092-4B6A-9148-FB36BFA9F9B1/v1/img/kv/ASUS-Dual-RTX4070-O12G-WHITE.png"
    ],
    "specs": {
      "vram_gb": 12,
      "length_mm": 267.0,
      "tdp_w": 200.0,
      "recommended_psu_w": 650,
      "pcie_gen": 4.0,
      "vram_type": "GDDR6X"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000072",
    "name": "Màn hình Gaming AOC 24G2SE 24 inch FHD VA 165Hz 1ms Cong",
    "brand": "AOC",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000009",
      "category_code": "MONITOR",
      "category_name": "Màn hình máy tính (Monitor)"
    },
    "description": "Màn hình gaming 24 inch FHD tấm nền VA độ tương phản 3500:1 sâu thẳm, tần số quét 165Hz, thời gian phản hồi 1ms MPRT, hỗ trợ HDR Mode.",
    "price": 2890000,
    "stock_quantity": 35,
    "benchmark_score": 83.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000072.jpg",
    "gallery_urls": [
      "https://down-id.img.susercontent.com/file/id-11134207-7qukx-lf60e4ey2o8t16"
    ],
    "specs": {
      "screen_size_inch": 24.0,
      "resolution": "FHD (1920x1080)",
      "refresh_rate_hz": 165,
      "panel_type": "VA",
      "response_time_ms": 1.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000073",
    "name": "Màn hình Gaming Samsung Odyssey G3 24 inch FHD VA 144Hz 1ms Chân xoay",
    "brand": "SAMSUNG",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000009",
      "category_code": "MONITOR",
      "category_name": "Màn hình máy tính (Monitor)"
    },
    "description": "Màn hình gaming 24 inch FHD 144Hz viền siêu mỏng 3 cạnh, chân đế công thái học nâng hạ và xoay 90 độ linh hoạt, bảo vệ mắt Eye Saver.",
    "price": 3190000,
    "stock_quantity": 28,
    "benchmark_score": 84.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000073.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81+37W3qr5L._AC_SL1500_.jpg"
    ],
    "specs": {
      "screen_size_inch": 24.0,
      "resolution": "FHD (1920x1080)",
      "refresh_rate_hz": 144,
      "panel_type": "VA",
      "response_time_ms": 1.0
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000074",
    "name": "Bàn phím cơ không dây Akko 3084B Plus Black & Cyan Brown Switch",
    "brand": "AKKO",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím cơ layout 84 phím nhỏ gọn, switch Akko CS Jelly Brown xúc giác êm ái, pin dung lượng 3000mAh, kết nối Bluetooth 5.0 và 2.4GHz.",
    "price": 1990000,
    "stock_quantity": 25,
    "benchmark_score": 85.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000074.png",
    "gallery_urls": [
      "https://img.terabyteshop.com.br/produto/g/teclado-gamer-mecanico-akko-3084b-plus-black-e-gold-rgb-ansi-switch-akko-jelly-purple_153285.png"
    ],
    "specs": {
      "connection_type": "Wireless",
      "switch_type": "Mechanical Brown",
      "layout": "75%",
      "led_type": "RGB"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000075",
    "name": "Bàn phím cơ có dây Razer Huntsman V2 Tenkeyless Optical Red Switch",
    "brand": "RAZER",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím gaming TKL sử dụng switch quang học tuyến tính Linear Optical thế hệ 2 siêu nhạy không độ trễ, foam tiêu âm tích hợp sẵn.",
    "price": 3490000,
    "stock_quantity": 18,
    "benchmark_score": 93.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000075.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81VbPK0fFqL._AC_.jpg"
    ],
    "specs": {
      "connection_type": "Wired",
      "switch_type": "Optical Switch",
      "layout": "Tenkeyless (TKL)",
      "led_type": "RGB"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000076",
    "name": "Chuột gaming không dây Razer Basilisk V3 Pro 30000 DPI RGB",
    "brand": "RAZER",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000011",
      "category_code": "MOUSE",
      "category_name": "Chuột máy tính (Mouse)"
    },
    "description": "Chuột công thái học cao cấp với con lăn nghiêng tự do HyperScroll, cảm biến quang Focus Pro 30K DPI, 13 vùng sáng Chroma RGB độc lập.",
    "price": 3690000,
    "stock_quantity": 15,
    "benchmark_score": 95.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000076.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/71A+MM44goL._AC_SL1500_.jpg"
    ],
    "specs": {
      "connection_type": "Wireless",
      "dpi": 30000,
      "sensor": "Optical",
      "weight_g": 112
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000077",
    "name": "Chuột gaming không dây ASUS ROG Harpe Ace Aim Lab Edition 32000 DPI",
    "brand": "ASUS",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000011",
      "category_code": "MOUSE",
      "category_name": "Chuột máy tính (Mouse)"
    },
    "description": "Chuột thi đấu hợp tác cùng Aim Lab, trọng lượng chỉ 54g, cảm biến ROG AimPoint 36000 DPI, kết nối ROG SpeedNova 2.4GHz siêu tốc.",
    "price": 3190000,
    "stock_quantity": 20,
    "benchmark_score": 94.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000077.png",
    "gallery_urls": [
      "https://dlcdnwebimgs.asus.com/gain/0F9B888C-4649-4829-B3C9-BDD8734907A4"
    ],
    "specs": {
      "connection_type": "Wireless",
      "dpi": 32000,
      "sensor": "Optical",
      "weight_g": 54
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000078",
    "name": "Chuột gaming có dây Razer Viper Mini 8500 DPI Siêu nhẹ 61g",
    "brand": "RAZER",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000011",
      "category_code": "MOUSE",
      "category_name": "Chuột máy tính (Mouse)"
    },
    "description": "Chuột gaming form nhỏ đối xứng siêu nhẹ 61g, switch quang học bền 50 triệu lần nhấn, cảm biến quang 8500 DPI, cáp bọc dù Speedflex.",
    "price": 690000,
    "stock_quantity": 40,
    "benchmark_score": 83.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000078.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/51cua+9874L._AC_SL1486_.jpg"
    ],
    "specs": {
      "connection_type": "Wired",
      "dpi": 8500,
      "sensor": "Optical",
      "weight_g": 61
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000079",
    "name": "Bo mạch chủ GIGABYTE Z790 AORUS ELITE AX DDR5 ATX",
    "brand": "GIGABYTE",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000002",
      "category_code": "MOTHERBOARD",
      "category_name": "Bo mạch chủ (Mainboard)"
    },
    "description": "Bo mạch chủ cao cấp cho CPU Intel Gen 12/13/14 LGA1700, dàn nguồn 16+1+2 phase VRM, 4 khe M.2 PCIe 4.0 tản nhiệt Thermal Guard, Wi-Fi 6E.",
    "price": 6990000,
    "stock_quantity": 16,
    "benchmark_score": 91.0,
    "image_url": "/images/products/e0000001-0000-0000-0000-000000000079.jpg",
    "gallery_urls": [
      "https://m.media-amazon.com/images/I/81a48Z1GciL._AC_.jpg"
    ],
    "specs": {
      "supported_sockets": [
        "LGA1700"
      ],
      "form_factor": "ATX",
      "supported_memory_types": [
        "DDR5"
      ],
      "ram_slots": 4,
      "max_ram_gb": 192,
      "m2_slots": 4,
      "max_pcie_gen": 5.0,
      "chipset": "Z790"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000080",
    "name": "Bàn phím cơ không dây Keychron K2 V2 Hot-swap Gateron G Pro Brown Switch (White LED)",
    "brand": "KEYCHRON",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím cơ không dây layout 75% phiên bản LED Đơn sắc trắng (White Backlight) thanh lịch, Hot-swap switch Gateron G Pro Brown tactile êm ái, pin 4000mAh dùng 240 giờ, hỗ trợ Bluetooth 5.1 và Type-C tương thích Mac & Windows.",
    "price": 1890000,
    "stock_quantity": 25,
    "benchmark_score": 86.0,
    "image_url": "https://assets.msy.com.au/newsite/images/202302/source_img/Keyboards-Keychron-K2-Pro-75-QMK-VIA-RGB-Wireless-Aluminium-Frame-Mechanical-Keyboard-Red-Switch-3.jpg",
    "gallery_urls": [
      "https://assets.msy.com.au/newsite/images/202302/source_img/Keyboards-Keychron-K2-Pro-75-QMK-VIA-RGB-Wireless-Aluminium-Frame-Mechanical-Keyboard-Red-Switch-3.jpg"
    ],
    "specs": {
      "connection_type": "Wireless",
      "switch_type": "Mechanical Brown",
      "layout": "75%",
      "led_type": "Monochrome"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000081",
    "name": "Bàn phím cơ có dây Logitech G413 SE Mechanical Gaming Keyboard White LED",
    "brand": "LOGITECH",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím cơ Fullsize 104 phím mặt vỏ hợp kim nhôm-magiê 5052 cao cấp, switch cơ Tactile nhạy bén bền bỉ, keycap PBT chống mài mòn, hệ thống đèn LED đơn sắc trắng sang trọng tinh tế.",
    "price": 1590000,
    "stock_quantity": 30,
    "benchmark_score": 84.0,
    "image_url": "https://d3mk240zzrnosz.cloudfront.net/assets/XC8040_logitech-g512-carbon-lightsync-rgb-mechanical-gaming-keyboard-with-gx-brown-switches_124960.jpg",
    "gallery_urls": [
      "https://d3mk240zzrnosz.cloudfront.net/assets/XC8040_logitech-g512-carbon-lightsync-rgb-mechanical-gaming-keyboard-with-gx-brown-switches_124960.jpg"
    ],
    "specs": {
      "connection_type": "Wired",
      "switch_type": "Mechanical Brown",
      "layout": "Fullsize 104",
      "led_type": "Monochrome"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000082",
    "name": "Bàn phím cơ có dây E-Dra EK387 Rainbow Huano Red Switch (Tenkeyless)",
    "brand": "E-DRA",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím cơ Tenkeyless TKL quốc dân cho học sinh sinh viên, trang bị switch Huano Red siêu mượt tuổi thọ 50 triệu lần bấm, hệ thống LED Rainbow phân vùng nhiều màu rực rỡ với nhiều chế độ nhấp nháy chuyển động.",
    "price": 650000,
    "stock_quantity": 50,
    "benchmark_score": 80.0,
    "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80"
    ],
    "specs": {
      "connection_type": "Wired",
      "switch_type": "Mechanical Red",
      "layout": "Tenkeyless (TKL)",
      "led_type": "Rainbow"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000083",
    "name": "Bàn phím cơ có dây DareU EK87 Multi-LED Rainbow Brown Switch",
    "brand": "DAREU",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím cơ layout TKL 87 phím nhỏ gọn, sử dụng switch cơ học DareU D-Switch Brown bền bỉ có khấc tactile, hệ thống đèn Multi-LED Rainbow cố định từng hàng sống động, keycap ABS Double-shot bền màu.",
    "price": 590000,
    "stock_quantity": 45,
    "benchmark_score": 79.0,
    "image_url": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80"
    ],
    "specs": {
      "connection_type": "Wired",
      "switch_type": "Mechanical Brown",
      "layout": "Tenkeyless (TKL)",
      "led_type": "Rainbow"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000084",
    "name": "Bàn phím cơ cao cấp Leopold FC750R PD White Grey Cherry MX Blue",
    "brand": "LEOPOLD",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím cơ Tenkeyless TKL tiêu chuẩn cao cấp đến từ Hàn Quốc, keycap PBT Double-shot dầy 1.5mm chống bóng tuyệt đối, switch Cherry MX Blue clicky giòn tan, vải đệm tiêu âm Sound Absorbing Pad dày dặn, hoàn toàn Không LED tập trung tối đa cảm giác gõ.",
    "price": 3250000,
    "stock_quantity": 15,
    "benchmark_score": 95.0,
    "image_url": "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [
      "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80"
    ],
    "specs": {
      "connection_type": "Wired",
      "switch_type": "Mechanical Blue",
      "layout": "Tenkeyless (TKL)",
      "led_type": "None"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  },
  {
    "product_id": "e0000001-0000-0000-0000-000000000085",
    "name": "Bàn phím cơ không dây Leopold FC900RBT Charcoal Blue Bluetooth Cherry MX Brown",
    "brand": "LEOPOLD",
    "category": {
      "category_id": "c0000001-0000-0000-0000-000000000010",
      "category_code": "KEYBOARD",
      "category_name": "Bàn phím cơ (Keyboard)"
    },
    "description": "Bàn phím cơ Fullsize 104 phím kết nối không dây Bluetooth 5.1 và Type-C, switch cơ cao cấp Cherry MX Brown tactile, thiết kế Không LED tiết kiệm pin sử dụng tới 3-4 tháng với 2 viên pin AAA, cảm giác gõ đỉnh cao.",
    "price": 3890000,
    "stock_quantity": 12,
    "benchmark_score": 96.0,
    "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    "gallery_urls": [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80"
    ],
    "specs": {
      "connection_type": "Wireless",
      "switch_type": "Mechanical Brown",
      "layout": "Fullsize 104",
      "led_type": "None"
    },
    "is_active": true,
    "sync_status": "SYNCED",
    "version": 0,
    "created_at": "2026-11-04T12:00:00Z",
    "updated_at": "2026-11-04T12:00:00Z"
  }
];
