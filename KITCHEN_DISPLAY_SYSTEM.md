# Kitchen Display System (KDS)

## Overview

The Kitchen Display System (KDS) is a comprehensive backend solution for managing kitchen operations in a restaurant POS system. It provides real-time order tracking, queue management, performance metrics, and printer integration.

## Features

### 1. Kitchen Station Management
- Configure multiple kitchen stations (Grill, Fryer, Salad, Dessert, Bar, etc.)
- Station-specific settings for prep times, alerts, and printer configuration
- Active/inactive status management
- Display order customization

### 2. Order Queue Management
- Real-time order queue by kitchen station
- Filter orders by:
  - Station
  - Status (Confirmed, Preparing, Ready)
  - Priority (Low, Normal, High, Urgent)
  - Course timing (Appetizer, Main Course, Dessert, Beverage)
  - Overdue status
  - Warning state
- Multiple sorting options:
  - Creation time
  - Priority
  - Preparation time
  - Order age
- Pagination support

### 3. Order Timer & Aging Logic
- Automatic calculation of order age (time since confirmation)
- Item-level age tracking (time since sent to kitchen)
- Configurable warning thresholds (default: 10 minutes before target)
- Configurable critical thresholds (default: 5 minutes after target)
- Overdue detection based on preparation time + thresholds
- Real-time updates via WebSocket

### 4. Mark Ready / Bump Operations
- **Mark Item Ready**: Mark individual items as ready for serving
- **Bump Item**: Remove individual items from kitchen display (mark as served)
- **Bump Order**: Remove entire order or selected items from display
- **Recall Order**: Bring previously bumped orders back to kitchen display
- Automatic order status updates based on item statuses

### 5. Performance Metrics
- Real-time performance tracking per station
- Comprehensive metrics:
  - Total orders processed
  - Total items processed
  - Average preparation time
  - Average completion time
  - On-time completion rate
  - Overdue order count
  - Cancelled item count
  - Peak hours identification
  - Orders by priority breakdown
  - Items by course breakdown
- Time-series data support (hourly, daily, weekly, monthly)
- Date range filtering

### 6. Course Sequencing
- Intelligent course-based sorting
- Table-grouped course sequencing
- Support for:
  - Appetizers
  - Main courses
  - Desserts
  - Beverages
- Configurable course delays per station

### 7. Priority Sorting
- Multi-level priority system:
  - Urgent (highest)
  - High
  - Normal
  - Low
- Secondary sorting by order age
- Priority-based visual indicators

### 8. Kitchen Printer Integration
- Network printer support (ESC/POS protocol)
- USB printer support
- Cloud printing compatibility
- Auto-print configuration per station
- Manual and automatic ticket printing
- Reprint functionality with reason tracking
- Item-specific printing
- Test print functionality
- Customizable ticket layouts

### 9. Real-time WebSocket Updates
- Dedicated `/kitchen` WebSocket namespace
- Room-based subscriptions:
  - Branch-wide updates: `kitchen:branch:{branchId}`
  - Station-specific updates: `kitchen:station:{branchId}:{station}`
- Events:
  - `orderReceived`: New order in kitchen
  - `orderItemReceived`: New item added to existing order
  - `itemStatusChanged`: Item status update
  - `itemBumped`: Item removed from display
  - `orderBumped`: Order removed from display
  - `orderRecalled`: Order recalled to display
  - `stationAlert`: Overdue/urgent/warning alerts
  - `performanceUpdate`: Real-time metrics

## Architecture

### Entities

#### KitchenStation
- Configuration entity for kitchen stations
- Fields:
  - Station type (enum)
  - Name and description
  - Display settings (order, color)
  - Timing settings (prep time, thresholds)
  - Alert settings (sound, visual)
  - Printer settings (name, IP, port)
  - Performance settings (targets, tracking)
  - Course sequencing settings
  - Staff assignments
  - Metadata (JSONB)

### Services

#### KitchenService
Core business logic for KDS operations:
- Station CRUD operations
- Queue queries and filtering
- Timer and aging calculations
- Mark ready/bump operations
- Performance metrics
- Course sequencing
- Priority sorting

#### KitchenPrinterService
Printer integration and ticket management:
- Ticket generation
- Printer communication
- Auto-print functionality
- Reprint operations
- Test printing
- Multi-copy support

### Controllers

#### KitchenController
RESTful API endpoints:
- `POST /restaurant/kitchen/stations` - Create station
- `PUT /restaurant/kitchen/stations/:id` - Update station
- `GET /restaurant/kitchen/stations/:id` - Get station
- `GET /restaurant/kitchen/stations/branch/:branchId` - Get branch stations
- `DELETE /restaurant/kitchen/stations/:id` - Delete station
- `GET /restaurant/kitchen/queue` - Get kitchen queue
- `GET /restaurant/kitchen/queue/station/:branchId/:station` - Get station orders
- `GET /restaurant/kitchen/queue/course-sequence/:branchId/:station` - Get by course
- `GET /restaurant/kitchen/queue/priority/:branchId` - Get by priority
- `POST /restaurant/kitchen/items/ready` - Mark item ready
- `POST /restaurant/kitchen/items/bump` - Bump item
- `POST /restaurant/kitchen/orders/bump` - Bump order
- `POST /restaurant/kitchen/orders/recall` - Recall order
- `GET /restaurant/kitchen/metrics/performance` - Get metrics

