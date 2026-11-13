import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Loader2,
} from 'lucide-react';
import { aiChatService } from '../../../services/aiChatService';
import { productService } from '../../../services/productService';
import { ProductSummaryDTO } from '../../product-catalog/types/product.types';
import { ChatResponse } from '../types/chat.types';
import { ProductCard } from '../../product-catalog/components/ProductCard';

const SAMPLE_PROMPTS = [
  'Card màn hình dưới 8 triệu chơi game mượt',
  'Build PC gaming 15 triệu chiến mọi game eSports',
  'Cấu hình làm đồ họa 3D và render Premiere tầm 25 triệu',
  'Nâng cấp RAM và SSD cho máy tính văn phòng',
];

export function AISearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [aiData, setAiData] = useState<ChatResponse | null>(null);
  const [products, setProducts] = useState<ProductSummaryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Đếm giây thời gian phân tích thực tế để người dùng thấy hệ thống đang làm việc
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setInputQuery(q);
    setActiveQuery(q);
    if (q.trim()) {
      executeAISearch(q);
    }
  }, [searchParams]);

  const executeAISearch = async (queryText: string) => {
    setIsLoading(true);
    try {
      // 1. Gọi Chat AI Gemini để phân tích và tư vấn
      const aiRes = await aiChatService.sendMessage({ message: queryText });
      setAiData(aiRes);

      // 2. Tìm kiếm sản phẩm theo ngữ nghĩa & ý định phần cứng kết hợp đề xuất từ AI
      const prodRes = await productService.searchSemantic(queryText, aiRes?.reply);
      if (prodRes && prodRes.data && prodRes.data.content) {
        setProducts(prodRes.data.content);
      }
    } catch (err) {
      console.error('Lỗi khi gọi tìm kiếm AI:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    setSearchParams({ q: inputQuery.trim() });
  };

  const handlePromptClick = (prompt: string) => {
    setInputQuery(prompt);
    setSearchParams({ q: prompt });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-smart-navy via-slate-900 to-[#101b2b] text-white rounded-2xl p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-smart-cyan/15 border border-smart-cyan/30 text-smart-cyan text-xs font-bold">
            <Bot className="w-4 h-4" />
            <span>Chuyên gia AI SmartPC • Phân tích & Tư vấn Phần cứng</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black leading-tight">
            Tìm Kiếm & Tư Vấn Linh Kiện Bằng <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-smart-cyan to-blue-400">
              Trí Tuệ Nhân Tạo AI
            </span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Nhập yêu cầu bằng ngôn ngữ tự nhiên: mục đích sử dụng, mức giá dự kiến hoặc tựa game muốn chơi. AI sẽ phân tích thông số và tư vấn cấu hình phù hợp 100%.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="VD: Card đồ họa dưới 8 triệu chơi game mượt, CPU dựng video Premiere..."
                className="w-full bg-slate-800/90 text-white placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-11 pr-4 py-3.5 border border-slate-700 focus:border-smart-cyan focus:outline-none focus:ring-2 focus:ring-smart-cyan/20 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="bg-smart-blue hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 flex-shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 text-smart-cyan animate-spin" />
                  <span>Đang phân tích...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-smart-cyan" />
                  <span>Gửi câu hỏi cho AI</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Prompts */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold">Gợi ý câu hỏi:</span>
            {SAMPLE_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(p)}
                className="text-[11px] px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modern High-Visibility AI Analyzing Box */}
      {isLoading && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-smart-navy to-[#0d162b] border border-blue-500/40 p-6 sm:p-8 shadow-2xl text-white space-y-5">
          {/* Running Top Laser Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-smart-cyan to-smart-blue animate-pulse" />

          {/* Header trạng thái */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
            <div className="flex items-center space-x-3.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-smart-blue/30 border border-smart-cyan/50 flex items-center justify-center text-smart-cyan shadow-lg shadow-smart-cyan/20">
                  <Bot className="w-7 h-7 text-smart-cyan animate-bounce" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg text-white">
                    Chuyên gia AI SmartPC đang phân tích
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-smart-cyan/20 text-smart-cyan border border-smart-cyan/40">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Thời gian: {elapsedSeconds}s</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Đang xử lý yêu cầu: <span className="text-smart-cyan font-bold font-mono">"{activeQuery}"</span>
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Đối soát quy tắc tương thích phần cứng</span>
            </div>
          </div>

          {/* Thanh chỉ báo nhịp thở suy nghĩ */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-smart-cyan animate-ping inline-block flex-shrink-0" />
            <span>
              {elapsedSeconds < 3 && 'Đang gửi câu hỏi và ngữ cảnh phần cứng tới mô hình AI...'}
              {elapsedSeconds >= 3 && elapsedSeconds < 7 && 'Đang tính toán cấu hình tối ưu hiệu năng/giá thành (P/P)...'}
              {elapsedSeconds >= 7 && elapsedSeconds < 12 && 'Đang rà soát giá niêm yết và tồn kho thực tế tại SmartPC...'}
              {elapsedSeconds >= 12 && 'Đang hoàn tất bản phân tích chi tiết & danh mục linh kiện...'}
            </span>
          </div>
        </div>
      )}

      {/* AI Analysis Panel (Khi đã phân tích xong) */}
      {!isLoading && aiData && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200/60 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-smart-blue text-white flex items-center justify-center shadow-sm">
                <Bot className="w-6 h-6 text-smart-cyan" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-smart-navy flex items-center gap-2">
                  <span>Lời Khuyên Của Chuyên Gia AI</span>
                  <span className="bg-blue-100 text-smart-blue text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200">
                    Phân tích ngữ cảnh
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Truy vấn: &quot;{activeQuery}&quot;
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Đối soát quy tắc tương thích</span>
            </div>
          </div>

          {/* AI Markdown Advice Content */}
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-2 whitespace-pre-wrap">
            {aiData.reply}
          </div>

          {/* Suggestions */}
          {aiData.suggestions && aiData.suggestions.length > 0 && (
            <div className="pt-4 border-t border-blue-200/60 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Câu hỏi tiếp theo:</span>
              {aiData.suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(sug)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-smart-blue hover:text-white text-smart-blue text-xs font-semibold transition border border-blue-200 shadow-2xs"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Matching Products Grid */}
      {!isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-smart-navy flex items-center gap-2">
              <Cpu className="w-5 h-5 text-smart-blue" />
              <span>{activeQuery ? `Linh kiện phù hợp với "${activeQuery}"` : 'Linh kiện đề xuất phù hợp'}</span>
              {products.length > 0 && (
                <span className="text-xs font-semibold text-slate-500">
                  ({products.length} sản phẩm)
                </span>
              )}
            </h2>

            <Link
              to="/products"
              className="text-xs font-bold text-smart-blue hover:underline flex items-center gap-1"
            >
              <span>Xem toàn bộ danh mục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
              <p>Hãy nhập câu hỏi phía trên để chuyên gia AI tư vấn cấu hình và linh kiện phù hợp nhất cho bạn.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
