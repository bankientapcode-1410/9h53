import re
import json

CATEGORIES = {
    'c0000001-0000-0000-0000-000000000001': {'category_id': 'c0000001-0000-0000-0000-000000000001', 'category_code': 'CPU', 'category_name': 'Bộ vi xử lý (CPU)'},
    'c0000001-0000-0000-0000-000000000002': {'category_id': 'c0000001-0000-0000-0000-000000000002', 'category_code': 'MOTHERBOARD', 'category_name': 'Bo mạch chủ (Mainboard)'},
    'c0000001-0000-0000-0000-000000000003': {'category_id': 'c0000001-0000-0000-0000-000000000003', 'category_code': 'RAM', 'category_name': 'Bộ nhớ trong (RAM)'},
    'c0000001-0000-0000-0000-000000000004': {'category_id': 'c0000001-0000-0000-0000-000000000004', 'category_code': 'GPU', 'category_name': 'Card màn hình (VGA)'},
    'c0000001-0000-0000-0000-000000000005': {'category_id': 'c0000001-0000-0000-0000-000000000005', 'category_code': 'SSD_M2', 'category_name': 'Ổ cứng SSD M.2 NVMe'},
    'c0000001-0000-0000-0000-000000000006': {'category_id': 'c0000001-0000-0000-0000-000000000006', 'category_code': 'PSU', 'category_name': 'Nguồn máy tính (PSU)'},
    'c0000001-0000-0000-0000-000000000007': {'category_id': 'c0000001-0000-0000-0000-000000000007', 'category_code': 'CASE', 'category_name': 'Vỏ máy tính (Case)'},
    'c0000001-0000-0000-0000-000000000008': {'category_id': 'c0000001-0000-0000-0000-000000000008', 'category_code': 'CPU_COOLER', 'category_name': 'Tản nhiệt CPU'},
    'c0000001-0000-0000-0000-000000000009': {'category_id': 'c0000001-0000-0000-0000-000000000009', 'category_code': 'MONITOR', 'category_name': 'Màn hình máy tính (Monitor)'},
    'c0000001-0000-0000-0000-000000000010': {'category_id': 'c0000001-0000-0000-0000-000000000010', 'category_code': 'KEYBOARD', 'category_name': 'Bàn phím cơ (Keyboard)'},
    'c0000001-0000-0000-0000-000000000011': {'category_id': 'c0000001-0000-0000-0000-000000000011', 'category_code': 'MOUSE', 'category_name': 'Chuột máy tính (Mouse)'},
}

def parse_json_expr(expr):
    def _jo(*args):
        d = {}
        for i in range(0, len(args), 2):
            d[args[i]] = args[i+1]
        return d
    def _ja(*args):
        return list(args)
    s = expr.strip()
    s = re.sub(r'\bJSON_OBJECT\b', '_jo', s, flags=re.IGNORECASE)
    s = re.sub(r'\bJSON_ARRAY\b', '_ja', s, flags=re.IGNORECASE)
    s = re.sub(r'\btrue\b', 'True', s, flags=re.IGNORECASE)
    s = re.sub(r'\bfalse\b', 'False', s, flags=re.IGNORECASE)
    s = re.sub(r'\bnull\b', 'None', s, flags=re.IGNORECASE)
    return eval(s, {'_jo': _jo, '_ja': _ja})

