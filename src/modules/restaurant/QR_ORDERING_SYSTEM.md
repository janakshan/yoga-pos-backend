# QR Code Table Ordering System

## Overview

The QR Code Table Ordering System enables contactless ordering for restaurant customers. Guests can scan a QR code at their table to view the menu, place orders, call servers, and request bills - all from their mobile devices without downloading an app.

## Features

### ✅ Core Features

1. **QR Code Management**
   - Generate unique QR codes for each table
   - Deep link generation for seamless menu access
   - QR code styling customization
   - Scan tracking and analytics
   - Bulk QR code generation for all tables

2. **Guest Session Management**
   - Secure session token generation
   - 4-hour session duration (configurable)
   - Device fingerprinting
   - Session expiration warnings
   - Automatic session cleanup

3. **Public Menu API**
   - No authentication required
   - Browse menu by categories
   - View product details with modifiers
   - Featured products (popular, recommended, new)
   - Search functionality
   - Real-time availability

4. **Order Management**
   - Guest order creation
   - Shopping cart management
   - Order tracking with real-time updates
   - Order status notifications

5. **Service Requests**
   - Call server functionality
   - Request bill functionality
   - Custom notes/requests

6. **Real-time Updates**
   - WebSocket integration for live order status
   - Order confirmation notifications
   - Kitchen status updates
   - Bill ready notifications

7. **Analytics & Reporting**
   - QR code scan statistics
   - Session analytics
   - Order conversion tracking
   - Guest behavior analysis

8. **Security & Performance**
   - Rate limiting (10 req/s, 60 req/min, 500 req/hour)
   - Session-based authentication
   - Automatic cleanup of expired sessions
   - CORS configuration

## Architecture

