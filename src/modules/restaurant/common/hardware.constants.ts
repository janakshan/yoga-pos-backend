/**
 * Hardware Integration Constants
 * Defines enums, interfaces, and constants for kitchen hardware functionality
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Printer connection types
 */
export enum PrinterConnectionType {
  NETWORK = 'network',
  USB = 'usb',
  BLUETOOTH = 'bluetooth',
  CLOUD = 'cloud',
}

/**
 * Printer protocols
 */
export enum PrinterProtocol {
  ESC_POS = 'esc_pos',
  STAR = 'star',
  RAW = 'raw',
  PDF = 'pdf',
}

/**
 * Printer status
 */
export enum PrinterStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
  LOW_PAPER = 'low_paper',
  OUT_OF_PAPER = 'out_of_paper',
  BUSY = 'busy',
  UNKNOWN = 'unknown',
}

/**
 * Print job status
 */
export enum PrintJobStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PRINTING = 'printing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRY = 'retry',
}

/**
 * Print job priority
 */
export enum PrintJobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Printer routing strategies
 */
export enum PrinterRoutingStrategy {
  STATION_BASED = 'station_based', // Route based on kitchen station
  ROUND_ROBIN = 'round_robin', // Distribute evenly across printers
  LOAD_BALANCED = 'load_balanced', // Route to least busy printer
  CATEGORY_BASED = 'category_based', // Route based on product category
  MANUAL = 'manual', // Manual printer selection
}

/**
 * Customer display types
 */
export enum CustomerDisplayType {
  LCD = 'lcd',
  LED = 'led',
  VFD = 'vfd', // Vacuum Fluorescent Display
  WEB = 'web', // Web-based display
}

/**
 * Customer display connection types
 */
export enum DisplayConnectionType {
  SERIAL = 'serial',
  USB = 'usb',
  NETWORK = 'network',
  WEB_SOCKET = 'web_socket',
}

/**
 * Pager/Buzzer notification types
 */
export enum NotificationDeviceType {
  PAGER = 'pager',
  BUZZER = 'buzzer',
  LIGHT = 'light',
  SCREEN = 'screen',
}

/**
 * Notification status
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  ACKNOWLEDGED = 'acknowledged',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

/**
 * Hardware error codes
 */