def extract_products_from_sql(sql_content):
    products = []
    pattern = re.compile(
        r"\(\s*'([a-f0-9-]+)',\s*"             # product_id (1)
        r"'((?:''|[^'])*)',\s*"               # name (2)
        r"'((?:''|[^'])*)',\s*"               # brand (3)
        r"'((?:''|[^'])*)',\s*"               # description (4)
        r"(JSON_OBJECT\s*\(.*?\)),\s*"        # specs (5)
        r"'((?:''|[^'])*)',\s*"               # image_url (6)
        r"(JSON_ARRAY\s*\(.*?\)),\s*"         # gallery_urls (7)
        r"([0-9.]+),\s*"                      # price (8)
        r"([0-9]+),\s*"                       # stock_quantity (9)
        r"([0-9.]+),\s*"                      # benchmark_score (10)
        r"'([A-Z]+)',\s*"                     # sync_status (11)
        r"(true|false),\s*"                   # is_active (12)
        r"'([a-f0-9-]+)'",                    # category_id (13)
        re.DOTALL | re.IGNORECASE
    )

    matches = pattern.findall(sql_content)
    for m in matches:
        pid, name, brand, desc, specs_str, img, gallery_str, price, stock, bench, sync, active, cat_id = m
        p = {
            'product_id': pid,
            'name': name.replace("''", "'"),
            'brand': brand.replace("''", "'"),
            'category': CATEGORIES.get(cat_id, {'category_id': cat_id, 'category_code': 'UNKNOWN', 'category_name': 'Unknown'}),
            'description': desc.replace("''", "'"),
            'price': int(float(price)),
            'stock_quantity': int(stock),
            'benchmark_score': float(bench),
            'image_url': img,
            'gallery_urls': parse_json_expr(gallery_str),
            'specs': parse_json_expr(specs_str),
            'is_active': active.lower() == 'true',
            'sync_status': sync,
            'version': 0,
            'created_at': '2026-11-04T12:00:00Z',
            'updated_at': '2026-11-04T12:00:00Z'
        }
        products.append(p)
    return products

migrations = [
    'backend/src/main/resources/db/migration/V5__seed_product_inventory.sql',
    'backend/src/main/resources/db/migration/V6__peripherals_and_expanded_inventory.sql',
    'backend/src/main/resources/db/migration/V7__supplemental_test_seed_coverage.sql',
    'backend/src/main/resources/db/migration/V11__expand_keyboard_led_types_and_products.sql',
]

prod_map = {}
order = []
for m in migrations:
    with open(m, 'r', encoding='utf-8') as f:
        content = f.read()
    prods = extract_products_from_sql(content)
    for p in prods:
        pid = p['product_id']
        prod_map[pid] = p
        if pid not in order:
            order.append(pid)

# Apply V8 (Name and description fixes)
with open('backend/src/main/resources/db/migration/V8__fix_seed_product_font_encoding.sql', 'r', encoding='utf-8') as f:
    v8_content = f.read()

v8_updates = re.findall(
    r"UPDATE products\s+SET\s+name\s*=\s*'((?:''|[^'])*)',\s+description\s*=\s*'((?:''|[^'])*)'.*?WHERE\s+product_id\s*=\s*'([a-f0-9-]+)'",
    v8_content,
    re.DOTALL | re.IGNORECASE
)
for name, desc, pid in v8_updates:
    if pid in prod_map:
        prod_map[pid]['name'] = name.replace("''", "'")
        prod_map[pid]['description'] = desc.replace("''", "'")

# Apply V9 (normalize keyboard layout)
for p in prod_map.values():
    if p['category']['category_code'] == 'KEYBOARD':
        layout = p['specs'].get('layout', '')
        if isinstance(layout, str) and layout.lower().startswith('compact '):
            p['specs']['layout'] = re.sub(r'(?i)compact\s+', '', layout)

# Apply V10 (images update)
with open('backend/src/main/resources/db/migration/V10__update_product_images_accuracy.sql', 'r', encoding='utf-8') as f:
    v10_content = f.read()

v10_updates = re.findall(
    r"UPDATE products\s+SET\s+image_url\s*=\s*'((?:''|[^'])*)',\s+gallery_urls\s*=\s*(JSON_ARRAY\s*\(.*?\)).*?WHERE\s+product_id\s*=\s*'([a-f0-9-]+)'",
    v10_content,
    re.DOTALL | re.IGNORECASE
)
for img, gallery_str, pid in v10_updates:
    if pid in prod_map:
        prod_map[pid]['image_url'] = img
        prod_map[pid]['gallery_urls'] = parse_json_expr(gallery_str)