```
┌─────────────┐
│   Guest     │ Scans QR Code
│  (Mobile)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│          QR Ordering System             │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Public Endpoints (No Auth)     │  │
│  ├─────────────────────────────────┤  │
│  │ • Create Session                │  │
│  │ • View Menu                     │  │
│  │ • Manage Cart                   │  │
│  │ • Place Order                   │  │
│  │ • Track Order                   │  │
│  │ • Call Server                   │  │
│  │ • Request Bill                  │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Protected Endpoints (Staff)    │  │
│  ├─────────────────────────────────┤  │
│  │ • Generate QR Codes             │  │
│  │ • Manage Sessions               │  │
│  │ • View Analytics                │  │
│  │ • Session Cleanup               │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  WebSocket Gateway              │  │
│  ├─────────────────────────────────┤  │
│  │ • Order Status Updates          │  │
│  │ • Server Responses              │  │
│  │ • Bill Ready Notifications      │  │
│  │ • Session Expiring Warnings     │  │
│  └─────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Database Schema

### TableQRCode Entity

```typescript
{
  id: uuid (PK)
  branchId: uuid (FK → branches)
  tableId: uuid (FK → tables)
  qrCode: string (unique) // QR code identifier
  qrCodeImage: text // Base64 encoded image
  deepLink: string // URL for scanning
  type: enum (MENU_ONLY, ORDER_ENABLED, FULL_SERVICE)
  status: enum (ACTIVE, INACTIVE, EXPIRED, DISABLED)
  scanCount: integer
  lastScannedAt: timestamp
  expiresAt: timestamp (nullable)
  metadata: jsonb // Styling, campaign tracking, etc.
  secretKey: string (nullable) // Optional validation
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

### QROrderSession Entity

```typescript
{
  id: uuid (PK)
  branchId: uuid (FK → branches)
  tableId: uuid (FK → tables)
  qrCodeId: uuid (FK → table_qr_codes)
  sessionToken: string (unique) // Secure session identifier
  status: enum (ACTIVE, EXPIRED, COMPLETED, ABANDONED)
  expiresAt: timestamp

  // Guest Info
  guestName: string (nullable)
  guestPhone: string (nullable)
  guestEmail: string (nullable)
  guestCount: integer (nullable)

  // Device Tracking
  deviceId: string (nullable)
  userAgent: string (nullable)
  ipAddress: string (nullable)

  // Session Tracking
  firstAccessAt: timestamp
  lastAccessAt: timestamp
  accessCount: integer
  actions: jsonb[] // Array of {action, timestamp, details}

  // Cart & Orders
  cart: jsonb // Shopping cart data
  orderIds: string[] // Array of order IDs

  // Service Requests
  callServerCount: integer
  lastCallServerAt: timestamp (nullable)
  billRequested: boolean
  billRequestedAt: timestamp (nullable)

  // Payment
  paymentCompleted: boolean
  paymentCompletedAt: timestamp (nullable)
  paymentMethod: string (nullable)

  // Analytics
  totalSpent: integer (nullable) // In cents
  totalOrders: integer (nullable)
  sessionDuration: integer (nullable) // In seconds

  metadata: jsonb // Browser info, preferences, feedback
  createdAt: timestamp
  updatedAt: timestamp
  completedAt: timestamp (nullable)
  abandonedAt: timestamp (nullable)
}
```

## API Endpoints

### Public Endpoints (No Authentication)

#### Session Management

```http
POST /api/v1/restaurant/qr-ordering/sessions/create
Body: {
  qrCode: string
  deviceId?: string
  userAgent?: string
  ipAddress?: string
}
Response: QROrderSession
```

```http
GET /api/v1/restaurant/qr-ordering/sessions/validate?sessionToken={token}
Response: { valid: boolean }
```

```http
GET /api/v1/restaurant/qr-ordering/sessions/info?sessionToken={token}
Response: QROrderSession
```

```http
POST /api/v1/restaurant/qr-ordering/sessions/guest-info?sessionToken={token}
Body: {
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  guestCount?: number
}
Response: QROrderSession
```

#### Menu Access

```http
GET /api/v1/public/menu/branches/{branchId}?includeModifiers=true
Response: {
  categories: CategoryWithProducts[]
  totalCategories: number
  totalProducts: number
}
```

```http
GET /api/v1/public/menu/branches/{branchId}/categories
Response: Category[]
```

```http
GET /api/v1/public/menu/branches/{branchId}/categories/{categoryId}/products?includeModifiers=true
Response: Product[]
```

```http
GET /api/v1/public/menu/products/{productId}
Response: ProductDetail
```

```http
GET /api/v1/public/menu/branches/{branchId}/featured
Response: {
  popular: Product[]
  recommended: Product[]
  new: Product[]
}
```

```http
GET /api/v1/public/menu/branches/{branchId}/search?q={query}
Response: Product[]
```

#### Cart Management

```http
POST /api/v1/restaurant/qr-ordering/cart/update?sessionToken={token}
Body: {
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
}
Response: QROrderSession
```

```http
POST /api/v1/restaurant/qr-ordering/cart/clear?sessionToken={token}
Response: QROrderSession
```

#### Order Management

```http
POST /api/v1/restaurant/qr-ordering/orders/create
Body: {
  sessionToken: string
  items: CartItem[]
  specialInstructions?: string
  guestName?: string
  guestPhone?: string
}
Response: RestaurantOrder
```

```http
GET /api/v1/restaurant/qr-ordering/orders/track?sessionToken={token}
Response: { orders: RestaurantOrder[] }
```

```http
GET /api/v1/restaurant/qr-ordering/orders/{orderId}?sessionToken={token}
Response: RestaurantOrder
```

#### Service Requests

```http
POST /api/v1/restaurant/qr-ordering/service/call-server
Body: {
  sessionToken: string
  notes?: string
}
Response: {
  message: string
  callCount: number
}
```

```http
POST /api/v1/restaurant/qr-ordering/service/request-bill
Body: {
  sessionToken: string
}
Response: {
  message: string
  billRequestedAt: Date
}
```

#### Payment

```http
POST /api/v1/restaurant/qr-ordering/payment/record
Body: {
  sessionToken: string
  paymentMethod: string
  amount: number
  paymentReference?: string
}
Response: {
  message: string
  paymentCompleted: boolean
  totalSpent: number
}
```

### Protected Endpoints (JWT Authentication Required)

#### QR Code Management

```http
POST /api/v1/restaurant/qr-ordering/qr-codes/generate
Headers: { Authorization: "Bearer {jwt}" }
Body: {
  branchId: string
  tableId: string
  type?: 'MENU_ONLY' | 'ORDER_ENABLED' | 'FULL_SERVICE'
  width?: number
  foregroundColor?: string
  backgroundColor?: string
}
Response: TableQRCode
```

```http
POST /api/v1/restaurant/qr-ordering/qr-codes/generate-branch
Headers: { Authorization: "Bearer {jwt}" }
Body: {
  branchId: string
  type?: QRCodeType
  width?: number
}
Response: TableQRCode[]
```

```http
GET /api/v1/restaurant/qr-ordering/qr-codes/branch/{branchId}
Headers: { Authorization: "Bearer {jwt}" }
Response: TableQRCode[]
```

```http
GET /api/v1/restaurant/qr-ordering/qr-codes/{id}
Headers: { Authorization: "Bearer {jwt}" }
Response: TableQRCode
```

```http
POST /api/v1/restaurant/qr-ordering/qr-codes/{id}/regenerate
Headers: { Authorization: "Bearer {jwt}" }
Response: TableQRCode
```

```http
POST /api/v1/restaurant/qr-ordering/qr-codes/{id}/activate
Headers: { Authorization: "Bearer {jwt}" }
Response: TableQRCode
```

```http
POST /api/v1/restaurant/qr-ordering/qr-codes/{id}/deactivate
Headers: { Authorization: "Bearer {jwt}" }
Response: TableQRCode
```

#### Analytics

```http
GET /api/v1/restaurant/qr-ordering/qr-codes/statistics/{branchId}
Headers: { Authorization: "Bearer {jwt}" }
Response: {
  totalQRCodes: number
  activeQRCodes: number
  inactiveQRCodes: number
  totalScans: number
  averageScansPerQRCode: number
  mostScannedQRCode: TableQRCode
}
```

```http
GET /api/v1/restaurant/qr-ordering/analytics/sessions
Headers: { Authorization: "Bearer {jwt}" }
Query: { branchId, startDate?, endDate? }
Response: {
  totalSessions: number
  activeSessions: number
  completedSessions: number
  expiredSessions: number
  abandonedSessions: number
  totalOrders: number
  totalRevenue: number
  totalCallServer: number
  billRequests: number
  completedPayments: number
  avgSessionDuration: number
  avgOrdersPerSession: number
  avgRevenuePerSession: number
}
```

#### Session Management

```http
GET /api/v1/restaurant/qr-ordering/sessions/branch/{branchId}?status={status}
Headers: { Authorization: "Bearer {jwt}" }
Response: QROrderSession[]
```

```http
POST /api/v1/restaurant/qr-ordering/cleanup/expired-sessions
Headers: { Authorization: "Bearer {jwt}" }
Response: { message: string }
```

```http
POST /api/v1/restaurant/qr-ordering/cleanup/abandoned-sessions
Headers: { Authorization: "Bearer {jwt}" }
Body: { inactiveHours?: number }
Response: { message: string }
```

## WebSocket Events

### Client → Server

Connect to: `ws://localhost:3000/qr/guest`

```javascript
// Join session room
socket.emit('joinSession', { sessionToken: 'token-123' })

// Leave session room
socket.emit('leaveSession', { sessionToken: 'token-123' })

// Join order room for tracking
socket.emit('joinOrder', { orderId: 'order-id' })

// Leave order room
socket.emit('leaveOrder', { orderId: 'order-id' })
```

### Server → Client

```javascript
// Order status updates
socket.on('orderStatusUpdated', (data) => {
  // { orderId, order, previousStatus, newStatus, timestamp }
})

socket.on('orderConfirmed', (data) => {
  // { orderId, order, estimatedTime, message, timestamp }
})

socket.on('orderPreparing', (data) => {
  // { orderId, order, message, timestamp }
})

socket.on('orderReady', (data) => {
  // { orderId, order, message, timestamp }
})

socket.on('orderServed', (data) => {
  // { orderId, order, message, timestamp }
})

// Service responses
socket.on('serverCallResponse', (data) => {
  // { message, timestamp }
})

socket.on('billReady', (data) => {
  // { message, billData, timestamp }
})

socket.on('paymentConfirmed', (data) => {
  // { message, paymentData, timestamp }
})

// Session alerts
socket.on('sessionExpiring', (data) => {
  // { message, minutesRemaining, timestamp }
})

socket.on('sessionExpired', (data) => {
  // { message, timestamp }
})

// General notifications
socket.on('notification', (data) => {
  // { type, title, message, data, timestamp }
})
```

## Client Integration Example

### 1. Scanning QR Code

```javascript
// Guest scans QR code with format: https://app.com/qr/menu?code=xxx&table=yyy&branch=zzz
const urlParams = new URLSearchParams(window.location.search);
const qrCode = urlParams.get('code');

// Create session
const response = await fetch('/api/v1/restaurant/qr-ordering/sessions/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    qrCode,
    deviceId: getDeviceFingerprint(),
    userAgent: navigator.userAgent,
  }),
});

const session = await response.json();
localStorage.setItem('sessionToken', session.sessionToken);
```

### 2. Viewing Menu

```javascript
const sessionToken = localStorage.getItem('sessionToken');
const branchId = session.branchId;

const response = await fetch(
  `/api/v1/public/menu/branches/${branchId}?includeModifiers=true`
);
const menu = await response.json();
```

### 3. Managing Cart

```javascript
const cart = {
  items: [
    {
      productId: 'prod-1',
      productName: 'Burger',
      quantity: 2,
      unitPrice: 10.99,
      modifiers: [
        {
          modifierId: 'mod-1',
          modifierName: 'Extra Cheese',
          priceAdjustment: 1.5,
        },
      ],
      subtotal: 24.98,
    },
  ],
  subtotal: 24.98,
  tax: 2.00,
  total: 26.98,
};

await fetch(`/api/v1/restaurant/qr-ordering/cart/update?sessionToken=${sessionToken}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(cart),
});
```

### 4. Placing Order

```javascript
const response = await fetch('/api/v1/restaurant/qr-ordering/orders/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionToken,
    items: cart.items,
    specialInstructions: 'No onions please',
  }),
});

