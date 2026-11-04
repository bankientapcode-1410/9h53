import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { aiChatService } from '../../../services/aiChatService';
import { ChatMessage } from '../types/chat.types';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Chào bạn! Mình là **Chuyên gia AI SmartPC** 🤖

Mình có thể hỗ trợ bạn:
* 🖥️ **Tư vấn build PC trọn gói:** Theo ngân sách từ 10 - 100 triệu (Gaming, Đồ họa 3D, Văn phòng).
* 🔍 **Kiểm tra tương thích phần cứng:** Socket CPU vs Mainboard, công suất nguồn TDP, chuẩn RAM.
* ⚖️ **So sánh linh kiện:** Giữa Intel vs AMD, NVIDIA vs Radeon.
* 🚀 **Gợi ý lộ trình nâng cấp PC:** Khắc phục nghẽn cổ chai hiệu năng.

Bạn đang cần tư vấn cho nhu cầu hay ngân sách nào?`,
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
};

const DEFAULT_SUGGESTIONS = [
  '💡 Build PC gaming 15 triệu',
  '💡 Card đồ họa < 8 triệu tốt nhất',
  '💡 Nâng cấp từ i3 10100 lên gì?',
  '💡 Nguồn 550W kéo được RTX 4060 không?',
];

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await aiChatService.sendMessage({
        message: text,
        history,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
      if (!isOpen) {
        setHasUnread(true);
      }
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setSuggestions(DEFAULT_SUGGESTIONS);
  };

  const renderFormattedContent = (content: string) => {
    // Basic Markdown Parser for bold text and list bullets
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let formattedLine = line;

      // Handle bullet lists
      const isBullet = formattedLine.startsWith('* ') || formattedLine.startsWith('- ');
      if (isBullet) {
        formattedLine = formattedLine.substring(2);
      }

      // Parse **bold** parts
      const parts = formattedLine.split(/(\*\*[^*]+\*\*)/g);

      const parsedElements = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-smart-navy">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 pl-1 text-slate-700">
            <span className="text-smart-blue font-black mt-1 text-[10px]">•</span>
            <div className="flex-1">{parsedElements}</div>
          </div>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="my-0.5 leading-relaxed text-slate-700">
          {parsedElements}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-smart-navy via-slate-900 to-smart-blue text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border border-smart-cyan/30"
            title="Chat tư vấn với Chuyên gia AI SmartPC"
          >
            <div className="relative">
              <Bot className="w-6 h-6 text-smart-cyan animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
            </div>
            <span className="hidden sm:inline font-bold text-xs md:text-sm tracking-wide">
              Hỏi Chuyên Gia AI <Sparkles className="w-3.5 h-3.5 inline text-smart-cyan ml-0.5" />
            </span>

            {hasUnread && (
              <span className="absolute -top-1.5 -left-1.5 bg-smart-red text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-bounce">
                Mới
              </span>
            )}
          </button>
        )}
      </div>

      {/* Chat Popup Box */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[380px] sm:w-[420px] max-w-[calc(100vw-24px)] h-[580px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-smart-navy to-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-smart-blue flex items-center justify-center text-white shadow-inner border border-white/10">
                <Bot className="w-5 h-5 text-smart-cyan" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">Chuyên gia AI SmartPC</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                  <span className="text-emerald-400 font-semibold">Trực tuyến</span>
                  <span>• Tư vấn cấu hình & tương thích</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Làm mới cuộc trò chuyện"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Đóng hộp thoại"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs sm:text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-smart-blue text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="space-y-1">{renderFormattedContent(msg.content)}</div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-smart-blue/10 text-smart-blue flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot className="w-4 h-4 text-smart-blue" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center space-x-2">
                  <span className="text-xs text-slate-600 font-medium">Chuyên gia đang phân tích & tra cứu kho hàng...</span>
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-smart-blue rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-smart-cyan rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-smart-blue rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          {suggestions.length > 0 && !isLoading && (
            <div className="px-3.5 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
              <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap uppercase">
                Gợi ý:
              </span>
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug.replace('💡 ', ''))}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-smart-blue hover:border-smart-blue/30 text-slate-600 text-[11px] font-medium transition border border-slate-200/80 whitespace-nowrap flex-shrink-0"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Hỏi về build PC, chọn VGA, socket CPU..."
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-smart-blue focus:bg-white focus:outline-none rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-smart-blue hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition shadow-sm flex items-center justify-center flex-shrink-0"
                title="Gửi câu hỏi"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 px-0.5">
              <span>Hệ thống Chuyên gia AI SmartPC</span>
              <span className="flex items-center gap-0.5 text-emerald-600">
                <ShieldCheck className="w-3 h-3" />
                Đối soát Rule Engine
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
