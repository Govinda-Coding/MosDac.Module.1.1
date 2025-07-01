import type { ChatMessage } from './types';

export class UIManager {
  private chatWindow: HTMLElement;
  private userInput: HTMLInputElement;
  private sendButton: HTMLButtonElement;
  private loadingIndicator: HTMLElement;
  private infoModal: HTMLElement;
  private quickActions: HTMLElement;

  constructor() {
    this.chatWindow = document.getElementById('chatWindow')!;
    this.userInput = document.getElementById('userInput') as HTMLInputElement;
    this.sendButton = document.getElementById('sendButton') as HTMLButtonElement;
    this.loadingIndicator = document.getElementById('loadingIndicator')!;
    this.infoModal = document.getElementById('infoModal')!;
    this.quickActions = document.getElementById('quickActions')!;

    this.setupInputValidation();
    this.setupModalHandlers();
    this.setupQuickActions();
    this.setupAccessibility();
  }

  private setupInputValidation(): void {
    this.userInput.addEventListener('input', () => {
      const hasContent = this.userInput.value.trim().length > 0;
      this.sendButton.disabled = !hasContent;
    });

    // Handle Enter key
    this.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!this.sendButton.disabled) {
          this.sendButton.click();
        }
      }
    });
  }

  private setupModalHandlers(): void {
    const infoButton = document.getElementById('infoButton')!;
    const closeModal = document.getElementById('closeModal')!;

    infoButton.addEventListener('click', () => {
      this.openModal();
    });

    closeModal.addEventListener('click', () => {
      this.closeModal();
    });

    // Close modal on backdrop click
    this.infoModal.addEventListener('click', (e) => {
      if (e.target === this.infoModal) {
        this.closeModal();
      }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.infoModal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  private setupQuickActions(): void {
    this.quickActions.addEventListener('click', (e) => {
      const button = (e.target as HTMLElement).closest('.quick-action-btn') as HTMLButtonElement;
      if (button) {
        const query = button.dataset.query;
        if (query) {
          this.userInput.value = query;
          this.userInput.focus();
          this.sendButton.disabled = false;
        }
      }
    });
  }

  private setupAccessibility(): void {
    // Announce new messages to screen readers
    this.chatWindow.setAttribute('aria-live', 'polite');
    this.chatWindow.setAttribute('aria-relevant', 'additions');

    // Focus management
    document.addEventListener('DOMContentLoaded', () => {
      this.userInput.focus();
    });
  }

  openModal(): void {
    this.infoModal.classList.add('active');
    this.infoModal.setAttribute('aria-hidden', 'false');
    
    // Focus the close button
    const closeButton = this.infoModal.querySelector('.modal-close') as HTMLElement;
    closeButton?.focus();
  }

  closeModal(): void {
    this.infoModal.classList.remove('active');
    this.infoModal.setAttribute('aria-hidden', 'true');
    
    // Return focus to info button
    const infoButton = document.getElementById('infoButton') as HTMLElement;
    infoButton?.focus();
  }

  showLoading(): void {
    this.loadingIndicator.classList.add('active');
    this.loadingIndicator.setAttribute('aria-hidden', 'false');
    this.userInput.disabled = true;
    this.sendButton.disabled = true;
  }

  hideLoading(): void {
    this.loadingIndicator.classList.remove('active');
    this.loadingIndicator.setAttribute('aria-hidden', 'true');
    this.userInput.disabled = false;
    this.sendButton.disabled = this.userInput.value.trim().length === 0;
  }

  addMessageToChat(message: ChatMessage): void {
    const messageElement = this.createMessageElement(message);
    this.chatWindow.appendChild(messageElement);
    this.scrollToBottom();
    
    // Announce to screen readers
    this.announceMessage(message);
  }

  private createMessageElement(message: ChatMessage): HTMLElement {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}-message ${message.isWelcome ? 'welcome-message' : ''}`;
    messageDiv.setAttribute('role', 'article');
    messageDiv.setAttribute('aria-label', `${message.type} message`);

    let avatarHtml = '';
    if (message.type === 'bot') {
      avatarHtml = `
        <div class="message-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="satellite-icon">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      `;
    }

    let sourcesHtml = '';
    if (message.sources && message.sources.length > 0) {
      const sourceLinks = message.sources.map((source, index) => 
        `<a href="${source}" target="_blank" rel="noopener" class="source-link">Source ${index + 1}</a>`
      ).join(' • ');
      
      sourcesHtml = `
        <div class="message-sources">
          <strong>Sources:</strong> ${sourceLinks}
        </div>
      `;
    }

    messageDiv.innerHTML = `
      ${avatarHtml}
      <div class="message-content">
        <div class="message-text">${this.formatMessageContent(message.content)}</div>
        ${sourcesHtml}
      </div>
    `;

    return messageDiv;
  }

  private formatMessageContent(content: string): string {
    // Basic formatting - convert line breaks and links
    return content
      .replace(/\n/g, '<br>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  private announceMessage(message: ChatMessage): void {
    // Create a temporary element for screen reader announcement
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('aria-live', 'assertive');
    announcement.textContent = `${message.type === 'bot' ? 'Assistant' : 'You'}: ${message.content}`;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  private scrollToBottom(): void {
    this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
  }

  clearInput(): void {
    this.userInput.value = '';
    this.sendButton.disabled = true;
    this.userInput.focus();
  }

  getInputValue(): string {
    return this.userInput.value.trim();
  }

  hideQuickActions(): void {
    this.quickActions.style.display = 'none';
  }

  showQuickActions(): void {
    this.quickActions.style.display = 'flex';
  }
}