const order = await response.json();
```

### 5. Real-time Order Tracking

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/qr/guest');

// Join session
socket.emit('joinSession', { sessionToken });

// Join order room
socket.emit('joinOrder', { orderId: order.id });

// Listen for updates
socket.on('orderConfirmed', (data) => {
  console.log('Order confirmed!', data);
  showNotification('Your order has been confirmed!');
});

socket.on('orderPreparing', (data) => {
  console.log('Order is being prepared', data);
  updateOrderStatus('Preparing');
});

socket.on('orderReady', (data) => {
  console.log('Order is ready!', data);
  showNotification('Your order is ready!');
});
```

### 6. Calling Server

```javascript
await fetch('/api/v1/restaurant/qr-ordering/service/call-server', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionToken,
    notes: 'Need extra napkins',
  }),
});
```

### 7. Requesting Bill

```javascript
await fetch('/api/v1/restaurant/qr-ordering/service/request-bill', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionToken }),
});
```

## Configuration

### Environment Variables

```env
# Application URL (for deep links)
APP_URL=http://localhost:3000

# QR Session Configuration
QR_SESSION_DURATION_HOURS=4

# Rate Limiting (already configured in module)
# Short: 10 req/s
# Medium: 60 req/min
# Long: 500 req/hour
```