### Gateways

#### KitchenGateway
WebSocket gateway for real-time updates:
- Connection management
- Room subscriptions (station, branch)
- Event broadcasting
- Alert notifications
- Performance updates

## API Documentation

All endpoints are documented with Swagger/OpenAPI:
- Full request/response schemas
- Query parameter descriptions
- Authentication requirements
- Permission requirements
- Example responses

Access Swagger UI at: `http://localhost:3000/api/v1/docs`

## Database Schema

### kitchen_stations Table
```sql
CREATE TABLE kitchen_stations (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id),
  station_type kitchen_station_enum NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 1,
  color VARCHAR(7),
  default_prep_time INTEGER DEFAULT 15,
  warning_threshold INTEGER DEFAULT 10,
  critical_threshold INTEGER DEFAULT 5,
  sound_alerts_enabled BOOLEAN DEFAULT true,
  visual_alerts_enabled BOOLEAN DEFAULT true,
  alert_sound_url VARCHAR,
  auto_print_enabled BOOLEAN DEFAULT false,
  printer_name VARCHAR,
  printer_ip VARCHAR,
  printer_port INTEGER,
  target_completion_time INTEGER DEFAULT 20,
  track_performance BOOLEAN DEFAULT true,
  max_concurrent_orders INTEGER,
  max_items_per_order INTEGER,
  enable_course_sequencing BOOLEAN DEFAULT false,
  course_delays JSONB,
  assigned_staff JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_kitchen_stations_branch_type ON kitchen_stations(branch_id, station_type);
CREATE INDEX idx_kitchen_stations_branch_active ON kitchen_stations(branch_id, is_active);
```

## Testing

### Unit Tests
Comprehensive unit tests for KitchenService:
- Station CRUD operations
- Queue filtering and sorting
- Mark ready operations
- Bump operations
- Recall operations
- Error handling
- Edge cases

Run tests:
```bash
npm run test
npm run test:watch
npm run test:cov
```

### Integration Tests
Test the full KDS workflow:
1. Create kitchen stations
2. Receive orders in queue
3. Mark items ready
4. Bump orders
5. Track metrics

## WebSocket Client Examples

### JavaScript/TypeScript
```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/kitchen', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join kitchen station room
socket.emit('joinStation', {
  branchId: 'branch-123',
  station: 'grill'
});

// Listen for new orders
socket.on('orderReceived', (data) => {
  console.log('New order:', data);
  // Update UI
});

// Listen for item status changes
socket.on('itemStatusChanged', (data) => {
  console.log('Item status changed:', data);
  // Update UI
});

// Listen for alerts
socket.on('stationAlert', (data) => {
  console.log('Alert:', data);
  // Show alert in UI
});
```

### React Example
```typescript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function KitchenDisplay({ branchId, station }) {
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000/kitchen', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.emit('joinStation', { branchId, station });

    newSocket.on('orderReceived', (order) => {
      setOrders(prev => [...prev, order]);
    });

    newSocket.on('itemStatusChanged', ({ orderId, itemId, newStatus }) => {
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            items: order.items.map(item =>
              item.id === itemId ? { ...item, status: newStatus } : item
            )
          };
        }
        return order;
      }));
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [branchId, station]);

  return (
    <div className="kitchen-display">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

## Configuration

### Environment Variables
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=yoga_pos
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# Kitchen Display Settings
KDS_DEFAULT_PREP_TIME=15
KDS_WARNING_THRESHOLD=10
KDS_CRITICAL_THRESHOLD=5
KDS_AUTO_PRINT_ENABLED=false
```

### Branch Settings
Kitchen stations are configured per branch. Each branch can have:
- Multiple kitchen stations
- Custom prep times
- Custom alert thresholds
- Different printer configurations

## Future Enhancements

1. **Advanced Analytics**
   - Heat maps of busy periods
   - Station efficiency comparisons
   - Staff performance tracking
   - Predictive prep time estimates

2. **Mobile App Integration**
   - Kitchen staff mobile app
   - Push notifications for alerts
   - Mobile bumping functionality

3. **AI/ML Features**
   - Intelligent prep time estimation
   - Order volume prediction
   - Optimal station assignment

4. **Enhanced Printer Support**
   - Label printers
   - Multi-language support
   - Custom ticket templates
   - Logo/image printing

5. **Inventory Integration**
   - Real-time ingredient tracking
   - Low stock alerts
   - Automatic ingredient deduction

6. **Voice Alerts**
   - Text-to-speech notifications
   - Voice commands for hands-free operation

## Support

For issues or questions:
- GitHub Issues: [yoga-pos-backend/issues]
- Documentation: [API Docs at /api/v1/docs]
- Email: support@yogapos.com

## License

MIT License - See LICENSE file for details
