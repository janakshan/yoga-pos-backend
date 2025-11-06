# User Management & Security Features

This document describes the comprehensive User Management & Security system implemented in the Yoga POS application.

## Overview

The system provides enterprise-grade security features including:

- ✅ **Role-Based Access Control (RBAC)** - Granular permission system
- ✅ **Employee Account Management** - Different permission levels per role
- ✅ **Activity Logging & Audit Trails** - Complete system activity tracking
- ✅ **PIN & Password Protection** - Dual authentication methods
- ✅ **Session Management** - Multi-user concurrent access tracking
- ✅ **Multi-User Support** - Handle multiple simultaneous users

## Test Credentials

### Password Authentication

| Role | Email | Password | Username |
|------|-------|----------|----------|
| Admin | admin@yoga.com | admin123 | admin |
| Manager | manager@yoga.com | manager123 | manager |
| Staff | staff@yoga.com | staff123 | staff |
| Instructor | instructor@yoga.com | instructor123 | instructor |

### PIN Authentication

All users have PIN authentication enabled:

| Username | PIN |
|----------|-----|
| admin | 1234 |
| manager | 5678 |
| staff | 9012 |
| instructor | 3456 |

**PIN Features:**
- 4-6 digit numeric PIN
- Locked after 5 failed attempts (15-minute lockout)
- Can be enabled/disabled per user
- Attempt counter resets on successful login

## Features

### 1. Role-Based Access Control (RBAC)

Six predefined roles with hierarchical permissions:

#### Super Admin
- Full system access with all permissions
- Can manage all resources without restriction

#### Admin
- Administrative access to manage studio operations
- Full CRUD on: POS, Inventory, Products, Customers, Staff, Branches
- Access to all reports and financial data
- User and role management

#### Manager
- Branch manager with operational permissions
- POS operations and refunds
- Inventory management and adjustments
- Staff management (read/update)
- Sales and inventory reports

#### Staff
- General operational access
- POS transactions
- Customer management
- Booking management
- Product viewing

#### Instructor
- Class and booking management
- Customer information access
- Limited reporting

#### Receptionist
- Front desk operations
- Booking management
- Customer service
- Payment processing

### 2. Permission System

Granular permissions organized by category:

**Categories:**
- POS (create, read, update, delete, refund)
- Products (create, read, update, delete)
- Inventory (create, read, update, delete, adjust)
- Customers (create, read, update, delete)
- Bookings (create, read, update, delete)
- Staff (create, read, update, delete)
- Branches (create, read, update, delete)
- Reports (sales, inventory, staff, financial, export)
- Payments (process, read, refund)
- Users (create, read, update, delete, assign-roles)
- Roles (read, create, update, delete)
- Settings (read, update, business)

### 3. Audit Logging

Comprehensive activity tracking with the following event types:

#### Authentication Events
- Login/Logout
- Failed login attempts
- Password changes
- PIN changes
- Session expiration
- Token refresh

#### User Management Events
- User created/updated/deleted
- Status changes
- Role assignments
- Password resets

#### Role & Permission Events
- Role created/updated/deleted
- Permission added/removed

#### Business Events
- POS transactions
- Product changes
- Inventory adjustments
- Customer management
- Branch operations
- Report generation

**Audit Log Features:**
- Severity levels: info, warning, error, critical
- Status tracking: success, failure, pending
- Complete before/after values for changes
- IP address and user agent tracking
- Session tracking
- Branch tracking
- Advanced filtering and search
- Export to JSON/CSV

### 4. Session Management

Multi-user session tracking with:

**Session Features:**
- Unique session ID per login
- Device type detection (desktop, mobile, tablet)
- IP address tracking
- Last activity timestamp
- Session expiration
- Idle session detection (15 minutes)
- Concurrent session tracking
- Session termination (individual or all)

**Session States:**
- Active - Currently active session
- Idle - Inactive for 15+ minutes
- Expired - Session expired
- Terminated - Manually terminated

**Statistics:**
- Total/active/idle/expired sessions
- Unique concurrent users
- Sessions by branch
- Sessions by device type
- Top active users

### 5. PIN Authentication

Fast authentication for POS and quick access:

**PIN Configuration:**
- 4-6 digit numeric PIN
- Optional per user
- Can be enabled/disabled
- Independent from password

**Security Features:**
- Attempt tracking
- Automatic lockout after 5 failed attempts
- 15-minute lockout period
- Remaining attempts shown on failure
- Admin can reset attempts

**Use Cases:**
- Quick POS login
- Fast user switching
- Shared terminal access
- Mobile/tablet access

### 6. User Management

Complete user lifecycle management:

**User Profile:**
- Basic info (name, email, phone)
- Username for PIN login
- Role assignments (multiple roles)
- Status (active, inactive, suspended, pending)
- Branch association
- Last login tracking
- Password management
- PIN management
- Preferences (theme, language)

**Staff Profile (Optional):**
- Employee ID
- Position/Department
- Employment type (full-time, part-time, contract, intern)
- Employment status (employed, on leave, terminated)
- Hire date / Termination date
- Compensation (salary or hourly)
- Work schedule (weekly schedule)
- Emergency contact
- Address

## API Reference

### Authentication Service

```javascript
import { authService } from '@/features/auth/services/authService';

// Password login
const response = await authService.login({
  email: 'admin@yoga.com',
  password: 'admin123',
  rememberMe: true
});

// PIN login
const response = await authService.loginWithPIN({
  username: 'admin',
  pin: '1234',
  rememberMe: false
});

// Set PIN
await authService.setPIN(userId, '1234');

// Disable PIN
await authService.disablePIN(userId);

// Reset PIN attempts (admin)
await authService.resetPINAttempts(userId);
```