## Scheduled Tasks

The system runs several cron jobs for maintenance:

1. **Expired Sessions Cleanup** (Every 30 minutes)
   - Marks active sessions as expired if past expiration time

2. **Abandoned Sessions Check** (Every hour)
   - Marks sessions as abandoned if no activity for 2 hours

3. **Session Expiration Warnings** (Every 10 minutes)
   - Sends WebSocket warnings at 15 min and 5 min before expiration

4. **Old Sessions Cleanup** (Daily at 3 AM)
   - Deletes sessions older than 30 days

5. **Session Duration Updates** (Daily at 4 AM)
   - Calculates and updates session durations for completed sessions

## Security Considerations

1. **Session Tokens**: 64-character hex strings generated using crypto.randomBytes(32)
2. **Rate Limiting**: Applied to all public endpoints
3. **Session Expiration**: Automatic cleanup prevents resource exhaustion
4. **Device Tracking**: Fingerprinting helps detect suspicious activity
5. **CORS**: Configured for allowed origins
6. **Input Validation**: All DTOs use class-validator

## Testing

Run unit tests:
```bash
npm test -- qr-code.service.spec.ts
npm test -- qr-ordering.service.spec.ts
```

## Migration

Apply database migration:
```bash
npm run migration:run
```

Revert migration:
```bash
npm run migration:revert
```

## Monitoring & Analytics

### Key Metrics to Track

1. **QR Code Performance**
   - Scan count per QR code
   - Most/least scanned tables
   - Scan-to-order conversion rate

2. **Session Metrics**
   - Average session duration
   - Session completion rate
   - Abandonment rate
   - Average orders per session

3. **Order Metrics**
   - Total orders from QR system
   - Average order value
   - Order completion time

4. **Service Metrics**
   - Call server frequency
   - Bill request timing
   - Payment method distribution

## Future Enhancements

- [ ] CAPTCHA integration for bot prevention
- [ ] Online payment gateway integration (Stripe, PayPal)
- [ ] Multi-language support
- [ ] Table transfer functionality
- [ ] Split bill feature
- [ ] Loyalty program integration
- [ ] Guest feedback/ratings
- [ ] Tipping functionality
- [ ] Order scheduling (order for later)
- [ ] Allergen warnings
- [ ] Nutritional information display

## Support

For issues or questions:
- Check API documentation: http://localhost:3000/api/v1/docs
- Review WebSocket guide: `WEBSOCKET_GUIDE.md`
- Submit issues on GitHub

---

**Last Updated**: 2024-11-13
**Version**: 1.0.0
**Status**: Production Ready ✅