export enum HardwareErrorCode {
  CONNECTION_FAILED = 'connection_failed',
  DEVICE_NOT_FOUND = 'device_not_found',
  TIMEOUT = 'timeout',
  INVALID_CONFIG = 'invalid_config',
  PAPER_JAM = 'paper_jam',
  PRINT_HEAD_ERROR = 'print_head_error',
  COMMUNICATION_ERROR = 'communication_error',
  BUFFER_OVERFLOW = 'buffer_overflow',
  UNKNOWN_ERROR = 'unknown_error',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Printer configuration
 */
export interface IPrinterConfig {
  id: string;
  name: string;
  connectionType: PrinterConnectionType;
  protocol: PrinterProtocol;
  ipAddress?: string;
  port?: number;
  devicePath?: string; // For USB/Serial printers
  cloudConfig?: {
    apiKey: string;
    printerId: string;
    provider: 'printnode' | 'google_cloud_print' | 'custom';
  };
  settings: {
    paperWidth: number; // in mm
    charactersPerLine?: number;
    encoding?: string;
    timeout?: number; // in milliseconds
    reconnectAttempts?: number;
    reconnectDelay?: number; // in milliseconds
  };
  capabilities?: {
    supportsCutting?: boolean;
    supportsCashDrawer?: boolean;
    supportsBarcode?: boolean;
    supportsQRCode?: boolean;
    supportsLogo?: boolean;
    maxCopies?: number;
  };
}

/**
 * Customer display configuration
 */
export interface ICustomerDisplayConfig {
  id: string;
  name: string;
  displayType: CustomerDisplayType;
  connectionType: DisplayConnectionType;
  ipAddress?: string;
  port?: number;
  devicePath?: string;
  settings: {
    rows?: number;
    columns?: number;
    brightness?: number;
    encoding?: string;
    timeout?: number;
  };
}

/**
 * Notification device configuration
 */
export interface INotificationDeviceConfig {
  id: string;
  name: string;
  deviceType: NotificationDeviceType;
  deviceId: string;
  settings: {
    vibrationPattern?: number[];
    lightColor?: string;
    soundPattern?: string;
    timeout?: number; // Auto-dismiss after X seconds
  };
}

/**
 * Hardware settings for restaurant
 */
export interface IHardwareSettings {
  printers?: {
    enabled: boolean;
    defaultPrinter?: string;
    routingStrategy: PrinterRoutingStrategy;
    autoPrint: boolean;
    printCopies: number;
    printerConfigs: IPrinterConfig[];
  };
  customerDisplay?: {
    enabled: boolean;
    displayConfigs: ICustomerDisplayConfig[];
    showOrderTotal?: boolean;
    showItemDetails?: boolean;
    showWelcomeMessage?: boolean;
    welcomeMessage?: string;
  };
  notifications?: {
    enabled: boolean;
    deviceConfigs: INotificationDeviceConfig[];
    autoNotifyOnReady?: boolean;
    notificationTimeout?: number;
  };
}

/**
 * Print job data
 */
export interface IPrintJobData {
  orderId: string;
  orderNumber: string;
  content: string;
  printerIds?: string[];
  copies?: number;
  priority?: PrintJobPriority;
  metadata?: Record<string, any>;
}

/**
 * Printer statistics
 */
export interface IPrinterStatistics {
  printerId: string;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  averagePrintTime: number; // in milliseconds
  lastPrintTime?: Date;
  uptime: number; // percentage
}

/**
 * Hardware health check result
 */
export interface IHardwareHealthCheck {
  timestamp: Date;
  printers: Array<{
    id: string;
    name: string;
    status: PrinterStatus;
    lastCheck: Date;
    errorMessage?: string;
  }>;
  displays: Array<{
    id: string;
    name: string;
    isOnline: boolean;
    lastCheck: Date;
    errorMessage?: string;
  }>;
  notificationDevices: Array<{
    id: string;
    name: string;
    isOnline: boolean;
    lastCheck: Date;
    errorMessage?: string;
  }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default printer settings
 */
export const DEFAULT_PRINTER_SETTINGS = {
  paperWidth: 80, // mm
  charactersPerLine: 48,
  encoding: 'UTF-8',
  timeout: 5000, // 5 seconds
  reconnectAttempts: 3,
  reconnectDelay: 2000, // 2 seconds
};

/**
 * Default print job retry configuration
 */
export const PRINT_JOB_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  backoffMultiplier: 2, // Exponential backoff
};

/**
 * Print job queue limits
 */
export const PRINT_QUEUE_LIMITS = {
  maxQueueSize: 1000,
  maxJobAge: 24 * 60 * 60 * 1000, // 24 hours
  cleanupInterval: 60 * 60 * 1000, // 1 hour
};

/**
 * Hardware monitoring intervals
 */
export const HARDWARE_MONITORING = {
  healthCheckInterval: 60 * 1000, // 1 minute
  statusCheckInterval: 30 * 1000, // 30 seconds
  statisticsInterval: 5 * 60 * 1000, // 5 minutes
};

/**
 * Customer display default messages
 */
export const DISPLAY_MESSAGES = {
  welcome: 'Welcome to our restaurant!',
  thankYou: 'Thank you for your visit!',
  processing: 'Processing your order...',
  total: 'Total: ',
};

/**
 * Notification timeouts
 */
export const NOTIFICATION_TIMEOUTS = {
  pager: 300000, // 5 minutes
  buzzer: 60000, // 1 minute
  light: 120000, // 2 minutes
  screen: 180000, // 3 minutes
};

/**
 * ESC/POS commands for thermal printers
 */
export const ESC_POS_COMMANDS = {
  INIT: '\x1B\x40', // Initialize printer
  CUT: '\x1D\x56\x00', // Full cut
  PARTIAL_CUT: '\x1D\x56\x01', // Partial cut
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_RIGHT: '\x1B\x61\x02',
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  UNDERLINE_ON: '\x1B\x2D\x01',
  UNDERLINE_OFF: '\x1B\x2D\x00',
  DOUBLE_HEIGHT: '\x1B\x21\x10',
  DOUBLE_WIDTH: '\x1B\x21\x20',
  NORMAL_SIZE: '\x1B\x21\x00',
  LINE_FEED: '\x0A',
  OPEN_DRAWER: '\x1B\x70\x00\x19\xFA', // Open cash drawer
};
