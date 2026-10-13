import { Cpu, Bot, CheckCircle2, ShoppingCart, Wrench } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-smart-bg text-slate-800">
      {/* Sticky Navy Header */}
      <header className="sticky top-0 z-50 bg-smart-navy text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-smart-blue p-2 rounded-lg text-white font-black tracking-wider flex items-center gap-1 text-lg">
              <Cpu className="w-6 h-6 text-smart-cyan" />
              <span>Smart<span className="text-smart-cyan">PC</span></span>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 hidden sm:inline">
              Rule Engine & AI Inside
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
            <a href="#home" className="text-white hover:text-smart-cyan transition">Trang chủ</a>
            <a href="#catalog" className="hover:text-smart-cyan transition">Danh mục</a>
            <a href="#builder" className="text-smart-cyan flex items-center gap-1.5 hover:underline">
              <Wrench className="w-4 h-4" /> PC Builder & Rule Check
            </a>
            <a href="#profile" className="hover:text-smart-cyan transition">PC Profile</a>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-300 hover:text-white transition">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-1 right-1 bg-smart-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
            </button>
            <button className="bg-smart-blue hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm">
              Đăng nhập
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full space-y-8">
        <section className="bg-gradient-to-r from-smart-navy via-slate-900 to-[#101b2b] text-white rounded-2xl p-8 md:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-smart-blue/20 border border-smart-blue/40 text-smart-cyan text-xs font-semibold">
              <Bot className="w-4 h-4" /> Gemini AI Hardware Reasoning Engine
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              Build PC Chuẩn Xác <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-smart-cyan to-blue-400">
                100% Không Xung Đột
              </span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg">
              Hệ thống tự động kiểm tra tương thích đa tầng (Socket, Bus RAM, TDP nguồn, Chiều dài VGA) với tốc độ &lt; 2ms, hỗ trợ phân tích điểm nghẽn bằng AI.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <button className="bg-smart-blue hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg flex items-center gap-2">
                <Wrench className="w-5 h-5" /> Bắt đầu Build PC ngay
              </button>
              <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl transition border border-slate-700 flex items-center gap-2">
                <Bot className="w-5 h-5 text-smart-cyan" /> Hỏi Chuyên Gia AI
              </button>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-smart-blue rounded-xl flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-smart-navy">Hardware Rule Engine</h3>
            <p className="text-sm text-slate-600">
              Bộ luật tương thích độc quyền lọc xung đột CPU socket, công suất nguồn PSU và chuẩn RAM real-time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-cyan-50 text-smart-cyan rounded-xl flex items-center justify-center font-bold">
              <Bot className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="font-bold text-lg text-smart-navy">AI Semantic Search</h3>
            <p className="text-sm text-slate-600">
              Truy vấn bằng ngôn ngữ tự nhiên: &quot;VGA dưới 8 triệu chơi mượt Cyberpunk&quot; được trích xuất ngữ nghĩa và đối soát thông số tự động.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-red-50 text-smart-red rounded-xl flex items-center justify-center font-bold">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-smart-navy">PC Profile & Bottleneck</h3>
            <p className="text-sm text-slate-600">
              Lưu giữ cấu hình máy hiện tại, AI phân tích điểm nghẽn hiệu năng và đề xuất lộ trình nâng cấp tối ưu chi phí.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-smart-navy text-slate-400 py-6 border-t border-slate-800 text-center text-xs">
        <p>© 2026 SmartPC Platform. Thiết kế kiến trúc Monolith Spring Boot + ReactJS.</p>
      </footer>
    </div>
  );
}
