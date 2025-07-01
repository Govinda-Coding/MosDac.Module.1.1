// MOSDAC Cosmic Command Console - Enhanced Type Definitions
// Comprehensive type system for space-grade application

// === API RESPONSE TYPES ===
export interface ApiResponse {
  answer: string;
  sources?: string[];
  related_links?: RelatedLink[];
  confidence?: number;
  timestamp?: string;
  query_type?: QueryType;
  satellite_data?: SatelliteInfo[];
}

export interface RelatedLink {
  title: string;
  url: string;
  description?: string;
  category?: LinkCategory;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
  timestamp?: string;
  request_id?: string;
}

// === CHAT MESSAGE TYPES ===
export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  sources?: string[];
  relatedLinks?: RelatedLink[];
  isWelcome?: boolean;
  queryType?: QueryType;
  satelliteData?: SatelliteInfo[];
  processingTime?: number;
}

export interface ConversationContext {
  sessionId: string;
  currentTopic?: string;
  breadcrumbs: string[];
  lastQuery?: string;
  queryHistory: string[];
}

// === UI STATE TYPES ===
export interface UIState {
  isLoading: boolean;
  isProcessing: boolean;
  activePanel?: PanelType;
  currentView: ViewType;
  isInputDisabled: boolean;
  currentQuery: string;
  conversationContext: ConversationContext;
  isVoiceInputActive: boolean;
  isHighContrastMode: boolean;
}

export interface PanelState {
  satellitePanel: boolean;
  timelineDrawer: boolean;
  helpModal: boolean;
  settingsModal: boolean;
}

// === SATELLITE DATA TYPES ===
export interface SatelliteInfo {
  name: string;
  status: SatelliteStatus;
  type: SatelliteType;
  launchDate?: string;
  mission?: string;
  lastContact?: string;
  dataProducts?: string[];
  orbitType?: OrbitType;
  sensors?: string[];
}

export interface SatelliteStatusInfo {
  id: string;
  name: string;
  status: SatelliteStatus;
  lastUpdate: Date;
  dataRate?: number;
  signalStrength?: number;
  operationalMode?: string;
  nextPass?: Date;
}

export interface MissionTimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  category: MissionCategory;
  satelliteId?: string;
  status: MissionStatus;
  imageUrl?: string;
}

// === API CONFIGURATION ===
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  apiKey?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface EndpointConfig {
  ask: string;
  health: string;
  satellites: string;
  timeline: string;
  products: string;
}

// === COMPONENT PROPS TYPES ===
export interface MessageProps {
  message: ChatMessage;
  onSourceClick?: (url: string) => void;
  onSatelliteClick?: (satellite: SatelliteInfo) => void;
}

export interface InputProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
  context?: ConversationContext;
}

export interface SatellitePanelProps {
  satellites: SatelliteStatusInfo[];
  isActive: boolean;
  onClose: () => void;
  onSatelliteSelect?: (satellite: SatelliteStatusInfo) => void;
}

export interface TimelineProps {
  missions: MissionTimelineItem[];
  isActive: boolean;
  onClose: () => void;
  onMissionSelect?: (mission: MissionTimelineItem) => void;
}

// === EVENT HANDLER TYPES ===
export type MessageEventHandler = (message: ChatMessage) => void;
export type ErrorEventHandler = (error: ApiError) => void;
export type LoadingEventHandler = (isLoading: boolean) => void;
export type PanelEventHandler = (panel: PanelType, isOpen: boolean) => void;
export type VoiceEventHandler = (isListening: boolean) => void;

// === VOICE INPUT TYPES ===
export interface VoiceConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface VoiceResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

// === KEYBOARD SHORTCUT TYPES ===
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: string;
  description: string;
}

// === ACCESSIBILITY TYPES ===
export interface AccessibilityOptions {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  fontSize: FontSize;
  announceMessages: boolean;
}

// === ENUMS ===
export enum MessageType {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}

export enum QueryType {
  GENERAL = 'general',
  SATELLITE_INFO = 'satellite_info',
  DATA_DOWNLOAD = 'data_download',
  PRODUCT_CATALOG = 'product_catalog',
  WEATHER_DATA = 'weather_data',
  CYCLONE_TRACKING = 'cyclone_tracking',
  TECHNICAL_SUPPORT = 'technical_support'
}

export enum SatelliteStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DEGRADED = 'degraded',
  OFFLINE = 'offline'
}

export enum SatelliteType {
  WEATHER = 'weather',
  OCEAN = 'ocean',
  LAND = 'land',
  COMMUNICATION = 'communication',
  NAVIGATION = 'navigation',
  SCIENTIFIC = 'scientific'
}

export enum OrbitType {
  GEO = 'geostationary',
  LEO = 'low_earth_orbit',
  MEO = 'medium_earth_orbit',
  POLAR = 'polar',
  SUN_SYNC = 'sun_synchronous'
}

export enum MissionCategory {
  LAUNCH = 'launch',
  DEPLOYMENT = 'deployment',
  MILESTONE = 'milestone',
  DISCOVERY = 'discovery',
  MAINTENANCE = 'maintenance',
  RETIREMENT = 'retirement'
}

export enum MissionStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled'
}

export enum PanelType {
  SATELLITE_STATUS = 'satellite_status',
  MISSION_TIMELINE = 'mission_timeline',
  HELP = 'help',
  SETTINGS = 'settings'
}

export enum ViewType {
  CHAT = 'chat',
  LOADING = 'loading',
  ERROR = 'error',
  WELCOME = 'welcome'
}

export enum LinkCategory {
  DOCUMENTATION = 'documentation',
  DATA_DOWNLOAD = 'data_download',
  PRODUCT_INFO = 'product_info',
  EXTERNAL = 'external',
  SUPPORT = 'support'
}

export enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

// === UTILITY TYPES ===
export type MessageId = ChatMessage['id'];
export type SatelliteId = SatelliteInfo['name'];
export type MissionId = MissionTimelineItem['id'];

// === APPLICATION STATE ===
export interface AppState {
  messages: ChatMessage[];
  ui: UIState;
  panels: PanelState;
  config: ApiConfig;
  satellites: SatelliteStatusInfo[];
  missions: MissionTimelineItem[];
  shortcuts: KeyboardShortcut[];
  accessibility: AccessibilityOptions;
}

// === STARFIELD TYPES ===
export interface StarfieldConfig {
  starCount: number;
  animationSpeed: number;
  twinkleEffect: boolean;
  constellations: boolean;
  colors: string[];
}

// === NOTIFICATION TYPES ===
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SYSTEM = 'system'
}

// === PERFORMANCE MONITORING ===
export interface PerformanceMetrics {
  apiResponseTime: number;
  renderTime: number;
  messageCount: number;
  sessionDuration: number;
  errorCount: number;
  lastUpdated: Date;
}

// === DATA VALIDATION ===
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// === COSMIC THEME TYPES ===
export interface ThemeConfig {
  name: string;
  colors: ColorPalette;
  typography: TypographyConfig;
  animations: AnimationConfig;
  effects: EffectConfig;
}

export interface ColorPalette {
  void: string;
  console: string;
  glass: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  accent: {
    blue: string;
    orange: string;
    success: string;
    warning: string;
    error: string;
  };
}

export interface TypographyConfig {
  primary: string;
  mono: string;
  sizes: Record<string, string>;
  weights: Record<string, number>;
}

export interface AnimationConfig {
  speed: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: Record<string, string>;
}

export interface EffectConfig {
  glow: boolean;
  blur: boolean;
  shadows: boolean;
  transparency: number;
}