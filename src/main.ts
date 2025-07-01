import './styles/main.scss';
import { ChatManager } from './chat';
import { CosmicUIManager } from './ui';
import { initializeStarfield } from './starfield';
import type { ChatMessage, ApiError, KeyboardShortcut } from './types';

class MosdacCosmicConsole {
  private chatManager: ChatManager;
  private uiManager: CosmicUIManager;
  private starfieldRenderer: any;
  private commandForm: HTMLFormElement;
  private shortcuts: KeyboardShortcut[];

  constructor() {
    this.chatManager = new ChatManager();
    this.uiManager = new CosmicUIManager();
    this.commandForm = document.getElementById('commandForm') as HTMLFormElement;
    this.shortcuts = this.initializeKeyboardShortcuts();

    this.initializeConsole();
    this.setupEventHandlers();
    this.initializeCosmicElements();
    this.loadWelcomeMessage();
    this.showStartupSequence();
  }

  private initializeConsole(): void {
    console.log('🛰️ MOSDAC Cosmic Command Console - Initializing...');
    
    // Set up chat event handlers
    this.chatManager.onMessage((message: ChatMessage) => {
      this.uiManager.addMessageToConversation(message);
      
      // Hide quick actions after first user message
      if (message.type === 'user' && this.chatManager.getMessages().length > 1) {
        this.uiManager.hideQuickActions();
      }
      
      // Update processing status for bot messages
      if (message.type === 'bot' && message.processingTime) {
        console.log(`Response generated in ${message.processingTime}ms`);
      }
    });

    this.chatManager.onLoadingChange((isLoading: boolean) => {
      if (isLoading) {
        this.uiManager.showProcessing();
      } else {
        this.uiManager.hideProcessing();
      }
    });

    this.chatManager.onError((error: ApiError) => {
      console.error('🚨 Console Error:', error);
      this.handleSystemError(error);
    });

    console.log('✅ Chat systems online');
  }

