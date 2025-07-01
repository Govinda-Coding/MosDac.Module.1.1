import './styles/main.scss';
import { ChatManager } from './chat';
import { UIManager } from './ui';
import type { ChatMessage, ApiError } from './types';

class MosdacChatApp {
  private chatManager: ChatManager;
  private uiManager: UIManager;
  private chatForm: HTMLFormElement;

  constructor() {
    this.chatManager = new ChatManager();
    this.uiManager = new UIManager();
    this.chatForm = document.getElementById('chatForm') as HTMLFormElement;

    this.initializeApp();
    this.setupEventListeners();
    this.loadExistingMessages();
  }

  private initializeApp(): void {
    // Set up chat event handlers
    this.chatManager.onMessage((message: ChatMessage) => {
      this.uiManager.addMessageToChat(message);
      
      // Hide quick actions after first user message
      if (message.type === 'user' && this.chatManager.getMessages().length > 1) {
        this.uiManager.hideQuickActions();
      }
    });

    this.chatManager.onLoadingChange((isLoading: boolean) => {
      if (isLoading) {
        this.uiManager.showLoading();
      } else {
        this.uiManager.hideLoading();
      }
    });

    this.chatManager.onError((error: ApiError) => {
      console.error('Chat error:', error);
      this.showErrorNotification(error.message);
    });

    console.log('MOSDAC Chat App initialized successfully');
  }

  private setupEventListeners(): void {
    // Chat form submission
    this.chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleMessageSubmit();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const userInput = document.getElementById('userInput') as HTMLInputElement;
        userInput?.focus();
      }

      // Ctrl/Cmd + L to clear chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        this.clearChat();
      }
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible, focus input if no modal is open
        const modal = document.getElementById('infoModal');
        if (!modal?.classList.contains('active')) {
          const userInput = document.getElementById('userInput') as HTMLInputElement;
          userInput?.focus();
        }
      }
    });

    // Handle connection status
    window.addEventListener('online', () => {
      this.showNotification('Connection restored', 'success');
    });

    window.addEventListener('offline', () => {
      this.showNotification('Connection lost. Some features may not work.', 'warning');
    });
  }

  private async handleMessageSubmit(): Promise<void> {
    const inputValue = this.uiManager.getInputValue();
    
    if (!inputValue || this.chatManager.isCurrentlyLoading()) {
      return;
    }

    try {
      this.uiManager.clearInput();
      await this.chatManager.sendMessage(inputValue);
    } catch (error) {
      console.error('Error sending message:', error);
      this.showErrorNotification('Failed to send message. Please try again.');
    }
  }

  private loadExistingMessages(): void {
    // Load welcome message and any existing messages
    const messages = this.chatManager.getMessages();
    messages.forEach(message => {
      this.uiManager.addMessageToChat(message);
    });
  }

  private clearChat(): void {
    // Clear chat history
    this.chatManager.clearMessages();
    
    // Clear UI
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
      chatWindow.innerHTML = '';
    }
    
    // Reload welcome message
    this.loadExistingMessages();
    
    // Show quick actions again
    this.uiManager.showQuickActions();
    
    this.showNotification('Chat cleared', 'success');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-surface);
      color: var(--color-text-primary);
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid ${type === 'error' ? '#FF4444' : type === 'warning' ? '#FF8800' : '#00C851'};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 1001;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  private showErrorNotification(message: string): void {
    this.showNotification(message, 'error');
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MosdacChatApp();
});

// Add notification animations to head
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);