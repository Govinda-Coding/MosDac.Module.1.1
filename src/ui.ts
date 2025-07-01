import type { 
  ChatMessage, 
  SatelliteStatusInfo, 
  MissionTimelineItem, 
  ConversationContext,
  PanelType,
  VoiceResult
} from './types';

export class CosmicUIManager {
  // Core UI elements
  private conversationArea: HTMLElement;
  private commandInput: HTMLInputElement;
  private executeButton: HTMLButtonElement;
  private voiceButton: HTMLButtonElement;
  private commandProcessor: HTMLElement;
  private conversationBreadcrumb: HTMLElement;
  private quickNavigation: HTMLElement;
  
  // Panel elements
  private satellitePanel: HTMLElement;
  private timelineDrawer: HTMLElement;
  private idleHelper: HTMLElement;
  
  // State management
  private conversationContext: ConversationContext;
  private isVoiceActive: boolean = false;
  private idleTimer: number = 0;
  private lastActivity: number = Date.now();
  
  // Voice recognition
  private recognition: any = null;

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.setupAccessibility();
    this.setupVoiceInput();
    this.initializeConversationContext();
    this.startIdleDetection();
  }

  private initializeElements(): void {
    this.conversationArea = document.getElementById('conversationArea')!;
    this.commandInput = document.getElementById('commandInput') as HTMLInputElement;
    this.executeButton = document.getElementById('executeButton') as HTMLButtonElement;
    this.voiceButton = document.getElementById('voiceInput') as HTMLButtonElement;
    this.commandProcessor = document.getElementById('commandProcessor')!;
    this.conversationBreadcrumb = document.getElementById('conversationBreadcrumb')!;
    this.quickNavigation = document.getElementById('quickNavigation')!;
    this.satellitePanel = document.getElementById('satelliteStatusPanel')!;
    this.timelineDrawer = document.getElementById('timelineDrawer')!;
    this.idleHelper = document.getElementById('idleHelper')!;
  }

  private setupEventListeners(): void {
    // Input validation and state management
    this.commandInput.addEventListener('input', () => {
      this.updateInputState();
      this.recordActivity();
    });

    // Enhanced keyboard handling
    this.commandInput.addEventListener('keydown', (e) => {
      this.handleKeyboardInput(e);
    });

    // Panel controls
    this.setupPanelControls();
    
    // Quick navigation
    this.setupQuickNavigation();
    
    // Voice input toggle
    this.voiceButton.addEventListener('click', () => {
      this.toggleVoiceInput();
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleGlobalShortcuts(e);
    });

    // Panel close handlers
    this.setupPanelCloseHandlers();
    
    // Idle helper dismiss
    const helperDismiss = this.idleHelper.querySelector('.helper-dismiss');
    helperDismiss?.addEventListener('click', () => {
      this.dismissIdleHelper();
    });
  }

  private setupPanelControls(): void {
    const satelliteBtn = document.getElementById('satellitePanel');
    const timelineBtn = document.getElementById('missionTimeline');
    const contrastBtn = document.getElementById('contrastToggle');

    satelliteBtn?.addEventListener('click', () => {
      this.togglePanel('satellite_status');
    });

    timelineBtn?.addEventListener('click', () => {
      this.togglePanel('mission_timeline');
    });

    contrastBtn?.addEventListener('click', () => {
      this.toggleHighContrastMode();
    });
  }

  private setupQuickNavigation(): void {
    this.quickNavigation.addEventListener('click', (e) => {
      const chip = (e.target as HTMLElement).closest('.nav-chip') as HTMLButtonElement;
      if (chip) {
        const query = chip.dataset.query;
        const category = chip.dataset.category;
        
        if (query) {
          this.setInputValue(query);
          this.updateConversationBreadcrumb(category || 'general');
          this.focusInput();
        }
      }
    });
  }

  private setupPanelCloseHandlers(): void {
    // Satellite panel close
    const satCloseBtn = this.satellitePanel.querySelector('.panel-close');
    satCloseBtn?.addEventListener('click', () => {
      this.closePanel('satellite_status');
    });

    // Timeline drawer close
    const timelineCloseBtn = this.timelineDrawer.querySelector('.panel-close');
    timelineCloseBtn?.addEventListener('click', () => {
      this.closePanel('mission_timeline');
    });

    // Close panels on backdrop click
    [this.satellitePanel, this.timelineDrawer].forEach(panel => {
      panel.addEventListener('click', (e) => {
        if (e.target === panel) {
          const panelType = panel.id === 'satelliteStatusPanel' ? 'satellite_status' : 'mission_timeline';
          this.closePanel(panelType as PanelType);
        }
      });
    });
  }

  private setupAccessibility(): void {
    // ARIA live region setup
    this.conversationArea.setAttribute('aria-live', 'polite');
    this.conversationArea.setAttribute('aria-relevant', 'additions');

    // Focus management
    this.commandInput.focus();

    // High contrast mode detection
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    if (prefersHighContrast) {
      document.body.classList.add('high-contrast');
    }
  }

  private setupVoiceInput(): void {
    // Check for Web Speech API support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      this.recognition.onstart = () => {
        this.setVoiceInputState(true);
      };
      
      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        if (event.results[event.results.length - 1].isFinal) {
          this.setInputValue(transcript);
          this.setVoiceInputState(false);
        } else {
          // Show interim results
          this.commandInput.placeholder = `Listening: "${transcript}"`;
        }
      };
      
      this.recognition.onerror = () => {
        this.setVoiceInputState(false);
        this.showNotification('Voice input error. Please try again.', 'error');
      };
      
      this.recognition.onend = () => {
        this.setVoiceInputState(false);
        this.commandInput.placeholder = 'Enter your query about satellite data and services...';
      };
    } else {
      // Hide voice button if not supported
      this.voiceButton.style.display = 'none';
    }
  }

  private initializeConversationContext(): void {
    this.conversationContext = {
      sessionId: this.generateSessionId(),
      breadcrumbs: ['INITIAL_CONTACT'],
      queryHistory: []
    };
    
    this.updateConversationBreadcrumb('INITIAL_CONTACT');
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleKeyboardInput(e: KeyboardEvent): void {
    // Enter to submit (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!this.executeButton.disabled) {
        this.executeButton.click();
      }
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
      this.clearInput();
    }
    
    // Arrow up/down for command history (future feature)
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      this.navigateCommandHistory(e.key === 'ArrowUp' ? -1 : 1);
    }
  }

  private handleGlobalShortcuts(e: KeyboardEvent): void {
    // Ctrl/Cmd + K for focus input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.focusInput();
    }
    
    // Ctrl/Cmd + L for clear conversation
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
      e.preventDefault();
      this.clearConversation();
    }
    
    // Escape to close panels
    if (e.key === 'Escape') {
      this.closeAllPanels();
    }
    
    // Ctrl/Cmd + 1-9 for quick actions
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      this.triggerQuickAction(parseInt(e.key) - 1);
    }
  }

  private startIdleDetection(): void {
    const IDLE_THRESHOLD = 15000; // 15 seconds
    
    const resetIdleTimer = () => {
      this.lastActivity = Date.now();
      this.dismissIdleHelper();
    };
    
    // Track user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });
    
    // Check for idle state
    setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - this.lastActivity;
      
      if (timeSinceActivity > IDLE_THRESHOLD && !this.idleHelper.classList.contains('active')) {
        this.showIdleHelper();
      }
    }, 5000);
  }

  // Public Methods

  public updateInputState(): void {
    const hasContent = this.commandInput.value.trim().length > 0;
    this.executeButton.disabled = !hasContent;
    
    // Add visual feedback for active input
    const container = this.commandInput.closest('.terminal-container');
    if (hasContent) {
      container?.classList.add('active');
    } else {
      container?.classList.remove('active');
    }
  }

  public showProcessing(status: string = 'Analyzing satellite data query...'): void {
    const statusElement = document.getElementById('processingStatus');
    if (statusElement) {
      statusElement.textContent = status;
    }
    
    this.commandProcessor.classList.add('active');
    this.commandProcessor.setAttribute('aria-hidden', 'false');
    this.setInputDisabled(true);
  }

  public hideProcessing(): void {
    this.commandProcessor.classList.remove('active');
    this.commandProcessor.setAttribute('aria-hidden', 'true');
    this.setInputDisabled(false);
  }

  public addMessageToConversation(message: ChatMessage): void {
    const messageElement = this.createMessageElement(message);
    this.conversationArea.appendChild(messageElement);
    this.scrollToBottom();
    
    // Update conversation context
    if (message.type === 'user') {
      this.conversationContext.queryHistory.push(message.content);
      this.conversationContext.lastQuery = message.content;
    }
    
    if (message.queryType) {
      this.updateConversationBreadcrumb(message.queryType);
    }
    
    // Announce to screen readers
    this.announceMessage(message);
  }

  private createMessageElement(message: ChatMessage): HTMLElement {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}-message ${message.isWelcome ? 'welcome-message' : ''}`;
    messageDiv.setAttribute('role', 'article');
    messageDiv.setAttribute('aria-label', `${message.type} message at ${message.timestamp.toLocaleTimeString()}`);

    let avatarHtml = '';
    if (message.type === 'bot') {
      avatarHtml = `
        <div class="message-avatar">
          <svg class="satellite-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      `;
    }

    let sourcesHtml = '';
    if (message.sources && message.sources.length > 0) {
      const sourceLinks = message.sources.map((source, index) => 
        `<a href="${source}" target="_blank" rel="noopener" class="source-link" data-source="${index}">Source ${index + 1}</a>`
      ).join(' • ');
      
      sourcesHtml = `
        <div class="message-sources">
          <strong>Sources:</strong> ${sourceLinks}
        </div>
      `;
    }

    let satelliteDataHtml = '';
    if (message.satelliteData && message.satelliteData.length > 0) {
      const satelliteChips = message.satelliteData.map(sat => 
        `<span class="satellite-chip" data-satellite="${sat.name}">${sat.name}</span>`
      ).join('');
      
      satelliteDataHtml = `
        <div class="message-satellites">
          <strong>Related Satellites:</strong> ${satelliteChips}
        </div>
      `;
    }

    messageDiv.innerHTML = `
      ${avatarHtml}
      <div class="message-bubble">
        <div class="message-content">${this.formatMessageContent(message.content)}</div>
        ${sourcesHtml}
        ${satelliteDataHtml}
      </div>
    `;

    // Add click handlers for interactive elements
    this.addMessageInteractivity(messageDiv, message);

    return messageDiv;
  }

  private formatMessageContent(content: string): string {
    // Enhanced content formatting
    return content
      .replace(/\n/g, '<br>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" class="inline-link">$1</a>')
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  private addMessageInteractivity(element: HTMLElement, message: ChatMessage): void {
    // Source link clicks
    element.querySelectorAll('.source-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const url = (link as HTMLAnchorElement).href;
        this.handleSourceClick(url);
      });
    });

    // Satellite chip clicks
    element.querySelectorAll('.satellite-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const satelliteName = chip.getAttribute('data-satellite');
        if (satelliteName) {
          this.handleSatelliteClick(satelliteName);
        }
      });
    });
  }

  private handleSourceClick(url: string): void {
    // Analytics or tracking can be added here
    console.log('Source clicked:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private handleSatelliteClick(satelliteName: string): void {
    // Auto-populate input with satellite query
    this.setInputValue(`Tell me more about ${satelliteName}`);
    this.focusInput();
  }

  public togglePanel(panelType: PanelType): void {
    const panels = {
      satellite_status: this.satellitePanel,
      mission_timeline: this.timelineDrawer
    };

    const panel = panels[panelType];
    if (!panel) return;

    const isActive = panel.classList.contains('active');
    
    // Close all other panels first
    Object.values(panels).forEach(p => p.classList.remove('active'));
    
    // Toggle the requested panel
    if (!isActive) {
      panel.classList.add('active');
      this.recordActivity();
    }
  }

  public closePanel(panelType: PanelType): void {
    const panels = {
      satellite_status: this.satellitePanel,
      mission_timeline: this.timelineDrawer
    };

    const panel = panels[panelType];
    panel?.classList.remove('active');
  }

  public closeAllPanels(): void {
    [this.satellitePanel, this.timelineDrawer].forEach(panel => {
      panel.classList.remove('active');
    });
  }

  public toggleVoiceInput(): void {
    if (!this.recognition) return;

    if (this.isVoiceActive) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  private setVoiceInputState(active: boolean): void {
    this.isVoiceActive = active;
    
    if (active) {
      this.voiceButton.classList.add('recording');
      this.voiceButton.setAttribute('aria-label', 'Stop voice input');
    } else {
      this.voiceButton.classList.remove('recording');
      this.voiceButton.setAttribute('aria-label', 'Start voice input');
    }
  }

  public toggleHighContrastMode(): void {
    document.body.classList.toggle('high-contrast');
    const isHighContrast = document.body.classList.contains('high-contrast');
    
    localStorage.setItem('highContrast', isHighContrast.toString());
    
    this.showNotification(
      `High contrast mode ${isHighContrast ? 'enabled' : 'disabled'}`,
      'success'
    );
  }

  public updateConversationBreadcrumb(topic: string): void {
    this.conversationContext.currentTopic = topic;
    this.conversationContext.breadcrumbs.push(topic.toUpperCase());
    
    const displayText = `SESSION: ${topic.toUpperCase()}`;
    this.conversationBreadcrumb.textContent = displayText;
  }

  public setInputValue(value: string): void {
    this.commandInput.value = value;
    this.updateInputState();
  }

  public getInputValue(): string {
    return this.commandInput.value.trim();
  }

  public clearInput(): void {
    this.commandInput.value = '';
    this.updateInputState();
    this.focusInput();
  }

  public focusInput(): void {
    this.commandInput.focus();
    this.commandInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  public setInputDisabled(disabled: boolean): void {
    this.commandInput.disabled = disabled;
    this.executeButton.disabled = disabled || !this.getInputValue();
    this.voiceButton.disabled = disabled;
  }

  public hideQuickActions(): void {
    this.quickNavigation.style.display = 'none';
  }

  public showQuickActions(): void {
    this.quickNavigation.style.display = 'flex';
  }

  private scrollToBottom(): void {
    this.conversationArea.scrollTop = this.conversationArea.scrollHeight;
  }

  private announceMessage(message: ChatMessage): void {
    if (!message.content) return;
    
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('aria-live', 'assertive');
    announcement.textContent = `${message.type === 'bot' ? 'Assistant' : 'You'}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  private recordActivity(): void {
    this.lastActivity = Date.now();
  }

  private showIdleHelper(): void {
    this.idleHelper.classList.add('active');
    this.idleHelper.setAttribute('aria-hidden', 'false');
  }

  private dismissIdleHelper(): void {
    this.idleHelper.classList.remove('active');
    this.idleHelper.setAttribute('aria-hidden', 'true');
  }

  private navigateCommandHistory(direction: number): void {
    // Future implementation for command history navigation
    console.log('Navigate command history:', direction);
  }

  private clearConversation(): void {
    this.conversationArea.innerHTML = '';
    this.conversationContext.queryHistory = [];
    this.conversationContext.breadcrumbs = ['INITIAL_CONTACT'];
    this.updateConversationBreadcrumb('INITIAL_CONTACT');
    this.showQuickActions();
  }

  private triggerQuickAction(index: number): void {
    const chips = this.quickNavigation.querySelectorAll('.nav-chip');
    const chip = chips[index] as HTMLButtonElement;
    if (chip) {
      chip.click();
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    // Create and show notification (implementation can be enhanced)
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  // Getters for external access
  public getConversationContext(): ConversationContext {
    return { ...this.conversationContext };
  }

  public isProcessing(): boolean {
    return this.commandProcessor.classList.contains('active');
  }
}