final_products = [prod_map[pid] for pid in order]
print(f"Total verified products: {len(final_products)}")

mock_category_tree = """export const MOCK_CATEGORY_TREE: CategoryTreeDTO[] = [
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
];"""

mock_specs_schema = """export const MOCK_SPECS_SCHEMA: Record<string, SpecMetadataDTO> = {
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
};"""

products_json = json.dumps(final_products, ensure_ascii=False, indent=2)

file_content = f"""import {{
  CategoryTreeDTO,
  AdminProductDTO,
  SpecMetadataDTO,
}} from '../features/product-catalog/types/product.types';

{mock_category_tree}

{mock_specs_schema}

export const MOCK_PRODUCTS: AdminProductDTO[] = {products_json};
"""

with open('frontend/src/services/mockData.ts', 'w', encoding='utf-8') as f:
    f.write(file_content)

print("Successfully written frontend/src/services/mockData.ts with", len(final_products), "products!")

# Also generate scripts/seed-products.sql
sql_rows = []
for p in final_products:
    def esc(s):
        return s.replace("'", "''")
    pid = p['product_id']
    name = esc(p['name'])
    brand = esc(p['brand'])
    desc = esc(p['description'])
    specs_json = json.dumps(p['specs'], ensure_ascii=False).replace("'", "''")
    img = esc(p['image_url'])
    gallery_json = json.dumps(p['gallery_urls'], ensure_ascii=False).replace("'", "''")
    price = p['price']
    stock = p['stock_quantity']
    bench = p['benchmark_score']
    active = 'true' if p['is_active'] else 'false'
    cat_id = p['category']['category_id']
    sql_rows.append(f"('{pid}', '{name}', '{brand}', '{desc}', '{specs_json}', '{img}', '{gallery_json}', {price}, {stock}, {bench}, 'SYNCED', {active}, '{cat_id}', 0, NOW(), NOW())")

sql_content = f"""-- ============================================================================
-- scripts/seed-products.sql
-- Seed dữ liệu toàn bộ 85 sản phẩm kho hàng SmartPC (UC1a, UC2, UC4, UC5)
-- Bao gồm 8 danh mục linh kiện cốt lõi & 3 danh mục ngoại vi (Monitor, Keyboard, Mouse)
-- ============================================================================

USE smartpc_db;

-- 1. Đảm bảo nhóm cấp 1 và danh mục ngoại vi đã tồn tại
INSERT IGNORE INTO categories (category_id, category_code, category_name, description, parent_category_id, created_at, updated_at) VALUES
('g0000001-0000-0000-0000-000000000004', 'PERIPHERALS', 'Màn hình & Thiết bị ngoại vi', 'Màn hình máy tính, bàn phím cơ, chuột gaming cao cấp', NULL, NOW(), NOW()),
('c0000001-0000-0000-0000-000000000009', 'MONITOR', 'Màn hình máy tính (Monitor)', 'Màn hình Gaming, Đồ họa IPS/OLED 144Hz-240Hz', 'g0000001-0000-0000-0000-000000000004', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000010', 'KEYBOARD', 'Bàn phím cơ (Keyboard)', 'Bàn phím cơ Gaming, văn phòng, switch cơ học, wireless', 'g0000001-0000-0000-0000-000000000004', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000011', 'MOUSE', 'Chuột máy tính (Mouse)', 'Chuột gaming không dây/có dây, cảm biến quang học DPI cao', 'g0000001-0000-0000-0000-000000000004', NOW(), NOW());

-- 2. Chèn 85 sản phẩm vào bảng products
INSERT IGNORE INTO products (
    product_id, name, brand, description, specs, image_url, gallery_urls,
    price, stock_quantity, benchmark_score, sync_status, is_active, category_id,
    version, created_at, updated_at
) VALUES
""" + ",\n".join(sql_rows) + ";\n"

with open('scripts/seed-products.sql', 'w', encoding='utf-8') as f:
    f.write(sql_content)

print("Successfully updated scripts/seed-products.sql with 85 products!")
