-- ============================================================================
-- V10__update_product_images_accuracy.sql
-- Chuẩn hóa & Đa dạng hóa Hình ảnh Linh kiện & Ngoại vi chính xác theo Tên Niêm Yết
-- Áp dụng cho 79 sản phẩm: Local image_url + Upstream CDN gallery_urls
-- ============================================================================

-- [CASE] Vỏ máy tính NZXT H5 Flow RGB Black Mid-Tower
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000023.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81SwxuNUxdL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000023';

-- [CASE] Vỏ máy tính Montech AIR 903 MAX Black E-ATX
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000024.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/91U5KxXJDgL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000024';

-- [CASE] Vỏ máy tính Lian Li O11 Dynamic EVO RGB Black
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000025.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/712giHWFxxL.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000025';

-- [CASE] Vỏ Case Montech AIR 100 ARGB Black Micro-ATX
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000047.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71+vC54eAdS._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000047';

-- [CASE] Vỏ Case Lian Li O11 Dynamic EVO Black ATX
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000048.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71x-3P9loBL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000048';

-- [CPU] Bộ vi xử lý Intel Core i5-13600K (Up to 5.1GHz, 14 Cores 20 Threads, 24MB Cache)
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000001.jpg',
    gallery_urls = JSON_ARRAY('https://tpucdn.com/cpu-specs/images/chips/2829-front.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000001';

-- [CPU] Bộ vi xử lý Intel Core i7-14700K (Up to 5.6GHz, 20 Cores 28 Threads, 33MB Cache)
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000002.jpg',
    gallery_urls = JSON_ARRAY('https://tpucdn.com/cpu-specs/images/chips/3067-front.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000002';

-- [CPU] Bộ vi xử lý AMD Ryzen 7 7800X3D (4.2GHz~5.0GHz, 8 Cores 16 Threads, 104MB Cache, Socket AM5)
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000003.jpg',
    gallery_urls = JSON_ARRAY('https://tpucdn.com/cpu-specs/images/chips/2990-front.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000003';

-- [CPU] Bộ vi xử lý AMD Ryzen 5 7600 (3.8GHz~5.1GHz, 6 Cores 12 Threads, 38MB Cache, Socket AM5)
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000004.jpg',
    gallery_urls = JSON_ARRAY('https://tpucdn.com/cpu-specs/images/chips/2988-front.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000004';

-- [CPU] Bộ vi xử lý Intel Core i5-13400F (Up to 4.6GHz, 10 Cores 16 Threads, 20MB Cache)
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000029.jpg',
    gallery_urls = JSON_ARRAY('https://tpucdn.com/cpu-specs/images/chips/2927-front.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000029';

-- [CPU] Bộ vi xử lý Intel Core i5-14600KF (Up to 5.3GHz, 14 Cores 20 Threads, 24MB Cache)
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000030.jpg',
    gallery_urls = JSON_ARRAY('https://tpucdn.com/cpu-specs/images/chips/3070-front.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000030';

-- [CPU] Bộ vi xử lý AMD Ryzen 5 7500F (3.7GHz~5.0GHz, 6 Cores 12 Threads, 38MB Cache, Socket AM5)
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000031.jpg',
    gallery_urls = JSON_ARRAY('https://tpucdn.com/cpu-specs/images/chips/3042-front.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000031';

-- [CPU_COOLER] Tản nhiệt khí CPU Thermalright Peerless Assassin 120 SE
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000026.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71sEMx7F+TL._SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000026';

-- [CPU_COOLER] Tản nhiệt nước AIO DeepCool LT720 360mm Black
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000027.jpg',
    gallery_urls = JSON_ARRAY('https://www.pcstudio.in/wp-content/uploads/2022/12/Deepcool-LT720-360mm-Liquid-Cooler-Black-3.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000027';

-- [CPU_COOLER] Tản nhiệt nước AIO NZXT Kraken 240 RGB White
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000028.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/51WFKhfnDvL._SL1000_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000028';

-- [CPU_COOLER] Tản nhiệt khí Deepcool AK620 Digital Black
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000049.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71jl2CxNoxL._SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000049';

-- [CPU_COOLER] Tản nhiệt nước Deepcool LS520 SE 240mm ARGB
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000050.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71ToR4zOJbL._SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000050';

-- [CPU_COOLER] Tản nhiệt nước NZXT Kraken 360 RGB Black
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000051.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/41Yat2-orIL._SL1000_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000051';

-- [GPU] Card màn hình ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000013.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81O6t+EEjLL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000013';

-- [GPU] Card màn hình MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000014.jpg',
    gallery_urls = JSON_ARRAY('https://storage-asset.msi.com/global/picture/product/product_1704770020d2c3dfa5cfd37e293021f4bc5ea35593.png'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000014';

-- [GPU] Card màn hình GIGABYTE Radeon RX 7800 XT GAMING OC 16GB
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000015.jpg',
    gallery_urls = JSON_ARRAY('https://philong.com.vn/media/product/30678-vga-gigabyte-radeon-rx-7800-xt-gaming-oc-16gd-philong-1.png'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000015';

-- [GPU] Card màn hình ASUS ROG Strix GeForce RTX 4090 OC Edition 24GB
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000016.png',
    gallery_urls = JSON_ARRAY('https://dlcdnwebimgs.asus.com/gain/2486AE38-B7C7-443A-9615-FD08D5430992/w1000/h732'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000016';

-- [GPU] Card màn hình GIGABYTE GeForce RTX 4070 WINDFORCE OC 12GB
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000039.jpg',
    gallery_urls = JSON_ARRAY('https://philong.com.vn/media/product/29845-vga-gigabyte-geforce-rtx-4070-windforce-oc-12g-philong-1.png'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000039';

-- [GPU] Card màn hình MSI GeForce RTX 4080 SUPER 16GB GAMING X SLIM
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000040.jpg',
    gallery_urls = JSON_ARRAY('https://storage-asset.msi.com/global/picture/product/product_1704768393e157774d6c4125b20625d9961f5c6e83.png'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000040';

-- [GPU] Card màn hình MSI GeForce RTX 4060 Ventus 2X Black 8GB GDDR6
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000070.jpg',
    gallery_urls = JSON_ARRAY('https://storage-asset.msi.com/global/picture/product/product_1688029583cbf24a64860b21e86095fc3075c7e146.png'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000070';

-- [GPU] Card màn hình ASUS Dual GeForce RTX 4070 White OC Edition 12GB GDDR6X
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000071.jpg',
    gallery_urls = JSON_ARRAY('https://dlcdnwebimgs.asus.com/files/media/64AEB53F-9092-4B6A-9148-FB36BFA9F9B1/v1/img/kv/ASUS-Dual-RTX4070-O12G-WHITE.png'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000071';

-- [KEYBOARD] Bàn phím cơ không dây Akko 5075B Plus Dracula Castle RGB
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000058.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/S/aplus-media-library-service-media/23bdac8a-7688-4c1f-b059-871b25f04dbb.__CR0,0,970,600_PT0_SX970_V1___.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000058';

-- [KEYBOARD] Bàn phím cơ không dây Keychron K2 Pro QMK/VIA Red Switch RGB
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000059.jpg',
    gallery_urls = JSON_ARRAY('https://assets.msy.com.au/newsite/images/202302/source_img/Keyboards-Keychron-K2-Pro-75-QMK-VIA-RGB-Wireless-Aluminium-Frame-Mechanical-Keyboard-Red-Switch-3.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000059';

-- [KEYBOARD] Bàn phím cơ có dây Corsair K70 RGB PRO Cherry MX Red Fullsize 104
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000060.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81NHLnqXopL.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000060';

-- [KEYBOARD] Bàn phím cơ có dây Logitech G512 Carbon Lightsync RGB Brown Switch Fullsize
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000061.jpg',
    gallery_urls = JSON_ARRAY('https://d3mk240zzrnosz.cloudfront.net/assets/XC8040_logitech-g512-carbon-lightsync-rgb-mechanical-gaming-keyboard-with-gx-brown-switches_124960.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000061';

-- [KEYBOARD] Bàn phím cơ SteelSeries Apex Pro TKL OmniPoint Switch Có dây
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000062.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/719h65mTOEL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000062';

-- [KEYBOARD] Bàn phím cơ không dây ASUS ROG Strix Scope II 96 Wireless ROG NX Snow
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000063.jpg',
    gallery_urls = JSON_ARRAY('https://dlcdnwebimgs.asus.com/files/media/3F98C626-65EF-4A7A-9EB4-8EFA04C0B6B3/v2/img/omni/bg.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000063';

-- [KEYBOARD] Bàn phím cơ không dây Akko 3084B Plus Black & Cyan Brown Switch
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000074.png',
    gallery_urls = JSON_ARRAY('https://img.terabyteshop.com.br/produto/g/teclado-gamer-mecanico-akko-3084b-plus-black-e-gold-rgb-ansi-switch-akko-jelly-purple_153285.png'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000074';

-- [KEYBOARD] Bàn phím cơ có dây Razer Huntsman V2 Tenkeyless Optical Red Switch
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000075.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81VbPK0fFqL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000075';

-- [MONITOR] Màn hình Gaming LG UltraGear 24GN65R-B 24 inch FHD IPS 144Hz 1ms
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000052.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/715tAlRV1oL.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000052';

-- [MONITOR] Màn hình Gaming ASUS TUF Gaming VG249Q3A 24 inch FHD Fast IPS 180Hz 1ms
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000053.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/7175R2o27XL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000053';

-- [MONITOR] Màn hình Gaming LG UltraGear 27GP850-B 27 inch 2K QHD Nano IPS 165Hz
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000054.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81z8iO86p9L._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000054';

-- [MONITOR] Màn hình Gaming ASUS ROG Strix XG27ACS 27 inch 2K QHD Fast IPS 180Hz Type-C
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000055.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71uwdOrLQML._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000055';

-- [MONITOR] Màn hình Đồ họa Dell UltraSharp U3223QE 31.5 inch 4K UHD IPS Black Type-C Hub
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000056.png',
    gallery_urls = JSON_ARRAY('https://philong.com.vn/media/product/27447-man-hinh-dell-ultrasharp-u3223qe-philong-1.png'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000056';

-- [MONITOR] Màn hình Gaming Samsung Odyssey Neo G7 32 inch 4K UHD 165Hz Mini-LED
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000057.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81F6CeKEkzL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000057';

-- [MONITOR] Màn hình Gaming AOC 24G2SE 24 inch FHD VA 165Hz 1ms Cong
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000072.jpg',
    gallery_urls = JSON_ARRAY('https://down-id.img.susercontent.com/file/id-11134207-7qukx-lf60e4ey2o8t16'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000072';

-- [MONITOR] Màn hình Gaming Samsung Odyssey G3 24 inch FHD VA 144Hz 1ms Chân xoay
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000073.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81+37W3qr5L._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000073';

-- [MOTHERBOARD] Bo mạch chủ ASUS ROG STRIX B760-A GAMING WIFI D4
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000005.png',
    gallery_urls = JSON_ARRAY('https://dlcdnwebimgs.asus.com/files/media/7D58E51C-E86B-4746-881D-A6DB99216A36/v1/img/kv/ROG-Strix-B760-A-Gaming.png'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000005';

-- [MOTHERBOARD] Bo mạch chủ MSI MAG Z790 TOMAHAWK WIFI DDR5
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000006.webp',
    gallery_urls = JSON_ARRAY('https://storage-asset.msi.com/global/picture/product/product_1664265391459c76c55d481a806150407f1b07a6bb.webp'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000006';

-- [MOTHERBOARD] Bo mạch chủ GIGABYTE B650 AORUS ELITE AX
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000007.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81JFKzNyl+L._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000007';

-- [MOTHERBOARD] Bo mạch chủ ASRock B650M-HDV/M.2 Micro-ATX
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000008.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81sUb3eg3YL._AC_SX679_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000008';

-- [MOTHERBOARD] Bo mạch chủ MSI PRO B760M-P DDR4 Micro-ATX
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000032.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/91dC-a6V6rL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000032';

-- [MOTHERBOARD] Bo mạch chủ ASUS TUF GAMING B650-PLUS WIFI ATX
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000033.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81SXll1-k8L._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000033';

-- [MOTHERBOARD] Bo mạch chủ MSI PRO B650M-A WIFI Micro-ATX
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000034.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81r6gJjhzHL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000034';

-- [MOTHERBOARD] Bo mạch chủ GIGABYTE Z790 AORUS ELITE AX DDR5 ATX
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000079.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81a48Z1GciL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000079';

-- [MOUSE] Chuột gaming không dây Logitech G Pro X Superlight 2 Lightspeed Black
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000064.png',
    gallery_urls = JSON_ARRAY('https://philong.com.vn/media/product/31096-chuot-khong-day-logitech-g-pro-x-superlight-2-black-philong--1-.png'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000064';

-- [MOUSE] Chuột gaming không dây Razer Viper V2 Pro Ultra-lightweight White
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000065.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/61PZvXc7UFL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000065';

-- [MOUSE] Chuột gaming không dây Pulsar X2V2 Wireless Black Size 2
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000066.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/51142H3ylVL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000066';

-- [MOUSE] Chuột gaming có dây Razer DeathAdder V3 Ultra-lightweight Black
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000067.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/61HIJnrPojL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000067';

-- [MOUSE] Chuột gaming có dây Logitech G502 HERO High Performance 25600 DPI
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000068.webp',
    gallery_urls = JSON_ARRAY('https://resource.logitechg.com/w_544,h_466,c_pad,q_auto,f_auto/d_transparent.gif/content/dam/gaming/en/products/g502-hero/g502-hero-gallery-1.png'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000068';

-- [MOUSE] Chuột gaming có dây SteelSeries Rival 3 RGB Prism Lighting
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000069.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71yIvLJ3PjL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000069';

-- [MOUSE] Chuột gaming không dây Razer Basilisk V3 Pro 30000 DPI RGB
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000076.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71A+MM44goL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000076';

-- [MOUSE] Chuột gaming không dây ASUS ROG Harpe Ace Aim Lab Edition 32000 DPI
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000077.png',
    gallery_urls = JSON_ARRAY('https://dlcdnwebimgs.asus.com/gain/0F9B888C-4649-4829-B3C9-BDD8734907A4'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000077';

-- [MOUSE] Chuột gaming có dây Razer Viper Mini 8500 DPI Siêu nhẹ 61g
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000078.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/51cua+9874L._AC_SL1486_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000078';

-- [PSU] Nguồn máy tính Corsair CV650 650W 80 Plus Bronze
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000020.webp',
    gallery_urls = JSON_ARRAY('https://elitehubs.com/cdn/shop/products/1-1-6.png?v=1695323233'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000020';

-- [PSU] Nguồn máy tính MSI MAG A750GL PCIE5 750W 80 Plus Gold Modular
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000021.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/716c-SjLwPL.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000021';

-- [PSU] Nguồn máy tính Corsair RM850e 850W 80 Plus Gold Full Modular
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000022.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71CnFDhomCL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000022';

-- [PSU] Nguồn máy tính Corsair CV650 650W 80 Plus Bronze
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000044.webp',
    gallery_urls = JSON_ARRAY('https://elitehubs.com/cdn/shop/products/1-1-6.png?v=1695323233'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000044';

-- [PSU] Nguồn máy tính GIGABYTE UD750GM 750W 80 Plus Gold Full Modular
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000045.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71t3GTuR8pL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000045';

-- [PSU] Nguồn máy tính Corsair RM850e 850W 80 Plus Gold ATX 3.0
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000046.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71UlVM3qc5L._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000046';

-- [RAM] RAM Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz Black
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000009.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71lmVVC09jL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000009';

-- [RAM] RAM Kingston Fury Beast RGB 32GB (2x16GB) DDR4 3600MHz
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000010.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71CpgA2mMCL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000010';

-- [RAM] RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz Black
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000011.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71AV5PQu1yL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000011';

-- [RAM] RAM G.Skill Trident Z5 RGB 64GB (2x32GB) DDR5 6000MHz Silver
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000012.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71fq1NtkAPL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000012';

-- [RAM] Bộ nhớ RAM Kingston FURY Beast Black 16GB (2x8GB) DDR4 3200MHz
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000035.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/61uXihcspuL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000035';

-- [RAM] Bộ nhớ RAM Corsair Vengeance RGB RS 32GB (2x16GB) DDR4 3600MHz
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000036.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71JPAVZ-pfL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000036';

-- [RAM] Bộ nhớ RAM Kingston FURY Beast RGB 32GB (2x16GB) DDR5 5600MHz
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000037.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/61OkIqQkxBL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000037';

-- [RAM] Bộ nhớ RAM Corsair Dominator Titanium RGB 64GB (2x32GB) DDR5 6000MHz
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000038.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71Tyd3prKVL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000038';

-- [SSD_M2] Ổ cứng SSD Kingston NV2 500GB M.2 2280 NVMe PCIe 4.0
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000017.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81qEG5iHiML.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000017';

-- [SSD_M2] Ổ cứng SSD Samsung 990 PRO 1TB M.2 PCIe Gen 4.0 x4 NVMe
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000018.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71bLTK7y9lL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000018';

-- [SSD_M2] Ổ cứng SSD Crucial T700 2TB PCIe Gen 5.0 x4 NVMe M.2
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000019.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/51F8pWLLVeL._AC_SL1500_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000019';

-- [SSD_M2] Ổ cứng SSD Kingston KC3000 1TB M.2 PCIe 4.0 NVMe
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000041.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/61pz6mN3ghL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000041';

-- [SSD_M2] Ổ cứng SSD Samsung 990 PRO 2TB M.2 PCIe 4.0 NVMe
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000042.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/81WuG6lQuDL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000042';

-- [SSD_M2] Ổ cứng SSD Kingston NV2 500GB M.2 PCIe 4.0 NVMe
UPDATE products
SET 
    image_url = '/images/products/e0000001-0000-0000-0000-000000000043.jpg',
    gallery_urls = JSON_ARRAY('https://m.media-amazon.com/images/I/71lCFgczaBL._AC_.jpg'),
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000043';
