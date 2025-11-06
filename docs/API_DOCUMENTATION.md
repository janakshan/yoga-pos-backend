# Yoga POS - Complete API Documentation

> **Version:** 1.0.0
> **Last Updated:** 2025-11-06
> **Base URL:** `https://api.yourdomain.com/api/v1`

This document provides comprehensive API specifications for the Yoga POS system, covering all features, endpoints, request/response formats, and data types.

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [User Management](#user-management)
3. [Role & Permission Management](#role--permission-management)
4. [Branch Management](#branch-management)
5. [Product Management](#product-management)
6. [Customer Management](#customer-management)
7. [Inventory Management](#inventory-management)
8. [Point of Sale (POS)](#point-of-sale-pos)
9. [Financial Management](#financial-management)
10. [Purchase & Supplier Management](#purchase--supplier-management)
11. [Reports & Analytics](#reports--analytics)
12. [Notification System](#notification-system)
13. [Backup & Cloud Integration](#backup--cloud-integration)
14. [Settings](#settings)

---

## Authentication & Authorization

### Base Path: `/auth`

#### 1. Login with Email/Password

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "admin@yoga.com",
  "password": "admin123",
  "rememberMe": true
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "1",
    "email": "admin@yoga.com",
    "username": "admin",
    "name": "Admin User",
    "role": "admin",
    "avatar": "https://...",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2025-11-06T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresIn": 86400
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `404 Not Found` - User not found

---

#### 2. Login with PIN

**Endpoint:** `POST /auth/login/pin`

**Request Body:**
```json
{
  "username": "admin",
  "pin": "1234",
  "rememberMe": false
}
```

**Response:** `200 OK`
```json
{
  "user": { /* User object */ },
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "expiresIn": 86400
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid PIN
- `423 Locked` - PIN locked after 5 failed attempts
- `404 Not Found` - User not found

---

#### 3. Logout

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

#### 4. Refresh Token

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:** `200 OK`
```json
{
  "token": "new_jwt_token",
  "refreshToken": "new_refresh_token",
  "expiresIn": 86400
}
```

---

#### 5. Get Current User

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "id": "1",
  "email": "admin@yoga.com",
  "name": "Admin User",
  "role": "admin",
  "avatar": "https://...",
  "phone": "+1234567890",
  "lastLogin": "2025-11-06T10:00:00.000Z"
}
```

---

#### 6. Set PIN

**Endpoint:** `POST /auth/pin/set`

**Request Body:**
```json
{
  "userId": "1",
  "newPIN": "1234"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "PIN set successfully"
}
```

---

#### 7. Disable PIN

**Endpoint:** `POST /auth/pin/disable`

**Request Body:**
```json
{
  "userId": "1"
}
```

**Response:** `200 OK`

---

#### 8. Reset PIN Attempts

**Endpoint:** `POST /auth/pin/reset-attempts`

**Request Body:**
```json
{
  "userId": "1"
}
```

**Response:** `200 OK`

---

## User Management

### Base Path: `/users`

#### 1. Get All Users

**Endpoint:** `GET /users`

**Query Parameters:**
- `search` (string) - Search by name, email, username
- `role` (string) - Filter by role (admin, manager, staff, instructor)
- `status` (string) - Filter by status (active, inactive, suspended)
- `branchId` (string) - Filter by branch
- `sortBy` (string) - Sort field (name, email, createdAt)
- `sortOrder` (string) - asc or desc

**Response:** `200 OK`
```json
[
  {
    "id": "1",
    "username": "admin",
    "email": "admin@yoga.com",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+1234567890",
    "avatar": "https://...",
    "roles": ["admin"],
    "permissions": ["read:users", "write:users"],
    "status": "active",
    "branchId": "branch_001",
    "lastLogin": "2025-11-06T10:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2025-11-06T10:00:00.000Z"
  }
]
```

---

#### 2. Get User by ID

**Endpoint:** `GET /users/:id`

**Response:** `200 OK`
```json
{
  "id": "1",
  "username": "admin",
  "email": "admin@yoga.com",
  "firstName": "Admin",
  "lastName": "User",
  "phone": "+1234567890",
  "avatar": "https://...",
  "roles": ["admin"],
  "permissions": ["read:users", "write:users"],
  "status": "active",
  "branchId": "branch_001",
  "preferences": {
    "theme": "dark",
    "language": "en"
  },
  "staffProfile": {
    "employeeId": "EMP001",
    "position": "Manager",
    "department": "Operations",
    "employmentType": "full_time",
    "hireDate": "2024-01-01",
    "salary": 50000,
    "schedule": {}
  },
  "lastLogin": "2025-11-06T10:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### 3. Create User

**Endpoint:** `POST /users`

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@yoga.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "User",
  "phone": "+1234567890",
  "roles": ["staff"],
  "status": "active",
  "branchId": "branch_001",
  "staffProfile": {
    "position": "Instructor",
    "employmentType": "part_time",
    "hireDate": "2025-11-06"
  }
}
```

**Response:** `201 Created`

---

#### 4. Update User

**Endpoint:** `PUT /users/:id`

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "+1234567890",
  "status": "active"
}
```

**Response:** `200 OK`

---

#### 5. Delete User

**Endpoint:** `DELETE /users/:id`

**Response:** `204 No Content`

---

#### 6. Get User Statistics

**Endpoint:** `GET /users/stats`

**Response:** `200 OK`
```json
{
  "totalUsers": 150,
  "activeUsers": 145,
  "inactiveUsers": 3,
  "suspendedUsers": 2,
  "usersByRole": {
    "admin": 5,
    "manager": 10,
    "staff": 100,
    "instructor": 35
  },
  "newUsersThisMonth": 12
}
```

---

#### 7. Bulk Update User Roles

**Endpoint:** `POST /users/bulk/roles`

**Request Body:**
```json
{
  "userIds": ["1", "2", "3"],
  "roleIds": ["role_staff", "role_instructor"]
}
```

**Response:** `200 OK`

---

## Role & Permission Management

### Base Path: `/roles` and `/permissions`

#### 1. Get All Roles

**Endpoint:** `GET /roles`

**Query Parameters:**
- `search` (string)
- `isSystem` (boolean)
- `isActive` (boolean)

**Response:** `200 OK`
```json
[
  {
    "id": "role_001",
    "code": "admin",
    "name": "Administrator",
    "description": "Full system access",
    "permissions": ["*"],
    "isSystem": true,
    "isActive": true,
    "userCount": 5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### 2. Get Role by ID

**Endpoint:** `GET /roles/:id`

**Response:** `200 OK`

---

#### 3. Create Role

**Endpoint:** `POST /roles`

**Request Body:**
```json
{
  "code": "custom_role",
  "name": "Custom Role",
  "description": "Custom role description",
  "permissions": ["read:products", "write:products"],
  "isActive": true
}
```

**Response:** `201 Created`

---

#### 4. Update Role

**Endpoint:** `PUT /roles/:id`

**Response:** `200 OK`

---

#### 5. Delete Role

**Endpoint:** `DELETE /roles/:id`

**Response:** `204 No Content`

---

#### 6. Assign Permissions to Role

**Endpoint:** `POST /roles/:id/permissions`

**Request Body:**
```json
{
  "permissions": ["read:products", "write:products", "delete:products"]
}
```

**Response:** `200 OK`

---

#### 7. Get All Permissions

**Endpoint:** `GET /permissions`

**Response:** `200 OK`
```json
[
  {
    "id": "perm_001",
    "code": "read:products",
    "name": "Read Products",
    "description": "View product information",
    "resource": "products",
    "action": "read"
  }
]
```

---

#### 8. Get Permissions by Role

**Endpoint:** `GET /permissions/role/:roleId`

**Response:** `200 OK`

---

## Branch Management

### Base Path: `/branches`

#### 1. Get All Branches

**Endpoint:** `GET /branches`

**Query Parameters:**
- `search` (string)
- `isActive` (boolean)
- `city` (string)
- `state` (string)
- `sortBy` (string)

**Response:** `200 OK`
```json
[
  {
    "id": "branch_001",
    "name": "Main Branch",
    "code": "MAIN",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "USA",
    "phone": "+1-555-0100",
    "email": "main@yoga.com",
    "managerId": "user_002",
    "managerName": "Manager User",
    "isActive": true,
    "staffCount": 25,
    "monthlyRevenue": 45000,
    "transactionCount": 320,
    "averageTicketSize": 140.63,
    "customerCount": 180,
    "inventoryValue": 25000,
    "settings": {
      "timezone": "America/Los_Angeles",
      "currency": "USD",
      "taxRate": 8.5,
      "operatingHours": {
        "monday": { "open": "09:00", "close": "21:00" },
        "tuesday": { "open": "09:00", "close": "21:00" }
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2025-11-06T00:00:00.000Z"
  }
]
```

---

#### 2. Get Branch by ID

**Endpoint:** `GET /branches/:id`

**Response:** `200 OK`

---

#### 3. Create Branch

**Endpoint:** `POST /branches`

**Request Body:**
```json
{
  "name": "New Branch",
  "code": "NEW",
  "address": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90001",
  "country": "USA",
  "phone": "+1-555-0200",
  "email": "new@yoga.com",
  "managerId": "user_003",
  "settings": {
    "timezone": "America/Los_Angeles",
    "currency": "USD",
    "taxRate": 9.5
  }
}
```

**Response:** `201 Created`

---

#### 4. Update Branch

**Endpoint:** `PUT /branches/:id`

**Response:** `200 OK`

---

#### 5. Delete Branch

**Endpoint:** `DELETE /branches/:id`

**Response:** `204 No Content`

---

#### 6. Get Branch Statistics

**Endpoint:** `GET /branches/stats`

**Response:** `200 OK`
```json
{
  "totalBranches": 10,
  "activeBranches": 9,
  "inactiveBranches": 1,
  "totalRevenue": 450000,
  "totalCustomers": 1800,
  "totalStaff": 250,
  "averageRevenuePerBranch": 45000
}
```

---

#### 7. Assign Manager to Branch

**Endpoint:** `POST /branches/:id/manager`

**Request Body:**
```json
{
  "managerId": "user_005",
  "name": "New Manager"
}
```

**Response:** `200 OK`

---

#### 8. Bulk Update Branch Status

**Endpoint:** `POST /branches/bulk/status`

**Request Body:**
```json
{
  "branchIds": ["branch_001", "branch_002"],
  "isActive": true
}
```

**Response:** `200 OK`

---

#### 9. Get Consolidated Performance

**Endpoint:** `GET /branches/performance`

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `groupBy` (string) - day, week, month

**Response:** `200 OK`
```json
{
  "totalRevenue": 450000,
  "totalTransactions": 3200,
  "averageTicketSize": 140.63,
  "byBranch": [
    {
      "branchId": "branch_001",
      "branchName": "Main Branch",
      "revenue": 45000,
      "transactions": 320,
      "growth": 12.5
    }
  ]
}
```

---

#### 10. Compare Branches

**Endpoint:** `POST /branches/compare`

**Request Body:**
```json
{
  "branchIds": ["branch_001", "branch_002", "branch_003"]
}
```

**Response:** `200 OK`

---

#### 11. Update Branch Settings

**Endpoint:** `PUT /branches/:id/settings`

**Request Body:**
```json
{
  "timezone": "America/New_York",
  "currency": "USD",
  "taxRate": 8.0,
  "operatingHours": {}
}
```

**Response:** `200 OK`

---

#### 12. Clone Branch Settings

**Endpoint:** `POST /branches/settings/clone`

**Request Body:**
```json
{
  "sourceBranchId": "branch_001",
  "targetBranchIds": ["branch_002", "branch_003"]
}
```

**Response:** `200 OK`

---

## Product Management

### Base Path: `/products`

#### 1. Get All Products

**Endpoint:** `GET /products`

**Query Parameters:**
- `search` (string) - Search name, SKU, description, tags
- `category` (string) - Filter by category
- `subcategory` (string) - Filter by subcategory
- `status` (string) - active, inactive, discontinued
- `lowStock` (boolean) - Get low stock products
- `minPrice` (number)
- `maxPrice` (number)
- `tags` (array) - Filter by tags
- `sortBy` (string) - name, price, stockQuantity, createdAt
- `sortOrder` (string) - asc, desc

**Response:** `200 OK`
```json
[
  {
    "id": "prod_001",
    "sku": "YM-001-BLU",
    "name": "Premium Yoga Mat - Ocean Blue",
    "description": "High-quality non-slip yoga mat...",
    "category": "yoga_mat",
    "subcategory": "yoga_mat_premium",
    "price": 49.99,
    "pricing": {
      "retail": 49.99,
      "wholesale": 39.99,
      "member": 44.99
    },
    "cost": 25.00,
    "stockQuantity": 45,
    "lowStockThreshold": 10,
    "unit": "piece",
    "unitConversions": [],
    "barcode": "1234567890123",
    "imageUrl": "/images/products/yoga-mat-blue.jpg",
    "imageUrls": ["/images/products/yoga-mat-blue.jpg"],
    "status": "active",
    "tags": ["yoga", "mat", "premium", "eco-friendly"],
    "attributes": [
      {
        "id": "attr_001",
        "name": "Color",
        "value": "Ocean Blue",
        "isVariant": false
      }
    ],
    "trackInventory": true,
    "allowBackorder": false,
    "taxRate": 10,
    "supplier": "Yoga Supplies Co.",
    "supplierId": "sup_001",
    "variants": [],
    "isBundle": false,
    "bundle": null,
    "customFields": {
      "weight": "1.2kg",
      "dimensions": "183cm x 61cm x 0.6cm"
    },
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
]
```

---

#### 2. Get Product by ID

**Endpoint:** `GET /products/:id`

**Response:** `200 OK`

---

#### 3. Get Product by SKU

**Endpoint:** `GET /products/sku/:sku`

**Response:** `200 OK`

---

#### 4. Create Product

**Endpoint:** `POST /products`

**Request Body:**
```json
{
  "sku": "NEW-001",
  "name": "New Product",
  "description": "Product description",
  "category": "yoga_mat",
  "subcategory": "yoga_mat_basic",
  "price": 29.99,
  "pricing": {
    "retail": 29.99,
    "wholesale": 24.99,
    "member": 27.99
  },
  "cost": 15.00,
  "stockQuantity": 100,
  "lowStockThreshold": 20,
  "unit": "piece",
  "barcode": "1234567890999",
  "imageUrl": "/path/to/image.jpg",
  "status": "active",
  "tags": ["yoga", "mat"],
  "attributes": [],
  "trackInventory": true,
  "allowBackorder": false,
  "taxRate": 10,
  "supplierId": "sup_001"
}
```

**Response:** `201 Created`

---

#### 5. Update Product

**Endpoint:** `PUT /products/:id`

**Request Body:** (Partial update supported)
```json
{
  "price": 34.99,
  "stockQuantity": 120,
  "status": "active"
}
```

**Response:** `200 OK`

---

#### 6. Delete Product

**Endpoint:** `DELETE /products/:id`

**Response:** `204 No Content`

---

#### 7. Get Product Statistics

**Endpoint:** `GET /products/stats`

**Response:** `200 OK`
```json
{
  "totalProducts": 150,
  "activeProducts": 145,
  "inactiveProducts": 3,
  "discontinuedProducts": 2,
  "lowStockProducts": 12,
  "outOfStockProducts": 3,
  "totalInventoryValue": 125000,
  "totalRetailValue": 250000,
  "productsByCategory": {
    "yoga_mat": 45,
    "yoga_block": 30,
    "clothing": 50
  }
}
```

---

#### 8. Adjust Product Inventory

**Endpoint:** `POST /products/:id/inventory/adjust`

**Request Body:**
```json
{
  "adjustment": 10
}
```

**Response:** `200 OK`

---

#### 9. Bulk Update Product Status

**Endpoint:** `POST /products/bulk/status`

**Request Body:**
```json
{
  "productIds": ["prod_001", "prod_002"],
  "status": "active"
}
```

**Response:** `200 OK`

---

#### 10. Get Low Stock Products

**Endpoint:** `GET /products/stock/low`

**Response:** `200 OK`

---

#### 11. Get Out of Stock Products

**Endpoint:** `GET /products/stock/out`

**Response:** `200 OK`

---

#### 12. Get Bundle Products

**Endpoint:** `GET /products/bundles`

**Response:** `200 OK`

---

#### 13. Calculate Bundle Price

**Endpoint:** `POST /products/bundles/calculate`

**Request Body:**
```json
{
  "items": [
    {
      "productId": "prod_001",
      "quantity": 1,
      "discount": 0
    },
    {
      "productId": "prod_003",
      "quantity": 1,
      "discount": 5
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "items": [],
  "totalPrice": 84.97,
  "totalCost": 43.00,
  "regularPrice": 89.97
}
```

---

#### 14. Get Products by Subcategory

**Endpoint:** `GET /products/subcategory/:subcategoryId`

**Response:** `200 OK`

---

#### 15. Get Subcategories for Category

**Endpoint:** `GET /products/categories/:category/subcategories`

**Response:** `200 OK`

---

#### 16. Generate Product Barcode

**Endpoint:** `POST /products/barcode/generate`

**Request Body:**
```json
{
  "type": "EAN13",
  "prefix": "200",
  "sku": "YM-001",
  "productId": "prod_001"
}
```

**Response:** `200 OK`
```json
{
  "barcode": "2001234567890"
}
```

---

#### 17. Search Products by Attributes

**Endpoint:** `POST /products/search/attributes`

**Request Body:**
```json
{
  "color": "blue",
  "material": "tpe"
}
```

**Response:** `200 OK`

---

#### 18. Get Products by Pricing Tier

**Endpoint:** `GET /products/pricing/:tier`

**Query Parameters:**
- `minPrice` (number)
- `maxPrice` (number)

**Response:** `200 OK`

---

#### 19. Update Product Pricing

**Endpoint:** `PUT /products/:id/pricing`

**Request Body:**
```json
{
  "retail": 54.99,
  "wholesale": 44.99,
  "member": 49.99
}
```

**Response:** `200 OK`

---

#### 20. Add Custom Field to Product

**Endpoint:** `POST /products/:id/fields`

**Request Body:**
```json
{
  "fieldName": "warranty",
  "fieldValue": "2 years"
}
```

**Response:** `200 OK`

---

#### 21. Get Available Attributes

**Endpoint:** `GET /products/attributes`

**Response:** `200 OK`
```json
[
  "Color",
  "Material",
  "Size",
  "Thickness"
]
```

---

## Customer Management

### Base Path: `/customers`

#### 1. Get All Customers

**Endpoint:** `GET /customers`

**Query Parameters:**
- `search` (string) - Search name, email, phone
- `status` (string) - active, inactive, blocked
- `customerType` (string) - vip, regular, corporate
- `loyaltyTier` (string) - bronze, silver, gold, platinum
- `sortBy` (string)
- `sortOrder` (string)

**Response:** `200 OK`
```json
[
  {
    "id": "cust_001",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "email": "sarah.johnson@email.com",
    "phone": "+1-555-0101",
    "alternatePhone": "+1-555-0201",
    "dateOfBirth": "1990-05-15",
    "gender": "female",
    "address": {
      "street": "123 Main Street",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "country": "USA"
    },
    "customerType": "vip",
    "status": "active",
    "segments": ["seg_vip", "seg_high_value"],
    "loyaltyInfo": {
      "points": 5500,
      "tier": "gold",
      "joinedDate": "2023-01-15",
      "lastEarnedDate": "2025-11-01",
      "lifetimePoints": 8200
    },
    "creditInfo": {
      "creditLimit": 5000,
      "currentBalance": 0,
      "availableCredit": 5000,
      "creditStatus": "good"
    },
    "storeCredit": {
      "balance": 150.00,
      "expiryDate": "2026-10-15"
    },
    "preferences": {
      "emailNotifications": true,
      "smsNotifications": false,
      "preferredContactMethod": "email",
      "preferredLanguage": "en"
    },
    "stats": {
      "totalPurchases": 45,
      "totalSpent": 2850.75,
      "lastPurchaseDate": "2025-11-01",
      "averageOrderValue": 63.35
    },
    "notes": "Regular customer, prefers morning classes",
    "tags": ["regular", "yoga-enthusiast"],
    "referredBy": null,
    "referralCount": 3,
    "createdAt": "2023-01-15T00:00:00.000Z",
    "updatedAt": "2025-11-01T00:00:00.000Z"
  }
]
```

---

#### 2. Get Customer by ID

**Endpoint:** `GET /customers/:id`

**Response:** `200 OK`

---

#### 3. Create Customer

**Endpoint:** `POST /customers`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@email.com",
  "phone": "+1-555-0150",
  "dateOfBirth": "1985-03-20",
  "gender": "male",
  "address": {
    "street": "789 Pine St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94103",
    "country": "USA"
  },
  "customerType": "regular",
  "preferences": {
    "emailNotifications": true,
    "smsNotifications": true
  }
}
```

**Response:** `201 Created`

---

#### 4. Update Customer

**Endpoint:** `PUT /customers/:id`

**Response:** `200 OK`

---

#### 5. Delete Customer

**Endpoint:** `DELETE /customers/:id`

**Response:** `204 No Content`

---

#### 6. Update Loyalty Points

**Endpoint:** `POST /customers/:id/loyalty/points`

**Request Body:**
```json
{
  "pointsChange": 100
}
```

**Response:** `200 OK`

---

#### 7. Update Purchase Statistics

**Endpoint:** `POST /customers/:id/stats/purchase`

**Request Body:**
```json
{
  "amount": 125.50
}
```

**Response:** `200 OK`

---

#### 8. Get Customer Statistics

**Endpoint:** `GET /customers/stats`

**Response:** `200 OK`
```json
{
  "totalCustomers": 500,
  "activeCustomers": 480,
  "vipCustomers": 50,
  "totalRevenue": 285000,
  "averageCustomerValue": 570,
  "newThisMonth": 25
}
```

---

#### 9. Bulk Update Customer Status

**Endpoint:** `POST /customers/bulk/status`

**Request Body:**
```json
{
  "customerIds": ["cust_001", "cust_002"],
  "status": "active"
}
```

**Response:** `200 OK`

---

### Customer Segments

#### 10. Get All Segments

**Endpoint:** `GET /customers/segments`

**Response:** `200 OK`
```json
[
  {
    "id": "seg_vip",
    "name": "VIP Customers",
    "description": "High-value VIP customers",
    "criteria": {
      "type": "automatic",
      "rules": {
        "customerType": "vip",
        "minSpent": 2000
      }
    },
    "customerIds": ["cust_001", "cust_005"],
    "customerCount": 2,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
]
```

---

#### 11. Get Segment by ID

**Endpoint:** `GET /customers/segments/:id`

**Response:** `200 OK`

---

#### 12. Create Segment

**Endpoint:** `POST /customers/segments`

**Request Body:**
```json
{
  "name": "High Spenders",
  "description": "Customers who spent over $5000",
  "criteria": {
    "type": "automatic",
    "rules": {
      "minSpent": 5000
    }
  }
}
```

**Response:** `201 Created`

---

#### 13. Update Segment

**Endpoint:** `PUT /customers/segments/:id`

**Response:** `200 OK`

---

#### 14. Delete Segment

**Endpoint:** `DELETE /customers/segments/:id`

**Response:** `204 No Content`

---

#### 15. Assign Customers to Segment

**Endpoint:** `POST /customers/segments/:id/assign`

**Request Body:**
```json
{
  "customerIds": ["cust_001", "cust_002", "cust_003"]
}
```

**Response:** `200 OK`

---

#### 16. Remove Customers from Segment

**Endpoint:** `POST /customers/segments/:id/remove`

**Request Body:**
```json
{
  "customerIds": ["cust_001"]
}
```

**Response:** `200 OK`

---

### Customer Notes

#### 17. Get Customer Notes

**Endpoint:** `GET /customers/:customerId/notes`

**Response:** `200 OK`
```json
[
  {
    "id": "note_001",
    "customerId": "cust_001",
    "note": "Customer expressed interest in workshops",
    "type": "sales",
    "createdBy": "admin",
    "createdAt": "2025-10-15T00:00:00.000Z"
  }
]
```

---

#### 18. Add Customer Note

**Endpoint:** `POST /customers/:customerId/notes`

**Request Body:**
```json
{
  "note": "Follow up on membership renewal",
  "type": "general"
}
```

**Response:** `201 Created`

---

#### 19. Update Customer Note

**Endpoint:** `PUT /customers/notes/:noteId`

**Request Body:**
```json
{
  "note": "Updated note content"
}
```

**Response:** `200 OK`

---

#### 20. Delete Customer Note

**Endpoint:** `DELETE /customers/notes/:noteId`

**Response:** `204 No Content`

---

### Purchase History

#### 21. Get Customer Purchase History

**Endpoint:** `GET /customers/:customerId/purchases`

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `status` (string)

**Response:** `200 OK`
```json
[
  {
    "id": "order_001",
    "customerId": "cust_001",
    "date": "2025-11-01",
    "amount": 120.00,
    "discount": 12.00,
    "total": 108.00,
    "paymentMethod": "credit_card",
    "items": [
      {
        "name": "Yoga Mat Premium",
        "quantity": 1,
        "price": 80.00
      }
    ],
    "status": "completed"
  }
]
```

---

#### 22. Get Purchase History Stats

**Endpoint:** `GET /customers/:customerId/purchases/stats`

**Response:** `200 OK`
```json
{
  "totalOrders": 45,
  "totalSpent": 2850.75,
  "averageOrderValue": 63.35,
  "totalSaved": 285.50,
  "lastOrderDate": "2025-11-01",
  "firstOrderDate": "2023-01-20"
}
```

---

### Credit Management

#### 23. Get Credit Transactions

**Endpoint:** `GET /customers/:customerId/credit/transactions`

**Response:** `200 OK`
```json
[
  {
    "id": "credit_tx_001",
    "customerId": "cust_001",
    "type": "payment",
    "amount": 500.00,
    "balanceBefore": 500.00,
    "balanceAfter": 0,
    "description": "Payment received",
    "date": "2025-10-25"
  }
]
```

---

#### 24. Create Credit Charge

**Endpoint:** `POST /customers/:customerId/credit/charge`

**Request Body:**
```json
{
  "amount": 250.00,
  "description": "Order #12345"
}
```

**Response:** `201 Created`

---

#### 25. Create Credit Payment

**Endpoint:** `POST /customers/:customerId/credit/payment`

**Request Body:**
```json
{
  "amount": 250.00,
  "paymentMethod": "bank_transfer",
  "description": "Payment for outstanding balance"
}
```

**Response:** `201 Created`

---

#### 26. Update Credit Limit

**Endpoint:** `PUT /customers/:customerId/credit/limit`

**Request Body:**
```json
{
  "newLimit": 10000
}
```

**Response:** `200 OK`

---

### Store Credit

#### 27. Get Store Credit Transactions

**Endpoint:** `GET /customers/:customerId/store-credit/transactions`

**Response:** `200 OK`

---

#### 28. Add Store Credit

**Endpoint:** `POST /customers/:customerId/store-credit/add`

**Request Body:**
```json
{
  "amount": 50.00,
  "reason": "Return credit",
  "orderId": "order_123",
  "expiryDate": "2026-11-06"
}
```

**Response:** `201 Created`

---

#### 29. Deduct Store Credit

**Endpoint:** `POST /customers/:customerId/store-credit/deduct`

**Request Body:**
```json
{
  "amount": 25.00,
  "reason": "Applied to order",
  "orderId": "order_124"
}
```

**Response:** `200 OK`

---

#### 30. Redeem Loyalty Points

**Endpoint:** `POST /customers/:customerId/loyalty/redeem`

**Request Body:**
```json
{
  "points": 1000,
  "conversionRate": 100
}
```

**Response:** `200 OK`
```json
{
  "pointsRedeemed": 1000,
  "storeCreditAdded": 10.00,
  "transaction": {}
}
```

---

## Inventory Management

### Base Path: `/inventory`

#### 1. Get Inventory Transactions

**Endpoint:** `GET /inventory/transactions`

**Query Parameters:**
- `search` (string)
- `productId` (string)
- `type` (string) - purchase, sale, adjustment, return, damage, write_off, transfer_in, transfer_out
- `status` (string) - completed, pending, cancelled
- `locationId` (string)
- `startDate` (date)
- `endDate` (date)
- `batchNumber` (string)
- `referenceNumber` (string)
- `sortBy` (string)
- `sortOrder` (string)

**Response:** `200 OK`
```json
[
  {
    "id": "inv_001",
    "productId": "prod_001",
    "productName": "Premium Yoga Mat - Ocean Blue",
    "productSku": "YM-001-BLU",
    "type": "purchase",
    "quantity": 50,
    "unitCost": 25.00,
    "totalCost": 1250.00,
    "balanceAfter": 50,
    "batchNumber": "BATCH-2024-001",
    "serialNumber": null,
    "expiryDate": null,
    "locationId": "loc_001",
    "locationName": "Main Store",
    "referenceType": "purchase_order",
    "referenceId": "PO-2024-001",
    "referenceNumber": "PO-2024-001",
    "notes": "Initial stock purchase",
    "status": "completed",
    "transactionDate": "2024-01-10",
    "createdAt": "2024-01-10",
    "createdBy": "user_001",
    "createdByName": "Admin User"
  }
]
```

---

#### 2. Get Transaction by ID

**Endpoint:** `GET /inventory/transactions/:id`

**Response:** `200 OK`

---

#### 3. Create Inventory Transaction

**Endpoint:** `POST /inventory/transactions`

**Request Body:**
```json
{
  "productId": "prod_001",
  "productName": "Premium Yoga Mat",
  "productSku": "YM-001-BLU",
  "type": "purchase",
  "quantity": 25,
  "unitCost": 25.00,
  "locationId": "loc_001",
  "locationName": "Main Store",
  "batchNumber": "BATCH-2025-001",
  "referenceType": "purchase_order",
  "referenceNumber": "PO-2025-050",
  "notes": "Bulk order from supplier",
  "transactionDate": "2025-11-06"
}
```

**Response:** `201 Created`

---

#### 4. Update Transaction

**Endpoint:** `PUT /inventory/transactions/:id`

**Response:** `200 OK`

---

#### 5. Delete Transaction

**Endpoint:** `DELETE /inventory/transactions/:id`

**Response:** `204 No Content`

---

#### 6. Cancel Transaction

**Endpoint:** `POST /inventory/transactions/:id/cancel`

**Response:** `200 OK`

---

### Stock Levels

#### 7. Get Stock Levels

**Endpoint:** `GET /inventory/stock-levels`

**Query Parameters:**
- `search` (string)
- `locationId` (string)
- `lowStock` (boolean)
- `outOfStock` (boolean)
- `sortBy` (string)
- `sortOrder` (string)

**Response:** `200 OK`
```json
[
  {
    "productId": "prod_001",
    "productName": "Premium Yoga Mat - Ocean Blue",
    "productSku": "YM-001-BLU",
    "locationId": "loc_001",
    "locationName": "Main Store",
    "quantity": 45,
    "lowStockThreshold": 10,
    "reorderPoint": 15,
    "reorderQuantity": 50,
    "isLowStock": false,
    "isOutOfStock": false,
    "averageCost": 25.00,
    "totalValue": 1125.00,
    "lastRestockedAt": "2024-01-10",
    "lastSoldAt": "2024-01-15",
    "updatedAt": "2024-01-15"
  }
]
```

---

#### 8. Get Stock Level for Product

**Endpoint:** `GET /inventory/stock-levels/:productId`

**Query Parameters:**
- `locationId` (string)

**Response:** `200 OK`

---

#### 9. Get Inventory Statistics

**Endpoint:** `GET /inventory/stats`

**Response:** `200 OK`
```json
{
  "totalTransactions": 150,
  "totalProducts": 75,
  "lowStockProducts": 12,
  "outOfStockProducts": 3,
  "totalInventoryValue": 125000,
  "totalPurchaseValue": 85000,
  "totalSaleValue": 150000,
  "transactionsByType": {
    "purchase": 45,
    "sale": 85,
    "adjustment": 10
  },
  "valueByLocation": {
    "Main Store": 75000,
    "Branch 2": 50000
  },
  "recentTransactions": [],
  "topMovingProducts": []
}
```

---

#### 10. Get Low Stock Products

**Endpoint:** `GET /inventory/stock-levels/low`

**Response:** `200 OK`

---

#### 11. Get Out of Stock Products

**Endpoint:** `GET /inventory/stock-levels/out`

**Response:** `200 OK`

---

### Inventory Adjustments

#### 12. Create Inventory Adjustment

**Endpoint:** `POST /inventory/adjustments`

**Request Body:**
```json
{
  "productId": "prod_001",
  "quantity": -2,
  "locationId": "loc_001",
  "reason": "damaged",
  "notes": "Damaged during transport"
}
```

**Response:** `201 Created`

---

#### 13. Create Write-Off

**Endpoint:** `POST /inventory/write-offs`

**Request Body:**
```json
{
  "productId": "prod_001",
  "productName": "Premium Yoga Mat",
  "productSku": "YM-001-BLU",
  "quantity": 1,
  "unitCost": 25.00,
  "locationId": "loc_001",
  "reason": "Expired product",
  "notes": "Removed from shelf"
}
```

**Response:** `201 Created`

---

### Batch and Serial Tracking

#### 14. Get Transactions by Batch

**Endpoint:** `GET /inventory/batches/:batchNumber/transactions`

**Response:** `200 OK`

---

#### 15. Get Transactions by Serial Number

**Endpoint:** `GET /inventory/serials/:serialNumber/transactions`

**Response:** `200 OK`

---

#### 16. Get Expiring Batches

**Endpoint:** `GET /inventory/batches/expiring`

**Query Parameters:**
- `daysThreshold` (number) - Default: 30

**Response:** `200 OK`
```json
[
  {
    "batchNumber": "BATCH-2024-050",
    "productId": "prod_010",
    "productName": "Protein Powder",
    "expiryDate": "2025-12-01",
    "locationId": "loc_001",
    "daysUntilExpiry": 25
  }
]
```

---

#### 17. Get Expired Batches

**Endpoint:** `GET /inventory/batches/expired`

**Response:** `200 OK`

---

### Stock Transfers

#### 18. Transfer Stock Between Locations

**Endpoint:** `POST /inventory/transfers`

**Request Body:**
```json
{
  "productId": "prod_001",
  "fromLocationId": "loc_001",
  "toLocationId": "loc_002",
  "quantity": 10,
  "notes": "Stock rebalancing"
}
```

**Response:** `200 OK`
```json
{
  "transferOut": {},
  "transferIn": {},
  "referenceNumber": "TRF-2025-001"
}
```

---

## Point of Sale (POS)

### Base Path: `/pos`

#### 1. Process Transaction

**Endpoint:** `POST /pos/transactions`

**Request Body:**
```json
{
  "customerId": "cust_001",
  "branchId": "branch_001",
  "items": [
    {
      "productId": "prod_001",
      "quantity": 2,
      "price": 49.99,
      "discount": 5.00
    }
  ],
  "subtotal": 99.98,
  "discountTotal": 10.00,
  "taxTotal": 9.00,
  "total": 98.98,
  "payments": [
    {
      "method": "card",
      "amount": 98.98
    }
  ],
  "loyaltyPointsEarned": 99,
  "notes": "VIP customer discount applied"
}
```

**Response:** `201 Created`
```json
{
  "transactionId": "TXN-2025-001",
  "receiptNumber": "RCP-2025-001",
  "status": "completed",
  "timestamp": "2025-11-06T14:30:00.000Z"
}
```

---

#### 2. Hold Transaction

**Endpoint:** `POST /pos/transactions/:id/hold`

**Request Body:**
```json
{
  "cartData": {
    "items": [],
    "subtotal": 99.98
  }
}
```

**Response:** `200 OK`

---

#### 3. Get Held Transactions

**Endpoint:** `GET /pos/transactions/held`

**Response:** `200 OK`

---

#### 4. Retrieve Held Transaction

**Endpoint:** `GET /pos/transactions/held/:id`

**Response:** `200 OK`

---

#### 5. Process Refund

**Endpoint:** `POST /pos/transactions/:id/refund`

**Request Body:**
```json
{
  "items": [
    {
      "productId": "prod_001",
      "quantity": 1,
      "reason": "Customer return"
    }
  ]
}
```

**Response:** `200 OK`

---

#### 6. Get Transaction History

**Endpoint:** `GET /pos/transactions/history`

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `customerId` (string)
- `branchId` (string)
- `status` (string)

**Response:** `200 OK`

---

#### 7. Split Payment

**Endpoint:** `POST /pos/transactions/:id/split-payment`

**Request Body:**
```json
{
  "splits": [
    {
      "method": "card",
      "amount": 50.00
    },
    {
      "method": "cash",
      "amount": 48.98
    }
  ]
}
```

**Response:** `200 OK`

---

#### 8. Get Daily Sales

**Endpoint:** `GET /pos/sales/daily`

**Query Parameters:**
- `branchId` (string)
- `date` (date)

**Response:** `200 OK`
```json
{
  "date": "2025-11-06",
  "branchId": "branch_001",
  "totalSales": 12500,
  "transactionCount": 85,
  "averageTicketSize": 147.06,
  "paymentMethods": {
    "card": 8500,
    "cash": 3000,
    "mobile": 1000
  }
}
```

---

#### 9. Get POS Statistics

**Endpoint:** `GET /pos/stats`

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `branchId` (string)

**Response:** `200 OK`

---

## Financial Management

### Invoices

**Base Path:** `/invoices`

#### 1. Get All Invoices

**Endpoint:** `GET /invoices`

**Query Parameters:**
- `status` (string) - draft, sent, viewed, paid, partial, overdue, cancelled
- `customerId` (string)
- `startDate` (date)
- `endDate` (date)
- `search` (string)
- `minAmount` (number)
- `maxAmount` (number)

**Response:** `200 OK`
```json
[
  {
    "id": "INV001",
    "invoiceNumber": "INV-2024-001",
    "customerId": "1",
    "customerName": "Sarah Johnson",
    "customerEmail": "sarah.j@email.com",
    "customerPhone": "+1-555-0101",
    "invoiceDate": "2024-10-01",
    "dueDate": "2024-10-15",
    "status": "paid",
    "items": [
      {
        "id": "item1",
        "productId": "1",
        "productName": "Morning Yoga Class - 10 Sessions",
        "quantity": 1,
        "unitPrice": 150.00,
        "discount": 0,
        "tax": 15.00,
        "total": 165.00
      }
    ],
    "subtotal": 150.00,
    "discountAmount": 0,
    "taxAmount": 15.00,
    "total": 165.00,
    "amountPaid": 165.00,
    "amountDue": 0,
    "currency": "USD",
    "notes": "Thank you!",
    "terms": "Payment due within 14 days",
    "createdBy": "admin",
    "createdAt": "2024-10-01",
    "paidAt": "2024-10-02",
    "paymentMethod": "card"
  }
]
```

---

#### 2. Get Invoice by ID

**Endpoint:** `GET /invoices/:id`

**Response:** `200 OK`

---

#### 3. Create Invoice

**Endpoint:** `POST /invoices`

**Request Body:**
```json
{
  "customerId": "1",
  "customerName": "John Doe",
  "customerEmail": "john@email.com",
  "invoiceDate": "2025-11-06",
  "dueDate": "2025-11-20",
  "items": [
    {
      "productId": "1",
      "productName": "Yoga Mat",
      "quantity": 2,
      "unitPrice": 49.99,
      "discount": 5.00,
      "tax": 9.00
    }
  ],
  "subtotal": 99.98,
  "discountAmount": 10.00,
  "taxAmount": 18.00,
  "total": 107.98,
  "notes": "",
  "terms": "Payment due within 14 days"
}
```

**Response:** `201 Created`

---

#### 4. Update Invoice

**Endpoint:** `PUT /invoices/:id`

**Response:** `200 OK`

---

#### 5. Delete Invoice

**Endpoint:** `DELETE /invoices/:id`

**Response:** `204 No Content`

---

#### 6. Mark Invoice as Paid

**Endpoint:** `POST /invoices/:id/mark-paid`

**Request Body:**
```json
{
  "paymentMethod": "card",
  "transactionId": "TXN123"
}
```

**Response:** `200 OK`

---

#### 7. Record Partial Payment

**Endpoint:** `POST /invoices/:id/partial-payment`

**Request Body:**
```json
{
  "amount": 50.00,
  "paymentMethod": "cash"
}
```

**Response:** `200 OK`

---

#### 8. Send Invoice to Customer

**Endpoint:** `POST /invoices/:id/send`

**Response:** `200 OK`

---

#### 9. Get Invoice Statistics

**Endpoint:** `GET /invoices/stats`

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)

**Response:** `200 OK`
```json
{
  "totalInvoices": 150,
  "totalAmount": 45000,
  "totalPaid": 38000,
  "totalDue": 7000,
  "overdueAmount": 2500,
  "overdueCount": 8,
  "draftCount": 5,
  "paidCount": 130,
  "partialCount": 7,
  "averageInvoiceValue": 300,
  "collectionRate": 84.4
}
```

---

#### 10. Get Overdue Invoices

**Endpoint:** `GET /invoices/overdue`

**Response:** `200 OK`

---

#### 11. Generate Invoice PDF

**Endpoint:** `POST /invoices/:id/pdf`

**Response:** `200 OK`
```json
{
  "url": "https://example.com/invoices/INV-2024-001.pdf"
}
```

---

#### 12. Email Invoice

**Endpoint:** `POST /invoices/:id/email`

**Response:** `200 OK`

---

### Payments

**Base Path:** `/payments`

#### 1. Get All Payments

**Endpoint:** `GET /payments`

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `customerId` (string)
- `invoiceId` (string)
- `paymentMethod` (string)
- `status` (string)

**Response:** `200 OK`
```json
[
  {
    "id": "pay_001",
    "paymentNumber": "PAY-2024-001",
    "invoiceId": "INV001",
    "customerId": "1",
    "customerName": "Sarah Johnson",
    "amount": 165.00,
    "paymentMethod": "card",
    "paymentDate": "2024-10-02",
    "status": "completed",
    "transactionId": "TXN001",
    "referenceNumber": "REF123",
    "notes": "",
    "currency": "USD",
    "receivedBy": "admin",
    "createdAt": "2024-10-02"
  }
]
```

---

#### 2. Get Payment by ID

**Endpoint:** `GET /payments/:id`

**Response:** `200 OK`

---

#### 3. Create Payment

**Endpoint:** `POST /payments`

**Request Body:**
```json
{
  "invoiceId": "INV001",
  "customerId": "1",
  "amount": 165.00,
  "paymentMethod": "card",
  "paymentDate": "2025-11-06",
  "transactionId": "TXN123",
  "notes": "Payment received"
}
```

**Response:** `201 Created`

---

#### 4. Update Payment

**Endpoint:** `PUT /payments/:id`

**Response:** `200 OK`

---

#### 5. Delete Payment

**Endpoint:** `DELETE /payments/:id`

**Response:** `204 No Content`

---

#### 6. Get Payments by Invoice

**Endpoint:** `GET /payments/invoice/:invoiceId`

**Response:** `200 OK`

---

#### 7. Get Payment Statistics

**Endpoint:** `GET /payments/stats`

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)

**Response:** `200 OK`

---

### Expenses

**Base Path:** `/expenses`

#### 1. Get All Expenses

**Endpoint:** `GET /expenses`

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `category` (string)
- `minAmount` (number)
- `maxAmount` (number)

**Response:** `200 OK`
```json
[
  {
    "id": "exp_001",
    "description": "Office rent",
    "amount": 2500.00,
    "category": "rent",
    "date": "2025-11-01",
    "reference": "RENT-NOV-2025",
    "notes": "Monthly rent payment",
    "createdBy": "admin",
    "createdAt": "2025-11-01"
  }
]
```

---

#### 2. Get Expense by ID

**Endpoint:** `GET /expenses/:id`

**Response:** `200 OK`

---

#### 3. Create Expense

**Endpoint:** `POST /expenses`

**Request Body:**
```json
{
  "description": "Equipment purchase",
  "amount": 500.00,
  "category": "equipment",
  "date": "2025-11-06",
  "reference": "PO-500",
  "notes": "New yoga mats"
}
```

**Response:** `201 Created`

---

#### 4. Update Expense

**Endpoint:** `PUT /expenses/:id`

**Response:** `200 OK`

---

#### 5. Delete Expense

**Endpoint:** `DELETE /expenses/:id`

**Response:** `204 No Content`

---

#### 6. Get Expense Statistics

**Endpoint:** `GET /expenses/stats`

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)

**Response:** `200 OK`
```json
{
  "totalExpenses": 15000,
  "expenseCount": 45,
  "averageExpense": 333.33,
  "byCategory": {
    "rent": 2500,
    "utilities": 500,
    "salaries": 10000
  }
}
```

---

#### 7. Get Category Statistics

**Endpoint:** `GET /expenses/stats/categories`

**Response:** `200 OK`

---

## Purchase & Supplier Management

### Suppliers

**Base Path:** `/suppliers`

#### 1. Get All Suppliers

**Endpoint:** `GET /suppliers`

**Query Parameters:**
- `search` (string)
- `status` (string)
- `type` (string)

**Response:** `200 OK`
```json
[
  {
    "id": "sup_001",
    "name": "Yoga Supplies Co.",
    "code": "YSC",
    "type": "manufacturer",
    "status": "active",
    "email": "contact@yogasupplies.com",
    "phone": "+1-555-9000",
    "address": {
      "street": "100 Supply Lane",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90001",
      "country": "USA"
    },
    "contactPerson": "John Smith",
    "paymentTerms": "Net 30",
    "stats": {
      "totalOrders": 45,
      "totalSpent": 125000,
      "lastOrderDate": "2025-10-15"
    },
    "createdAt": "2024-01-01",
    "updatedAt": "2025-10-15"
  }
]
```

---

#### 2. Get Supplier by ID

**Endpoint:** `GET /suppliers/:id`

**Response:** `200 OK`

---

#### 3. Create Supplier

**Endpoint:** `POST /suppliers`

**Request Body:**
```json
{
  "name": "New Supplier Inc.",
  "code": "NSI",
  "type": "distributor",
  "email": "info@newsupplier.com",
  "phone": "+1-555-8000",
  "address": {
    "street": "200 Commerce St",
    "city": "San Diego",
    "state": "CA",
    "zipCode": "92101",
    "country": "USA"
  },
  "contactPerson": "Jane Doe",
  "paymentTerms": "Net 15"
}
```

**Response:** `201 Created`

---

#### 4. Update Supplier

**Endpoint:** `PUT /suppliers/:id`

**Response:** `200 OK`

---

#### 5. Delete Supplier

**Endpoint:** `DELETE /suppliers/:id`

**Response:** `204 No Content`

---

#### 6. Update Payment Terms

**Endpoint:** `PUT /suppliers/:id/payment-terms`

**Request Body:**
```json
{
  "paymentTerms": "Net 45"
}
```

**Response:** `200 OK`

---

#### 7. Get Supplier Statistics

**Endpoint:** `GET /suppliers/stats`

**Response:** `200 OK`

---

### Purchase Orders

**Base Path:** `/purchase-orders`

#### 1. Get All Purchase Orders

**Endpoint:** `GET /purchase-orders`

**Query Parameters:**
- `supplierId` (string)
- `status` (string) - draft, submitted, approved, received, cancelled
- `startDate` (date)
- `endDate` (date)

**Response:** `200 OK`
```json
[
  {
    "id": "po_001",
    "poNumber": "PO-2025-001",
    "supplierId": "sup_001",
    "supplierName": "Yoga Supplies Co.",
    "items": [
      {
        "productId": "prod_001",
        "productName": "Yoga Mat",
        "quantity": 50,
        "unitPrice": 25.00,
        "total": 1250.00
      }
    ],
    "subtotal": 1250.00,
    "tax": 125.00,
    "total": 1375.00,
    "status": "approved",
    "expectedDelivery": "2025-11-15",
    "actualDelivery": null,
    "createdAt": "2025-11-01",
    "updatedAt": "2025-11-02"
  }
]
```

---

#### 2. Get Purchase Order by ID

**Endpoint:** `GET /purchase-orders/:id`

**Response:** `200 OK`

---

#### 3. Create Purchase Order

**Endpoint:** `POST /purchase-orders`

**Request Body:**
```json
{
  "supplierId": "sup_001",
  "items": [
    {
      "productId": "prod_001",
      "quantity": 50,
      "unitPrice": 25.00
    }
  ],
  "expectedDelivery": "2025-11-15"
}
```

**Response:** `201 Created`

---

#### 4. Update Purchase Order

**Endpoint:** `PUT /purchase-orders/:id`

**Response:** `200 OK`

---

#### 5. Delete Purchase Order

**Endpoint:** `DELETE /purchase-orders/:id`

**Response:** `204 No Content`

---

#### 6. Submit Purchase Order

**Endpoint:** `POST /purchase-orders/:id/submit`

**Response:** `200 OK`

---

#### 7. Approve Purchase Order

**Endpoint:** `POST /purchase-orders/:id/approve`

**Response:** `200 OK`

---

#### 8. Receive Purchase Order

**Endpoint:** `POST /purchase-orders/:id/receive`

**Request Body:**
```json
{
  "items": [
    {
      "productId": "prod_001",
      "quantityReceived": 50
    }
  ],
  "actualDelivery": "2025-11-10"
}
```

**Response:** `200 OK`

---

#### 9. Get Purchase Order Statistics

**Endpoint:** `GET /purchase-orders/stats`

**Response:** `200 OK`

---

## Reports & Analytics

### Reports

**Base Path:** `/reports`

#### 1. Get All Reports

**Endpoint:** `GET /reports`

**Query Parameters:**
- `type` (string)
- `status` (string)
- `startDate` (date)
- `endDate` (date)

**Response:** `200 OK`
```json
[
  {
    "id": "rep_001",
    "title": "Monthly Sales Report",
    "type": "sales",
    "description": "October 2025 sales summary",
    "status": "completed",
    "filters": {
      "startDate": "2025-10-01",
      "endDate": "2025-10-31"
    },
    "data": {},
    "metadata": {
      "generatedBy": "admin",
      "format": "pdf"
    },
    "createdAt": "2025-11-01",
    "updatedAt": "2025-11-01"
  }
]
```

---

#### 2. Generate Report

**Endpoint:** `POST /reports/generate`

**Request Body:**
```json
{
  "type": "sales",
  "filters": {
    "startDate": "2025-10-01",
    "endDate": "2025-10-31",
    "branchId": "branch_001"
  },
  "format": "pdf"
}
```

**Response:** `200 OK`

---

#### 3. Get Report by ID

**Endpoint:** `GET /reports/:id`

**Response:** `200 OK`

---

#### 4. Delete Report

**Endpoint:** `DELETE /reports/:id`

**Response:** `204 No Content`

---

#### 5. Schedule Report

**Endpoint:** `POST /reports/schedule`

**Request Body:**
```json
{
  "type": "sales",
  "frequency": "weekly",
  "filters": {},
  "recipients": ["admin@yoga.com"]
}
```

**Response:** `201 Created`

---

#### 6. Get Report Templates

**Endpoint:** `GET /reports/templates`

**Response:** `200 OK`

---

### Analytics

**Base Path:** `/analytics`

#### 1. Generate Sales Report

**Endpoint:** `POST /analytics/sales`

**Request Body:**
```json
{
  "startDate": "2025-10-01",
  "endDate": "2025-10-31",
  "branchId": "branch_001",
  "groupBy": "day"
}
```

**Response:** `200 OK`

---

#### 2. Generate Inventory Valuation Report

**Endpoint:** `POST /analytics/inventory-valuation`

**Request Body:**
```json
{
  "date": "2025-11-06",
  "locationId": "loc_001"
}
```

**Response:** `200 OK`

---

#### 3. Generate Profit & Loss Report

**Endpoint:** `POST /analytics/profit-loss`

**Request Body:**
```json
{
  "startDate": "2025-10-01",
  "endDate": "2025-10-31"
}
```

**Response:** `200 OK`

---

#### 4. Generate Slow Moving Stock Report

**Endpoint:** `POST /analytics/slow-moving-stock`

**Request Body:**
```json
{
  "daysThreshold": 90,
  "minQuantity": 5
}
```

**Response:** `200 OK`

---

#### 5. Generate Employee Performance Report

**Endpoint:** `POST /analytics/employee-performance`

**Request Body:**
```json
{
  "startDate": "2025-10-01",
  "endDate": "2025-10-31",
  "branchId": "branch_001"
}
```

**Response:** `200 OK`

---

#### 6. Generate Payment Method Report

**Endpoint:** `POST /analytics/payment-methods`

**Request Body:**
```json
{
  "startDate": "2025-10-01",
  "endDate": "2025-10-31"
}
```

**Response:** `200 OK`

---

#### 7. Generate Customer Analytics Report

**Endpoint:** `POST /analytics/customers`

**Request Body:**
```json
{
  "startDate": "2025-10-01",
  "endDate": "2025-10-31",
  "segmentId": "seg_vip"
}
```

**Response:** `200 OK`

---

#### 8. Generate Tax Report

**Endpoint:** `POST /analytics/tax`

**Request Body:**
```json
{
  "startDate": "2025-10-01",
  "endDate": "2025-10-31"
}
```

**Response:** `200 OK`

---

### Export

**Base Path:** `/export`

#### 1. Export as CSV

**Endpoint:** `POST /export/csv`

**Request Body:**
```json
{
  "report": {
    "type": "sales",
    "data": []
  }
}
```

**Response:** `200 OK`

---

#### 2. Export as Excel

**Endpoint:** `POST /export/excel`

**Response:** `200 OK`

---

#### 3. Export as PDF

**Endpoint:** `POST /export/pdf`

**Response:** `200 OK`

---

## Notification System

### Base Path: `/notifications`

#### 1. Send Notification

**Endpoint:** `POST /notifications/send`

**Request Body:**
```json
{
  "userId": "user_001",
  "type": "email",
  "subject": "Low Stock Alert",
  "message": "Product XYZ is low on stock",
  "priority": "high",
  "metadata": {}
}
```

**Response:** `200 OK`

---

#### 2. Get Notification History

**Endpoint:** `GET /notifications/history`

**Query Parameters:**
- `userId` (string)
- `type` (string) - email, sms, push, whatsapp
- `status` (string) - sent, failed, pending
- `startDate` (date)
- `endDate` (date)

**Response:** `200 OK`
```json
[
  {
    "id": "notif_001",
    "userId": "user_001",
    "type": "email",
    "subject": "Low Stock Alert",
    "message": "Product XYZ is low on stock",
    "status": "sent",
    "sentAt": "2025-11-06T10:00:00.000Z",
    "metadata": {}
  }
]
```

---

#### 3. Update User Notification Preferences

**Endpoint:** `PUT /notifications/preferences/:userId`

**Request Body:**
```json
{
  "emailNotifications": true,
  "smsNotifications": false,
  "pushNotifications": true,
  "lowStockAlerts": true,
  "orderUpdates": true
}
```

**Response:** `200 OK`

---

#### 4. Send Bulk Notifications

**Endpoint:** `POST /notifications/bulk`

**Request Body:**
```json
{
  "notifications": [
    {
      "userId": "user_001",
      "type": "email",
      "subject": "Promotion",
      "message": "Special offer!"
    }
  ]
}
```

**Response:** `200 OK`

---

## Backup & Cloud Integration

### Base Path: `/backup`

#### 1. Create Manual Backup

**Endpoint:** `POST /backup/create`

**Request Body:**
```json
{
  "type": "full",
  "description": "Manual backup before update"
}
```

**Response:** `200 OK`
```json
{
  "backupId": "backup_001",
  "status": "completed",
  "size": "125MB",
  "createdAt": "2025-11-06T10:00:00.000Z"
}
```

---

#### 2. Get Backup History

**Endpoint:** `GET /backup/history`

**Response:** `200 OK`
```json
[
  {
    "id": "backup_001",
    "type": "full",
    "status": "completed",
    "size": "125MB",
    "description": "Manual backup",
    "createdAt": "2025-11-06T10:00:00.000Z"
  }
]
```

---

#### 3. Restore from Backup

**Endpoint:** `POST /backup/:backupId/restore`

**Response:** `200 OK`

---

#### 4. Upload Backup to Cloud

**Endpoint:** `POST /backup/:backupId/upload`

**Request Body:**
```json
{
  "provider": "google_drive"
}
```

**Response:** `200 OK`

---

#### 5. Get Backup Status

**Endpoint:** `GET /backup/status`

**Response:** `200 OK`
```json
{
  "lastBackup": "2025-11-06T10:00:00.000Z",
  "nextScheduledBackup": "2025-11-07T02:00:00.000Z",
  "totalBackups": 25,
  "totalSize": "3.2GB"
}
```

---

#### 6. Schedule Automatic Backup

**Endpoint:** `POST /backup/schedule`

**Request Body:**
```json
{
  "frequency": "daily",
  "time": "02:00",
  "type": "full",
  "cloudProvider": "google_drive",
  "retentionDays": 30
}
```

**Response:** `200 OK`

---

## Settings

### Base Path: `/settings`

#### 1. Get All Settings

**Endpoint:** `GET /settings`

**Response:** `200 OK`
```json
{
  "general": {
    "businessName": "Yoga Studio POS",
    "timezone": "America/Los_Angeles",
    "currency": "USD",
    "language": "en"
  },
  "branding": {
    "logo": "/path/to/logo.png",
    "primaryColor": "#6366f1",
    "secondaryColor": "#8b5cf6"
  },
  "hardware": {
    "printer": {
      "enabled": true,
      "type": "thermal",
      "connection": "usb"
    },
    "scanner": {
      "enabled": true,
      "type": "barcode"
    }
  },
  "notifications": {
    "lowStockAlerts": true,
    "orderNotifications": true
  },
  "backup": {
    "autoBackup": true,
    "frequency": "daily",
    "cloudProvider": "google_drive"
  }
}
```

---

#### 2. Update Settings

**Endpoint:** `PUT /settings`

**Request Body:**
```json
{
  "general": {
    "businessName": "Updated Name"
  }
}
```

**Response:** `200 OK`

---

#### 3. Get Setting by Key

**Endpoint:** `GET /settings/:key`

**Response:** `200 OK`

---

#### 4. Update Setting by Key

**Endpoint:** `PUT /settings/:key`

**Request Body:**
```json
{
  "value": "new_value"
}
```

**Response:** `200 OK`

---

## Common Data Types

### User Roles
```typescript
enum UserRoles {
  ADMIN = "admin",
  MANAGER = "manager",
  STAFF = "staff",
  INSTRUCTOR = "instructor"
}
```

### Customer Types
```typescript
enum CustomerTypes {
  VIP = "vip",
  REGULAR = "regular",
  CORPORATE = "corporate"
}
```

### Loyalty Tiers
```typescript
enum LoyaltyTiers {
  BRONZE = "bronze",
  SILVER = "silver",
  GOLD = "gold",
  PLATINUM = "platinum"
}
```

### Product Status
```typescript
enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DISCONTINUED = "discontinued"
}
```

### Transaction Types
```typescript
enum TransactionTypes {
  PURCHASE = "purchase",
  SALE = "sale",
  ADJUSTMENT = "adjustment",
  RETURN = "return",
  DAMAGE = "damage",
  WRITE_OFF = "write_off",
  TRANSFER_IN = "transfer_in",
  TRANSFER_OUT = "transfer_out"
}
```

### Payment Methods
```typescript
enum PaymentMethods {
  CARD = "card",
  CASH = "cash",
  MOBILE_PAYMENT = "mobile_payment",
  BANK_TRANSFER = "bank_transfer",
  CHECK = "check",
  GIFT_CARD = "gift_card"
}
```

### Invoice Status
```typescript
enum InvoiceStatus {
  DRAFT = "draft",
  SENT = "sent",
  VIEWED = "viewed",
  PAID = "paid",
  PARTIAL = "partial",
  OVERDUE = "overdue",
  CANCELLED = "cancelled"
}
```

### Report Types
```typescript
enum ReportTypes {
  SALES = "sales",
  REVENUE = "revenue",
  PROFIT_LOSS = "profit_loss",
  INVENTORY_VALUATION = "inventory_valuation",
  SLOW_MOVING = "slow_moving",
  EMPLOYEE_PERFORMANCE = "employee_performance",
  PAYMENT_METHOD = "payment_method",
  CUSTOMER_ANALYTICS = "customer_analytics",
  TAX_REPORT = "tax_report"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid input data",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "details": [
    {
      "field": "price",
      "message": "Price must be greater than 0"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Authentication

All API requests (except login endpoints) require authentication using JWT tokens:

**Header:**
```
Authorization: Bearer {your_jwt_token}
```

**Token Expiration:**
- Access Token: 24 hours
- Refresh Token: 30 days

**Token Refresh:**
Use the `/auth/refresh` endpoint to obtain a new access token before it expires.

---

## Pagination

List endpoints support pagination using query parameters:

**Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20, max: 100)

**Response Headers:**
```
X-Total-Count: 150
X-Page: 1
X-Per-Page: 20
X-Total-Pages: 8
```

---

## Rate Limiting

API requests are rate-limited:

- **Authenticated requests:** 1000 requests per hour
- **Unauthenticated requests:** 100 requests per hour

**Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1699286400
```

---

## Webhook Support

The system supports webhooks for real-time event notifications:

**Supported Events:**
- `order.created`
- `order.completed`
- `inventory.low_stock`
- `customer.created`
- `invoice.paid`
- `product.out_of_stock`

**Webhook Endpoint Configuration:**
```
POST /webhooks/configure
{
  "url": "https://your-domain.com/webhook",
  "events": ["order.created", "invoice.paid"],
  "secret": "your_webhook_secret"
}
```

---

## API Versioning

The API uses URL versioning:

- Current version: `v1`
- Base URL: `https://api.yourdomain.com/api/v1`

When a new version is released, the previous version will be supported for at least 12 months.

---

## Support & Contact

For API support and questions:
- **Documentation:** https://docs.yourdomain.com
- **Email:** api-support@yourdomain.com
- **Status Page:** https://status.yourdomain.com

---

**End of API Documentation**
