// API Response Types
export interface ApiResponse {
  answer: string;
  sources?: string[];
  related_links?: RelatedLink[];
  confidence?: number;
  timestamp?: string;
}

export interface RelatedLink {
  title: string;
  url: string;
  description?: string;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
}

// Chat Message Types
export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  sources?: string[];
  relatedLinks?: RelatedLink[];
  isWelcome?: boolean;
}

// UI State Types
export interface UIState {
  isLoading: boolean;
  isModalOpen: boolean;
  isInputDisabled: boolean;
  currentQuery: string;
}

// API Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  apiKey?: string;
}

// Component Props Types
export interface MessageProps {
  message: ChatMessage;
  onSourceClick?: (url: string) => void;
}

export interface InputProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Event Types
export type MessageEventHandler = (message: ChatMessage) => void;
export type ErrorEventHandler = (error: ApiError) => void;
export type LoadingEventHandler = (isLoading: boolean) => void;

// Utility Types
export type MessageType = ChatMessage['type'];
export type MessageId = ChatMessage['id'];

// Application State
export interface AppState {
  messages: ChatMessage[];
  ui: UIState;
  config: ApiConfig;
}