### Audit Service

```javascript
import { auditService } from '@/features/audit/services/auditService';

// Create audit log
await auditService.create({
  eventType: 'user.login',
  severity: 'info',
  status: 'success',
  userId: 'user_1',
  userName: 'Admin User',
  resource: 'authentication',
  action: 'User logged in successfully',
  ipAddress: '192.168.1.100',
});

// Get audit logs with filters
const logs = await auditService.getAll({
  eventType: 'user.login',
  userId: 'user_1',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  sortBy: 'timestamp',
  sortOrder: 'desc',
});

// Get audit statistics
const stats = await auditService.getStats();

// Export audit logs
const result = await auditService.export(filters, 'csv');
```

### Session Service

```javascript
import { sessionService } from '@/features/session/services/sessionService';

// Create session
const session = await sessionService.create({
  userId: 'user_1',
  userName: 'Admin User',
  userEmail: 'admin@yoga.com',
  token: 'jwt-token',
  refreshToken: 'refresh-token',
  expiresIn: 86400,
});

// Get active sessions for user
const sessions = await sessionService.getActiveByUserId('user_1');

// Update session activity
await sessionService.updateActivity(sessionId);

// Terminate session
await sessionService.terminate(sessionId);

// Terminate all user sessions except current
await sessionService.terminateAllForUser(userId, currentSessionId);

// Check concurrent access
const info = await sessionService.checkConcurrentAccess(userId, 'branch', 'branch_1');

// Get session statistics
const stats = await sessionService.getStats();
```

## React Hooks

### useAudit Hook

```javascript
import { useAudit, useAuditLogger } from '@/features/audit/hooks/useAudit';

function MyComponent() {
  const {
    logs,
    stats,
    loading,
    fetchAuditLogs,
    setAuditFilters,
  } = useAudit();

  // Easy audit logging
  const logAudit = useAuditLogger();

  const handleAction = async () => {
    await logAudit('product.updated', 'Updated product pricing', {
      resource: 'product',
      resourceId: 'prod_123',
      oldValues: { price: 45 },
      newValues: { price: 50 },
    });
  };
}
```

### useSession Hook

```javascript
import { useSession, useSessionActivityTracker } from '@/features/session/hooks/useSession';

function MyComponent() {
  const {
    current,
    stats,
    sessions,
    terminateSession,
  } = useSession();

  // Auto-track session activity
  useSessionActivityTracker(true);

  return (
    <div>
      <p>Current User: {current?.userName}</p>
      <p>Active Sessions: {stats?.activeSessions}</p>
    </div>
  );
}
```

## Security Best Practices

1. **Password Security**
   - Minimum 8 characters required
   - In production, passwords should be hashed (bcrypt/argon2)
   - Force password change for new users
   - Regular password rotation policy

2. **PIN Security**
   - Limited to 4-6 digits for usability
   - Automatic lockout after failed attempts
   - Should be hashed in production
   - Use only for quick access, not primary authentication

3. **Session Management**
   - Sessions expire after 24 hours
   - Idle sessions marked after 15 minutes
   - Regular cleanup of old sessions
   - Monitor concurrent access

4. **Audit Logging**
   - Log all sensitive operations
   - Include before/after values for changes
   - Regular export and archival
   - Set data retention policies
   - Monitor for suspicious activity

5. **Access Control**
   - Follow principle of least privilege
   - Regular role and permission audits
   - Separate admin operations
   - Monitor permission changes

## Database Schema (Future Backend)

When implementing a real backend, use this schema:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  pin_hash VARCHAR(255),
  pin_enabled BOOLEAN DEFAULT FALSE,
  pin_attempts INTEGER DEFAULT 0,
  pin_locked_until TIMESTAMP,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  branch_id UUID,
  last_login TIMESTAMP,
  password_changed_at TIMESTAMP,
  must_change_password BOOLEAN DEFAULT TRUE,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  user_id UUID NOT NULL,
  user_name VARCHAR(255),
  target_user_id UUID,
  target_user_name VARCHAR(255),
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id UUID,
  branch_id UUID,
  branch_name VARCHAR(255),
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_session_id ON audit_logs(session_id);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(20),
  device_name VARCHAR(100),
  location VARCHAR(255),
  branch_id UUID,
  branch_name VARCHAR(255),
  is_current BOOLEAN DEFAULT TRUE,
  metadata JSONB
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

## Testing

### Test Scenarios

1. **Password Login**
   - ✅ Login with valid credentials
   - ✅ Login with invalid credentials
   - ✅ Login with non-existent user
   - ✅ Session creation on login
   - ✅ Audit log creation on login

2. **PIN Login**
   - ✅ Login with valid PIN
   - ✅ Login with invalid PIN
   - ✅ PIN lockout after 5 attempts
   - ✅ Remaining attempts counter
   - ✅ PIN unlock after timeout

3. **Session Management**
   - ✅ Session creation on login
   - ✅ Activity tracking
   - ✅ Idle detection
   - ✅ Session expiration
   - ✅ Concurrent session handling
   - ✅ Session termination

4. **Audit Logging**
   - ✅ Login/logout events
   - ✅ CRUD operations
   - ✅ Permission changes
   - ✅ Failed operations
   - ✅ Before/after values

5. **Role-Based Access**
   - ✅ Permission enforcement
   - ✅ Role hierarchy
   - ✅ Custom role creation
   - ✅ Permission assignment
   - ✅ Access denial

## Support

For questions or issues:
- Check the main README.md
- Review component examples
- Check the API documentation above
- Contact the development team

---

**Version:** 1.0.0
**Last Updated:** 2024-11-06
