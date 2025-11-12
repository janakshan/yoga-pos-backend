/**
 * Restaurant Mode Constants
 * Defines enums, interfaces, and constants for restaurant-specific functionality
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Types of dining services offered
 */
export enum DiningType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

/**
 * Table status in restaurant
 */
export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  CLEANING = 'cleaning',
  OUT_OF_SERVICE = 'out_of_service',
}

/**
 * Order status in restaurant context
 */
export enum RestaurantOrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Kitchen order priority
 */
export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Course timing for meals
 */
export enum CourseTiming {
  APPETIZER = 'appetizer',
  MAIN_COURSE = 'main_course',
  DESSERT = 'dessert',
  BEVERAGE = 'beverage',
}

/**
 * Modifier types for menu items
 */
export enum ModifierType {
  REQUIRED = 'required',
  OPTIONAL = 'optional',
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
}

/**
 * Restaurant feature flags
 */
export enum RestaurantFeature {
  TABLE_MANAGEMENT = 'table_management',
  KITCHEN_DISPLAY = 'kitchen_display',
  WAITER_APP = 'waiter_app',
  ONLINE_ORDERING = 'online_ordering',
  MENU_QR_CODE = 'menu_qr_code',
  SPLIT_BILLS = 'split_bills',
  COURSE_TIMING = 'course_timing',
  RESERVATIONS = 'reservations',
  DELIVERY_MANAGEMENT = 'delivery_management',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Restaurant settings configuration
 */
export interface IRestaurantSettings {
  diningEnabled?: boolean;
  takeawayEnabled?: boolean;
  deliveryEnabled?: boolean;
  tableManagement?: ITableManagementSettings;
  kitchenDisplay?: IKitchenDisplaySettings;
  menuManagement?: IMenuManagementSettings;
  orderingFlow?: IOrderingFlowSettings;
  delivery?: IDeliverySettings;
  reservations?: IReservationSettings;
}

/**
 * Table management configuration
 */
export interface ITableManagementSettings {
  enabled: boolean;
  maxTables?: number;
  tablePrefix?: string;
  autoAssignment?: boolean;
  qrMenuEnabled?: boolean;
}

/**
 * Kitchen display system configuration
 */
export interface IKitchenDisplaySettings {
  enabled: boolean;
  orderTicketPrinting?: boolean;
  autoRefreshInterval?: number; // in seconds
  soundAlerts?: boolean;
  priorityOrdering?: boolean;
}

/**
 * Menu management configuration
 */
export interface IMenuManagementSettings {
  categoriesEnabled: boolean;
  modifiersEnabled: boolean;
  comboMealsEnabled: boolean;
  seasonalMenus?: boolean;
  nutritionalInfo?: boolean;
  allergenInfo?: boolean;
}

/**
 * Ordering flow configuration
 */
export interface IOrderingFlowSettings {
  requireTableNumber: boolean;
  allowSplitBills: boolean;
  allowCourseTiming: boolean;
  tipSuggestions?: number[]; // percentage values
  minOrderAmount?: number;
  orderNotesEnabled?: boolean;
}

/**
 * Delivery settings
 */
export interface IDeliverySettings {
  enabled: boolean;
  deliveryRadius?: number; // in kilometers
  minimumOrderAmount?: number;
  deliveryFee?: number;
  estimatedDeliveryTime?: number; // in minutes
  trackingEnabled?: boolean;
}

/**
 * Reservation settings
 */
export interface IReservationSettings {
  enabled: boolean;
  maxPartySize?: number;
  advanceBookingDays?: number;
  timeSlotDuration?: number; // in minutes
  requireDeposit?: boolean;
  depositAmount?: number;
}

/**
 * Table information
 */
export interface ITableInfo {
  id: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  section?: string;
  currentOrderId?: string;
  reservationId?: string;
}

/**
 * Menu item modifier
 */
export interface IMenuModifier {
  id: string;
  name: string;
  type: ModifierType;
  options: IModifierOption[];
  required: boolean;
  maxSelections?: number;
}

/**
 * Modifier option
 */
export interface IModifierOption {
  id: string;
  name: string;
  priceAdjustment?: number;
  available: boolean;
}

/**
 * Kitchen order ticket
 */
export interface IKitchenOrderTicket {
  orderId: string;
  tableNumber?: string;
  orderType: DiningType;
  items: IKitchenOrderItem[];
  priority: OrderPriority;
  timestamp: Date;
  specialInstructions?: string;
}

/**
 * Kitchen order item
 */
export interface IKitchenOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  modifiers?: string[];
  notes?: string;
  course?: CourseTiming;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default restaurant settings
 */
export const DEFAULT_RESTAURANT_SETTINGS: IRestaurantSettings = {
  diningEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: false,
  tableManagement: {
    enabled: false,
    maxTables: 50,
    tablePrefix: 'T',
    autoAssignment: false,
    qrMenuEnabled: false,
  },
  kitchenDisplay: {
    enabled: false,
    orderTicketPrinting: true,
    autoRefreshInterval: 30,
    soundAlerts: true,
    priorityOrdering: true,
  },
  menuManagement: {
    categoriesEnabled: true,
    modifiersEnabled: false,
    comboMealsEnabled: false,
    seasonalMenus: false,
    nutritionalInfo: false,
    allergenInfo: false,
  },
  orderingFlow: {
    requireTableNumber: false,
    allowSplitBills: false,
    allowCourseTiming: false,
    tipSuggestions: [10, 15, 20],
    orderNotesEnabled: true,
  },
  delivery: {
    enabled: false,
    deliveryRadius: 5,
    minimumOrderAmount: 10,
    deliveryFee: 5,
    estimatedDeliveryTime: 30,
    trackingEnabled: false,
  },
  reservations: {
    enabled: false,
    maxPartySize: 12,
    advanceBookingDays: 30,
    timeSlotDuration: 15,
    requireDeposit: false,
  },
};

/**
 * Restaurant-specific permission keys
 */
export const RESTAURANT_PERMISSIONS = {
  MANAGE_TABLES: 'restaurant:manage_tables',
  VIEW_KITCHEN_DISPLAY: 'restaurant:view_kitchen_display',
  MANAGE_ORDERS: 'restaurant:manage_orders',
  MANAGE_MENU: 'restaurant:manage_menu',
  MANAGE_RESERVATIONS: 'restaurant:manage_reservations',
  MANAGE_DELIVERY: 'restaurant:manage_delivery',
  SPLIT_BILLS: 'restaurant:split_bills',
  VIEW_REPORTS: 'restaurant:view_reports',
} as const;

/**
 * Restaurant metadata keys for decorators
 */
export const RESTAURANT_MODE_KEY = 'restaurant_mode';
export const RESTAURANT_FEATURE_KEY = 'restaurant_feature';
