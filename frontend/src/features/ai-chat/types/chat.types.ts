// ==========================================
// SmartPC AI Chat Types (DD-UC1-AI-CHAT)
// ==========================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  history?: Array<{
    role: string;
    content: string;
  }>;
}

export interface ChatResponse {
  reply: string;
  suggestions?: string[];
  is_fallback?: boolean;
  fallback?: boolean;
}

