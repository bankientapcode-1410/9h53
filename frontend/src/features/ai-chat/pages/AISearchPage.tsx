import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  Cpu,
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
      const aiPromise = aiChatService.sendMessage({ message: queryText });

      // 2. Đồng thời lấy sản phẩm phù hợp từ Catalog
      const prodPromise = productService.getProducts({
        search: queryText,
        page: 0,
        size: 8,
      });

      const [aiRes, prodRes] = await Promise.all([aiPromise, prodPromise]);

      setAiData(aiRes);
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
            <span>SmartPC AI Hardware Reasoning • Google Gemini 1.5</span>
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
              <Sparkles className="w-4 h-4 text-smart-cyan" />
              <span>Gửi câu hỏi cho AI</span>
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

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          </div>
          <div className="h-24 bg-slate-50 rounded-xl" />
        </div>
      )}

      {/* AI Analysis Panel (Screen 2a) */}
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
              <span>Linh kiện đề xuất phù hợp</span>
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
