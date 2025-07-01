import type { ChatMessage, MessageEventHandler, ErrorEventHandler, LoadingEventHandler, ApiError } from './types';
import { mockApiClient } from './api';

export class ChatManager {
  private messages: ChatMessage[] = [];
  private messageHandlers: MessageEventHandler[] = [];
  private errorHandlers: ErrorEventHandler[] = [];
  private loadingHandlers: LoadingEventHandler[] = [];
  private isLoading = false;

  constructor() {
    this.addWelcomeMessage();
  }

  private addWelcomeMessage(): void {
    const welcomeMessage: ChatMessage = {
      id: this.generateMessageId(),
      type: 'bot',
      content: 'Welcome to MOSDAC Virtual Assistant! I can help you find information about satellite data, products, and services. What would you like to know?',
      timestamp: new Date(),
      isWelcome: true,
    };

    this.addMessage(welcomeMessage);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.loadingHandlers.forEach(handler => handler(loading));
  }

  private addMessage(message: ChatMessage): void {
    this.messages.push(message);
    this.messageHandlers.forEach(handler => handler(message));
  }

  private handleError(error: ApiError): void {
    this.errorHandlers.forEach(handler => handler(error));
    
    // Add error message to chat
    const errorMessage: ChatMessage = {
      id: this.generateMessageId(),
      type: 'bot',
      content: `I apologize, but I'm experiencing some technical difficulties. ${error.message} Please try again in a moment.`,
      timestamp: new Date(),
    };

    this.addMessage(errorMessage);
  }

  async sendMessage(content: string): Promise<void> {
    if (this.isLoading || !content.trim()) {
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    this.addMessage(userMessage);
    this.setLoading(true);

    try {
      // Get AI response
      const response = await mockApiClient.askQuestion(content);

      // Add bot response
      const botMessage: ChatMessage = {
        id: this.generateMessageId(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
        relatedLinks: response.related_links,
      };

      this.addMessage(botMessage);
    } catch (error) {
      this.handleError(error as ApiError);
    } finally {
      this.setLoading(false);
    }
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
    this.addWelcomeMessage();
  }

  onMessage(handler: MessageEventHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onError(handler: ErrorEventHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  onLoadingChange(handler: LoadingEventHandler): () => void {
    this.loadingHandlers.push(handler);
    return () => {
      const index = this.loadingHandlers.indexOf(handler);
      if (index > -1) {
        this.loadingHandlers.splice(index, 1);
      }
    };
  }

  isCurrentlyLoading(): boolean {
    return this.isLoading;
  }
}