  private setupEventHandlers(): void {
    // Command form submission
    this.commandForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.executeCommand();
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleGlobalKeyboard(e);
    });

    // Window focus/blur for performance optimization
    window.addEventListener('focus', () => {
      this.resumeAnimations();
    });

    window.addEventListener('blur', () => {
      this.pauseAnimations();
    });

    // Connection status monitoring
    window.addEventListener('online', () => {
      this.showSystemNotification('🛰️ Connection restored - All systems operational', 'success');
      this.updateConnectionStatus(true);
    });

    window.addEventListener('offline', () => {
      this.showSystemNotification('⚠️ Connection lost - Operating in offline mode', 'warning');
      this.updateConnectionStatus(false);
    });

    // Visibility change for performance
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimations();
      } else {
        this.resumeAnimations();
        this.uiManager.focusInput();
      }
    });

    // Resize handler for responsive updates
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    console.log('✅ Event handlers configured');
  }

  private initializeCosmicElements(): void {
    // Initialize starfield background
    this.starfieldRenderer = initializeStarfield();
    
    if (this.starfieldRenderer) {
      console.log('✅ Starfield renderer active');
    }

    // Initialize satellite status with mock data
    this.initializeSatelliteStatus();
    
    // Initialize mission timeline
    this.initializeMissionTimeline();
    
    // Load user preferences
    this.loadUserPreferences();

    console.log('✅ Cosmic elements initialized');
  }

  private initializeSatelliteStatus(): void {
    // Mock satellite data - in real implementation, this would come from an API
    const mockSatellites = [
      { name: 'INSAT-3DR', status: 'active', lastUpdate: new Date() },
      { name: 'SCATSAT-1', status: 'active', lastUpdate: new Date() },
      { name: 'OCEANSAT-2', status: 'maintenance', lastUpdate: new Date() },
      { name: 'CARTOSAT-2', status: 'active', lastUpdate: new Date() },
      { name: 'RISAT-2B', status: 'active', lastUpdate: new Date() }
    ];

    // Update satellite panel with data
    const satelliteGrid = document.querySelector('.satellite-grid');
    if (satelliteGrid) {
      satelliteGrid.innerHTML = mockSatellites.map(sat => `
        <div class="satellite-item ${sat.status}">
          <div class="sat-indicator"></div>
          <span class="sat-name">${sat.name}</span>
          <span class="sat-status">${sat.status.toUpperCase()}</span>
        </div>
      `).join('');
    }
  }

  private initializeMissionTimeline(): void {
    // Mock mission timeline - in real implementation, this would come from an API
    const mockMissions = [
      {
        title: 'CHANDRAYAAN-3',
        description: 'Successful lunar soft landing mission',
        date: '2023',
        category: 'milestone'
      },
      {
        title: 'GAGANYAAN Test',
        description: 'Crew module atmospheric re-entry test',
        date: '2022',
        category: 'milestone'
      },
      {
        title: 'SCATSAT-1 Launch',
        description: 'Ocean wind monitoring satellite deployment',
        date: '2016',
        category: 'launch'
      }
    ];

    const timelineContent = document.querySelector('.timeline-content');
    if (timelineContent) {
      timelineContent.innerHTML = mockMissions.map(mission => `
        <div class="timeline-item">
          <div class="timeline-marker"></div>
          <div class="timeline-content-item">
            <h4>${mission.title}</h4>
            <p>${mission.description}</p>
            <time>${mission.date}</time>
          </div>
        </div>
      `).join('');
    }
  }

  private initializeKeyboardShortcuts(): KeyboardShortcut[] {
    return [
      { key: 'k', ctrlKey: true, action: 'focus-input', description: 'Focus command input' },
      { key: 'l', ctrlKey: true, action: 'clear-console', description: 'Clear conversation' },
      { key: 'h', ctrlKey: true, action: 'show-help', description: 'Show help' },
      { key: '1', ctrlKey: true, action: 'quick-action-1', description: 'What is MOSDAC?' },
      { key: '2', ctrlKey: true, action: 'quick-action-2', description: 'Download Data' },
      { key: '3', ctrlKey: true, action: 'quick-action-3', description: 'Satellite Products' },
      { key: 'Escape', action: 'close-panels', description: 'Close all panels' }
    ];
  }

  private async executeCommand(): Promise<void> {
    const command = this.uiManager.getInputValue();
    
    if (!command || this.chatManager.isCurrentlyLoading()) {
      return;
    }

    try {
      console.log('🚀 Executing command:', command);
      const startTime = performance.now();
      
      this.uiManager.clearInput();
      await this.chatManager.sendMessage(command);
      
      const endTime = performance.now();
      console.log(`✅ Command executed in ${Math.round(endTime - startTime)}ms`);
      
    } catch (error) {
      console.error('❌ Command execution failed:', error);
      this.handleSystemError(error as ApiError);
    }
  }

  private handleGlobalKeyboard(e: KeyboardEvent): void {
    // Find matching shortcut
    const shortcut = this.shortcuts.find(s => 
      s.key === e.key &&
      !!s.ctrlKey === (e.ctrlKey || e.metaKey) &&
      !!s.shiftKey === e.shiftKey &&
      !!s.altKey === e.altKey
    );

    if (shortcut) {
      e.preventDefault();
      this.executeShortcut(shortcut.action);
    }
  }

  private executeShortcut(action: string): void {
    switch (action) {
      case 'focus-input':
        this.uiManager.focusInput();
        break;
      case 'clear-console':
        this.clearConsole();
        break;
      case 'show-help':
        this.showHelpModal();
        break;
      case 'quick-action-1':
      case 'quick-action-2':
      case 'quick-action-3':
        const index = parseInt(action.split('-')[2]) - 1;
        this.triggerQuickAction(index);
        break;
      case 'close-panels':
        this.uiManager.closeAllPanels();
        break;
    }
  }

  private loadWelcomeMessage(): void {
    // Load existing messages (including welcome message)
    const messages = this.chatManager.getMessages();
    messages.forEach(message => {
      this.uiManager.addMessageToConversation(message);
    });
  }

  private showStartupSequence(): void {
    console.log('🌟 MOSDAC Cosmic Command Console - Ready for Operation');
    
    // Simulate system initialization
    setTimeout(() => {
      this.updateSystemStatus('COMMUNICATION_LINK_ESTABLISHED');
    }, 1000);

    setTimeout(() => {
      this.updateSystemStatus('ALL_SYSTEMS_NOMINAL');
      this.uiManager.focusInput();
    }, 2000);
  }

  private updateSystemStatus(status: string): void {
    const statusElement = document.querySelector('.console-status span');
    if (statusElement) {
      statusElement.textContent = status.replace(/_/g, ' ');
    }
  }

  private updateConnectionStatus(isOnline: boolean): void {
    const indicator = document.querySelector('.status-indicator');
    if (indicator) {
      if (isOnline) {
        indicator.classList.remove('inactive');
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
        indicator.classList.add('inactive');
      }
    }
  }

  private handleSystemError(error: ApiError): void {
    const errorMessage = `System Error: ${error.message}`;
    this.showSystemNotification(errorMessage, 'error');
    
    // Update console status
    this.updateSystemStatus('SYSTEM_ERROR_DETECTED');
    
    // Log for debugging
    console.error('System Error Details:', {
      error: error.error,
      message: error.message,
      status: error.status,
      timestamp: new Date().toISOString()
    });
  }

  private clearConsole(): void {
    // Clear chat history
    this.chatManager.clearMessages();
    
    // Clear UI conversation area
    const conversationArea = document.getElementById('conversationArea');
    if (conversationArea) {
      conversationArea.innerHTML = '';
    }
    
    // Reload welcome message
    this.loadWelcomeMessage();
    
    // Show quick actions again
    this.uiManager.showQuickActions();
    
    // Reset conversation context
    this.uiManager.updateConversationBreadcrumb('INITIAL_CONTACT');
    
    this.showSystemNotification('Console cleared - Ready for new mission', 'success');
  }

  private showHelpModal(): void {
    const helpContent = `
      <h3>MOSDAC Command Console - Help</h3>
      <div class="help-sections">
        <section>
          <h4>Keyboard Shortcuts</h4>
          <ul>
            ${this.shortcuts.map(s => `
              <li><kbd>${s.ctrlKey ? 'Ctrl+' : ''}${s.key.toUpperCase()}</kbd> - ${s.description}</li>
            `).join('')}
          </ul>
        </section>
        <section>
          <h4>Voice Commands</h4>
          <p>Click the microphone icon or use voice input to speak your queries naturally.</p>
        </section>
        <section>
          <h4>Quick Actions</h4>
          <p>Use the command chips below the input for common queries about MOSDAC services.</p>
        </section>
      </div>
    `;
    
    this.showModal('Help', helpContent);
  }

  private showModal(title: string, content: string): void {
    // Create modal dynamically
    const modal = document.createElement('div');
    modal.className = 'cosmic-modal glass-panel';
    modal.innerHTML = `
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">${content}</div>
    `;
    
    document.body.appendChild(modal);
    
    // Close handlers
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  private triggerQuickAction(index: number): void {
    const quickChips = document.querySelectorAll('.nav-chip');
    const chip = quickChips[index] as HTMLButtonElement;
    if (chip) {
      chip.click();
    }
  }

  private loadUserPreferences(): void {
    // Load high contrast preference
    const highContrast = localStorage.getItem('highContrast') === 'true';
    if (highContrast) {
      document.body.classList.add('high-contrast');
    }
    
    // Load other preferences (future implementation)
    console.log('✅ User preferences loaded');
  }

  private pauseAnimations(): void {
    // Pause starfield and other animations for performance
    if (this.starfieldRenderer) {
      this.starfieldRenderer.pause();
    }
    
    // Pause CSS animations
    document.body.classList.add('paused-animations');
  }

  private resumeAnimations(): void {
    // Resume animations
    if (this.starfieldRenderer) {
      this.starfieldRenderer.resume();
    }
    
    // Resume CSS animations
    document.body.classList.remove('paused-animations');
  }

  private handleWindowResize(): void {
    // Handle responsive updates
    const isMobile = window.innerWidth < 768;
    document.body.classList.toggle('mobile-layout', isMobile);
  }

  private showSystemNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    // Create system notification
    const notification = document.createElement('div');
    notification.className = `system-notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
      </div>
    `;
    
    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-glass-bg, rgba(10, 10, 10, 0.9));
      backdrop-filter: blur(20px);
      border: 1px solid var(--color-accent-${type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'blue'}, #00A3FF);
      border-radius: 12px;
      padding: 16px 20px;
      color: var(--color-text-primary, #FFFFFF);
      font-family: 'IBM Plex Mono', monospace;
      font-size: 14px;
      z-index: 1200;
      animation: slideInFromRight 0.3s ease-out;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after delay
    const delay = type === 'error' ? 8000 : 4000;
    setTimeout(() => {
      notification.style.animation = 'slideOutToRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, delay);
  }

  private getNotificationIcon(type: string): string {
    const icons = {
      success: '✅',
      error: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type as keyof typeof icons] || 'ℹ️';
  }
}

// Initialize the cosmic console when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌌 Initializing MOSDAC Cosmic Command Console...');
  
  try {
    new MosdacCosmicConsole();
    console.log('🚀 Console initialization complete - All systems go!');
  } catch (error) {
    console.error('❌ Console initialization failed:', error);
  }
});

// Add enhanced notification animations to document
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideInFromRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutToRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .paused-animations * {
    animation-play-state: paused !important;
  }

  .mobile-layout .control-panel .control-btn span {
    display: none;
  }

  .cosmic-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 1100;
    animation: fadeInUp 0.3s ease-out;
  }

  .cosmic-modal .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid rgba(0, 163, 255, 0.3);
  }

  .cosmic-modal .modal-body {
    padding: 24px;
  }

  .cosmic-modal .help-sections {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .cosmic-modal .help-sections section h4 {
    color: var(--color-accent-blue, #00A3FF);
    margin-bottom: 12px;
    font-family: 'IBM Plex Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .cosmic-modal .help-sections ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .cosmic-modal .help-sections li {
    padding: 8px 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .cosmic-modal kbd {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 4px 8px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    min-width: 60px;
    text-align: center;
  }
`;
document.head.appendChild(notificationStyles);