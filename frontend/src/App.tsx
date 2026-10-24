import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  Cpu,
  ShoppingCart,
  Wrench,
  Layers,
  FolderTree,
  ShieldAlert,
  Bot,
  Search,
  Phone,
  User,
  CheckCircle2,
  Zap,
  ChevronDown,
  ShieldCheck,
  MapPin,
  Headphones,
} from 'lucide-react';

import { CategoryBrowsePage } from './features/product-catalog/pages/CategoryBrowsePage';
import { ProductDetailPage } from './features/product-catalog/pages/ProductDetailPage';
import { AdminProductListPage } from './features/admin/products/pages/AdminProductListPage';
import { AdminCategoryPage } from './features/admin/categories/pages/AdminCategoryPage';

const POPULAR_CATEGORIES = [
  { label: 'CPU / Vi xử lý', code: 'CPU' },
  { label: 'VGA / Card đồ họa', code: 'GPU' },
  { label: 'Mainboard / Bo mạch chủ', code: 'MOTHERBOARD' },
  { label: 'RAM', code: 'RAM' },
  { label: 'Ổ cứng SSD', code: 'SSD_M2' },
  { label: 'Nguồn PSU', code: 'PSU' },
  { label: 'Vỏ Case', code: 'CASE' },
  { label: 'Tản nhiệt & Phụ kiện', code: 'CPU_COOLER' },
];

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const activeCategory = searchParams.get('category') || '';
  const urlSearch = searchParams.get('search') || '';

  const [headerSearch, setHeaderSearch] = useState(urlSearch);

  useEffect(() => {
    setHeaderSearch(urlSearch);
  }, [urlSearch]);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (headerSearch.trim()) {
      nextParams.set('search', headerSearch.trim());
    } else {
      nextParams.delete('search');
    }
    nextParams.set('page', '0');
    navigate(`/products?${nextParams.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white text-slate-800 shadow-sm border-b border-slate-200">
      {/* Tier 1: Main Top Bar (Bright White) */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="bg-smart-blue p-2 rounded-xl text-white shadow-sm shadow-blue-500/20 flex items-center justify-center group-hover:bg-blue-700 transition">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-smart-navy">
                Smart<span className="text-smart-blue">PC</span>
              </span>
            </Link>
          </div>

          {/* Center Global Search Bar */}
          <form
            onSubmit={handleHeaderSearch}
            className="hidden sm:flex flex-1 max-w-xl items-center bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white border border-slate-200 focus-within:border-smart-blue focus-within:ring-2 focus-within:ring-smart-blue/15 rounded-full pl-4 pr-1.5 py-1 transition"
          >
            <Search className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Tìm kiếm linh kiện, VGA, CPU, PC Gaming..."
              className="w-full bg-transparent text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-smart-blue hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition shadow-sm flex-shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm kiếm</span>
            </button>
          </form>

          {/* Right Utilities & Switcher */}
          <div className="flex items-center space-x-2.5 md:space-x-3.5 flex-shrink-0">
            {/* Hotline */}
            <div className="hidden lg:flex items-center gap-2 pr-1">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-smart-blue flex items-center justify-center border border-blue-100">
                <Phone className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-slate-500 font-medium block">
                  Tổng đài tư vấn
                </span>
                <span className="text-xs font-extrabold text-smart-navy">1900 8899</span>
              </div>
            </div>

            {/* Language Selector */}
            <div className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
              <span>VN</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            {/* Store / Admin Switcher Pills (Bright Theme) */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center text-xs font-bold">
              <Link
                to="/products"
                className={`px-3 py-1 rounded-lg transition ${
                  !isAdminRoute
                    ? 'bg-smart-blue text-white shadow-sm'
                    : 'text-slate-600 hover:text-smart-navy'
                }`}
              >
                Store
              </Link>
              <Link
                to="/admin/products"
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                  isAdminRoute
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-smart-navy'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Admin</span>
              </Link>
            </div>

            {/* Cart Icon */}
            <Link
              to="/products"
              className="relative p-2 text-slate-700 hover:text-smart-blue hover:bg-blue-50 rounded-xl transition"
              title="Giỏ hàng SmartPC"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 bg-smart-red text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                2
              </span>
            </Link>

            {/* User / Login Button */}
            <Link
              to="/products"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-smart-blue font-bold text-xs border border-blue-200/80 transition"
            >
              <User className="w-4 h-4" />
              <span>Đăng nhập</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tier 2: Secondary Navigation Bar (Bright White) */}
      <div className="bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center justify-between text-xs md:text-sm">
          <nav className="flex items-center space-x-1 md:space-x-5 overflow-x-auto scrollbar-none font-semibold text-slate-700">
            <Link
              to="/products"
              className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                (location.pathname === '/' || location.pathname === '/products') && !activeCategory
                  ? 'text-smart-blue bg-blue-50/80 font-bold'
                  : 'hover:text-smart-blue hover:bg-slate-50'
              }`}
            >
              Sản phẩm
            </Link>

            <Link
              to="/products?category=CPU"
              className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeCategory
                  ? 'text-smart-blue bg-blue-50/80 font-bold'
                  : 'hover:text-smart-blue hover:bg-slate-50'
              }`}
            >
              Danh mục linh kiện
            </Link>

            <a
              href="/#builder"
              className="px-2.5 py-1.5 rounded-lg hover:text-smart-blue hover:bg-slate-50 flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Wrench className="w-3.5 h-3.5 text-smart-blue" />
              <span>PC Builder</span>
            </a>

            <a
              href="/#profile"
              className="px-2.5 py-1.5 rounded-lg hover:text-smart-blue hover:bg-slate-50 flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Bot className="w-3.5 h-3.5 text-smart-blue" />
              <span>PC Profile</span>
            </a>

            <a
              href="/#support"
              className="px-2.5 py-1.5 rounded-lg hover:text-smart-blue hover:bg-slate-50 flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Headphones className="w-3.5 h-3.5 text-slate-500" />
              <span>Hỗ trợ kỹ thuật</span>
            </a>
          </nav>

          {/* Trust Badges on Right */}
          <div className="hidden lg:flex items-center space-x-5 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Chính hãng 100%</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5 text-smart-blue">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Giao nhanh 2h</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tier 3: Popular Hardware Bar (Storefront) OR Bright Admin Submenu Bar (Admin) */}
      {isAdminRoute ? (
        <div className="bg-amber-50/90 border-t border-amber-200/80 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-4 md:gap-6 text-xs font-semibold overflow-x-auto scrollbar-none">
            <span className="text-amber-800 flex items-center gap-1.5 uppercase tracking-wider font-extrabold text-[11px] whitespace-nowrap">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Portal Quản Trị:
            </span>
            <Link
              to="/admin/products"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition whitespace-nowrap ${
                location.pathname === '/admin/products'
                  ? 'bg-white text-amber-800 font-bold border border-amber-300 shadow-sm'
                  : 'text-slate-600 hover:text-smart-navy hover:bg-white/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Linh kiện & Vector Specs (UC5)</span>
            </Link>
            <Link
              to="/admin/categories"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition whitespace-nowrap ${
                location.pathname === '/admin/categories'
                  ? 'bg-white text-amber-800 font-bold border border-amber-300 shadow-sm'
                  : 'text-slate-600 hover:text-smart-navy hover:bg-white/60'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-amber-600" />
              <span>Cây Danh Mục (2 Cấp)</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50/90 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
              <span className="font-bold text-slate-700">Phổ biến:</span>
              {POPULAR_CATEGORIES.map((item, index) => {
                const isSelected = activeCategory.toUpperCase() === item.code;
                return (
                  <React.Fragment key={item.code}>
                    {index > 0 && <span className="text-slate-300">•</span>}
                    <Link
                      to={`/products?category=${item.code}`}
                      className={`transition ${
                        isSelected
                          ? 'text-smart-blue font-bold underline underline-offset-4'
                          : 'text-slate-600 hover:text-smart-blue'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="hidden xl:flex items-center gap-3 flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI Compatibility Engine V4.2 Sẵn sàng
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-smart-blue" />
                Bảo hành 36T 1 đổi 1 tận nơi
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white text-slate-600 text-xs py-10 border-t border-slate-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="bg-smart-blue p-1.5 rounded-lg text-white flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-base font-black text-smart-navy">
                Smart<span className="text-smart-blue">PC</span>
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Nền tảng cấu hình & phân phối linh kiện PC chính hãng hàng đầu tại Việt Nam. Trải nghiệm build PC chuẩn hóa với hệ thống kiểm tra tương thích tự động.
            </p>
            <div className="space-y-1 text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-smart-blue" />
                <span>
                  Hotline: <strong className="text-smart-navy">1900 8899</strong> (8:00 - 21:30)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-smart-blue" />
                <span>Hà Nội & TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-smart-navy uppercase tracking-wider text-xs">
              Hệ sinh thái SmartPC
            </h4>
            <ul className="space-y-2 text-slate-500">
              <li>
                <Link to="/products" className="hover:text-smart-blue transition">
                  Kho linh kiện chính hãng (UC1a)
                </Link>
              </li>
              <li>
                <a href="/#builder" className="hover:text-smart-blue transition">
                  Công cụ Build PC & Rule Engine (UC2)
                </a>
              </li>
              <li>
                <a href="/#profile" className="hover:text-smart-blue transition">
                  Phân tích nghẽn cổ chai AI (UC3)
                </a>
              </li>
              <li>
                <Link to="/admin/products" className="hover:text-smart-blue transition">
                  Portal Quản trị viên (UC5 / UC6)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-smart-navy uppercase tracking-wider text-xs">
              Hỗ trợ khách hàng
            </h4>
            <ul className="space-y-2 text-slate-500">
              <li>Chính sách bảo hành 36T 1 đổi 1</li>
              <li>Hướng dẫn build PC bằng AI Engine</li>
              <li>Chính sách giao hàng siêu tốc 2H</li>
              <li>Tra cứu bảo hành theo Serial linh kiện</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-smart-navy uppercase tracking-wider text-xs">
              Phương thức thanh toán
            </h4>
            <p className="text-slate-500 leading-relaxed">
              Chấp nhận thanh toán thẻ Visa, MasterCard, VNPAY-QR, MoMo và Trả góp 0% lãi suất.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['VISA', 'MasterCard', 'VNPAY-QR', 'MoMo', 'COD'].map((item) => (
                <span
                  key={item}
                  className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Linh kiện chuẩn phân phối chính ngạch</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <span>© 2026 SmartPC Vietnam. Nền tảng cấu hình & phân phối linh kiện PC chính hãng.</span>
          <span className="text-[11px]">
            MySQL 8.0 JSON Specs • Spring AI Embedding text-embedding-004
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-smart-bg text-slate-800 font-sans">
        <Header />
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<CategoryBrowsePage />} />
            <Route path="/products" element={<CategoryBrowsePage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/admin/products" element={<AdminProductListPage />} />
            <Route path="/admin/categories" element={<AdminCategoryPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
