# Yoga POS Backend - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [API Endpoints](#api-endpoints)
   - [Health & Status](#health--status)
   - [Authentication](#authentication-endpoints)
   - [Users](#users)
   - [Branches](#branches)
   - [Customers](#customers)
   - [Products](#products)
   - [Categories](#categories)
   - [Expenses](#expenses)
   - [Payments](#payments)
   - [Permissions](#permissions)
   - [Analytics](#analytics)
   - [Backup](#backup)
   - [Export](#export)
   - [Inventory](#inventory)
   - [Invoices](#invoices)
   - [Notifications](#notifications)
   - [POS (Point of Sale)](#pos-point-of-sale)
   - [Purchase Orders](#purchase-orders)
   - [Reports](#reports)
   - [Roles](#roles)
   - [Settings](#settings)
   - [Suppliers](#suppliers)
5. [Error Handling](#error-handling)

---

## Overview

This document provides comprehensive documentation for the Yoga POS Backend API. The API is built with NestJS and follows RESTful conventions.

**Base URL:** `http://localhost:3000` (development)

**API Version:** 1.0

---

## Authentication

The API uses JWT (JSON Web Token) authentication. Most endpoints require authentication via Bearer token.

### Authentication Flow

1. **Register** or **Login** to obtain access and refresh tokens
2. Include the access token in the Authorization header: `Authorization: Bearer <token>`
3. Use the refresh token endpoint to obtain new access tokens when they expire

### Authentication Methods

- **Email/Password:** Standard authentication using email and password
- **PIN Login:** Quick login using a 4-6 digit PIN (must be set up first)

### Role-Based Access Control

The API implements role-based access control with the following roles:
- **admin:** Full system access
- **manager:** Management-level access to most resources
- **cashier:** Limited access to POS and sales operations
- **staff:** Basic access to inventory and operational tasks

---

## Common Patterns

### Pagination

Many list endpoints support pagination using query parameters:

```
GET /resource?page=1&limit=10
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)

**Response:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Filtering

List endpoints typically support filtering via query parameters:

- `search`: Text search across relevant fields
- `status`: Filter by status
- `startDate`: Start date for date range filters
- `endDate`: End date for date range filters
- `branchId`: Filter by branch

### Date Ranges

Date parameters should be in ISO 8601 format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`

### Bulk Operations

Some resources support bulk operations for updating multiple records at once. These endpoints typically use a POST method with an array of items.

---

## API Endpoints

### Health & Status

#### Get API Status
```
GET /
```

Returns basic API status information.

**Authentication:** None (Public)

**Response:**
```json
{
  "status": "ok",
  "message": "Yoga POS API is running"
}
```

#### Health Check
```
GET /health
```

Health check endpoint for monitoring.

**Authentication:** None (Public)

---

### Authentication Endpoints

Base Path: `/auth`

#### Register New User
```
POST /auth/register
```

Register a new user account.

**Authentication:** None (Public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "staff"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### Login
```
POST /auth/login
```

Login with email and password.

**Authentication:** None (Public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### Login with PIN
```
POST /auth/login/pin
```

Quick login using PIN.

**Authentication:** None (Public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "pin": "1234"
}
```

#### Refresh Token
```
POST /auth/refresh
```

Obtain a new access token using refresh token.

**Authentication:** None (Public)

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

#### Logout
```
POST /auth/logout
```

Logout current user.

**Authentication:** JWT Required

#### Get Current User
```
GET /auth/me
```

Get current authenticated user information.

**Authentication:** JWT Required

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "staff",
  "branchId": "branch-uuid"
}
```

#### Set PIN
```
POST /auth/pin/set
```

Set or update PIN for quick login.

**Authentication:** JWT Required

**Request Body:**
```json
{
  "newPIN": "1234"
}
```

#### Disable PIN
```
POST /auth/pin/disable
```

Disable PIN login for current user.

**Authentication:** JWT Required

#### Reset PIN Attempts
```
POST /auth/pin/reset-attempts
```

Reset PIN lockout for a user (admin only).

**Authentication:** JWT Required (Admin only)

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

---

### Users

Base Path: `/users`

All endpoints require JWT authentication and role-based access.

#### Create User
```
POST /users
```

Create a new user.

**Roles:** admin, manager

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "cashier",
  "branchId": "branch-uuid"
}
```

#### List Users
```
GET /users?page=1&limit=10&search=john
```

Get paginated list of users.

**Roles:** admin, manager

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search by name or email
- `role`: Filter by role
- `branchId`: Filter by branch

#### Get User Statistics
```
GET /users/stats
```

Get user statistics.

**Roles:** admin

**Response:**
```json
{
  "total": 50,
  "byRole": {
    "admin": 2,
    "manager": 5,
    "cashier": 20,
    "staff": 23
  },
  "activeUsers": 45
}
```

#### Get User by ID
```
GET /users/:id
```

Get user details by ID.

**Roles:** Any authenticated user

#### Update User
```
PATCH /users/:id
```

Update user information.

**Roles:** admin, manager

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "role": "manager",
  "branchId": "branch-uuid"
}
```

#### Delete User
```
DELETE /users/:id
```

Delete a user.

**Roles:** admin

#### Bulk Update User Roles
```
POST /users/bulk/roles
```

Update roles for multiple users at once.

**Roles:** admin, manager

**Request Body:**
```json
{
  "userIds": ["uuid1", "uuid2"],
  "role": "cashier"
}
```

---

### Branches

Base Path: `/branches`

#### Create Branch
```
POST /branches
```

Create a new branch.

**Roles:** admin

**Request Body:**
```json
{
  "name": "Downtown Branch",
  "code": "DT001",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "phone": "+1234567890",
  "email": "downtown@example.com"
}
```

#### List Branches
```
GET /branches?status=active&search=downtown
```

Get all branches with filtering.

**Roles:** Any authenticated user

**Query Parameters:**
- `status`: Filter by status (active, inactive)
- `search`: Search by name or code
- `city`: Filter by city
- `state`: Filter by state

#### Get Branch Statistics
```
GET /branches/stats
```

Get overall statistics for all branches.

**Roles:** admin, manager

**Response:**
```json
{
  "totalBranches": 10,
  "activeBranches": 8,
  "totalSales": 150000,
  "totalRevenue": 500000
}
```

#### Get Branch by Code
```
GET /branches/code/:code
```

Get branch by unique code.

**Roles:** Any authenticated user

#### Get Branch by ID
```
GET /branches/:id
```

Get branch details by ID.

**Roles:** Any authenticated user

#### Get Branch Settings
```
GET /branches/:id/settings
```

Get settings for a specific branch.

**Roles:** admin, manager

#### Get Branch Operating Hours
```
GET /branches/:id/operating-hours
```

Get operating hours for a branch.

**Roles:** Any authenticated user

#### Get Branch Performance Statistics
```
GET /branches/:id/stats
```

Get detailed performance statistics for a branch.

**Roles:** admin, manager

**Response:**
```json
{
  "branchId": "uuid",
  "period": "2024-01",
  "totalSales": 50000,
  "totalRevenue": 150000,
  "transactionCount": 500,
  "averageTransactionValue": 300,
  "topProducts": [...]
}
```

#### Update Branch
```
PATCH /branches/:id
```

Update branch information.

**Roles:** admin

#### Update Branch Settings
```
PATCH /branches/:id/settings
```

Update branch-specific settings.

**Roles:** admin, manager

**Request Body:**
```json
{
  "taxRate": 8.5,
  "currency": "USD",
  "receiptFooter": "Thank you for your visit!",
  "allowNegativeStock": false
}
```

#### Update Operating Hours
```
PATCH /branches/:id/operating-hours
```

Update branch operating hours.

**Roles:** admin, manager

**Request Body:**
```json
{
  "monday": { "open": "09:00", "close": "18:00" },
  "tuesday": { "open": "09:00", "close": "18:00" },
  "wednesday": { "open": "09:00", "close": "18:00" },
  "thursday": { "open": "09:00", "close": "18:00" },
  "friday": { "open": "09:00", "close": "20:00" },
  "saturday": { "open": "10:00", "close": "20:00" },
  "sunday": { "closed": true }
}
```

#### Delete Branch
```
DELETE /branches/:id
```

Delete a branch.

**Roles:** admin

#### Assign Manager to Branch
```
POST /branches/:id/manager
```

Assign a manager to a branch.

**Roles:** admin

**Request Body:**
```json
{
  "managerId": "user-uuid"
}
```

#### Bulk Update Branch Status
```
POST /branches/bulk/status
```

Update status for multiple branches.

**Roles:** admin

**Request Body:**
```json
{
  "branchIds": ["uuid1", "uuid2"],
  "status": "active"
}
```

#### Get Performance Comparison
```
GET /branches/performance
```

Get consolidated performance for all branches.

**Roles:** admin, manager

#### Compare Branches
```
POST /branches/compare
```

Compare performance metrics across multiple branches.

**Roles:** admin, manager

**Request Body:**
```json
{
  "branchIds": ["uuid1", "uuid2", "uuid3"],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "metrics": ["sales", "revenue", "transactions"]
}
```

#### Clone Branch Settings
```
POST /branches/settings/clone
```

Clone settings from one branch to another.

**Roles:** admin

**Request Body:**
```json
{
  "sourceBranchId": "uuid1",
  "targetBranchIds": ["uuid2", "uuid3"]
}
```

---

### Customers

Base Path: `/customers`

#### Create Customer
```
POST /customers
```

Create a new customer.

**Roles:** admin, manager

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Customer",
  "email": "john@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001"
}
```

#### List Customers
```
GET /customers?page=1&limit=10&search=john&status=active
```

Get paginated list of customers with filtering.

**Roles:** Any authenticated user

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search by name, email, or phone
- `status`: Filter by status
- `loyaltyTier`: Filter by loyalty tier
- `branchId`: Filter by branch

#### Get Customer Statistics
```
GET /customers/stats
```

Get overall customer statistics.

**Roles:** admin, manager

**Response:**
```json
{
  "totalCustomers": 1000,
  "activeCustomers": 850,
  "newCustomersThisMonth": 50,
  "averagePurchaseValue": 75.50,
  "totalLoyaltyPoints": 50000
}
```

#### Get Customer by Email
```
GET /customers/email/:email
```

Get customer by email address.

**Roles:** Any authenticated user

#### Get Customer by ID
```
GET /customers/:id
```

Get customer details by ID.

**Roles:** Any authenticated user

#### Get Customer Loyalty Information
```
GET /customers/:id/loyalty
```

Get loyalty points and tier information.

**Roles:** Any authenticated user

**Response:**
```json
{
  "customerId": "uuid",
  "points": 1500,
  "tier": "gold",
  "tierBenefits": [...],
  "pointsToNextTier": 500
}
```

#### Get Customer Purchase History
```
GET /customers/:id/purchase-history?page=1&limit=10
```

Get customer's purchase history.

**Roles:** Any authenticated user

#### Get Customer Statistics
```
GET /customers/:id/stats
```

Get statistics for a specific customer.

**Roles:** Any authenticated user

**Response:**
```json
{
  "totalPurchases": 25,
  "totalSpent": 2500.00,
  "averageOrderValue": 100.00,
  "lastPurchaseDate": "2024-01-15",
  "favoriteProducts": [...]
}
```

#### Update Customer
```
PATCH /customers/:id
```

Update customer information.

**Roles:** admin, manager

#### Update Loyalty Points
```
PATCH /customers/:id/loyalty/points
```

Update customer loyalty points.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "points": 100,
  "operation": "add",
  "reason": "Purchase reward"
}
```

#### Update Loyalty Tier
```
PATCH /customers/:id/loyalty/tier
```

Update customer loyalty tier.

**Roles:** admin, manager

**Request Body:**
```json
{
  "tier": "gold"
}
```

#### Delete Customer
```
DELETE /customers/:id
```

Delete a customer.

**Roles:** admin

#### Update Purchase Statistics
```
POST /customers/:id/stats/purchase
```

Update customer purchase statistics.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "amount": 150.00,
  "transactionDate": "2024-01-15"
}
```

#### Bulk Update Customer Status
```
POST /customers/bulk/status
```

Update status for multiple customers.

**Roles:** admin, manager

**Request Body:**
```json
{
  "customerIds": ["uuid1", "uuid2"],
  "status": "active"
}
```

#### Get Detailed Purchase Statistics
```
GET /customers/:customerId/purchases/stats
```

Get detailed purchase statistics for a customer.

**Roles:** admin, manager

---

### Customer Segments

#### List Customer Segments
```
GET /customers/segments
```

Get all customer segments.

**Roles:** admin, manager

#### Get Segment Details
```
GET /customers/segments/:id
```

Get details of a specific segment.

**Roles:** admin, manager

#### Create Customer Segment
```
POST /customers/segments
```

Create a new customer segment.

**Roles:** admin, manager

**Request Body:**
```json
{
  "name": "VIP Customers",
  "description": "High-value customers",
  "criteria": {
    "minPurchaseAmount": 1000,
    "minPurchaseCount": 10
  }
}
```

#### Update Customer Segment
```
PUT /customers/segments/:id
```

Update a customer segment.

**Roles:** admin, manager

#### Delete Customer Segment
```
DELETE /customers/segments/:id
```

Delete a customer segment.

**Roles:** admin

#### Assign Customers to Segment
```
POST /customers/segments/:id/assign
```

Assign customers to a segment.

**Roles:** admin, manager

**Request Body:**
```json
{
  "customerIds": ["uuid1", "uuid2", "uuid3"]
}
```

#### Remove Customers from Segment
```
POST /customers/segments/:id/remove
```

Remove customers from a segment.

**Roles:** admin, manager

---

### Customer Notes

#### Get Customer Notes
```
GET /customers/:customerId/notes
```

Get all notes for a customer.

**Roles:** Any authenticated user

#### Create Customer Note
```
POST /customers/:customerId/notes
```

Create a note for a customer.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "note": "Customer prefers delivery on weekends",
  "category": "preference"
}
```

#### Update Customer Note
```
PUT /customers/notes/:noteId
```

Update a customer note.

**Roles:** admin, manager, cashier

#### Delete Customer Note
```
DELETE /customers/notes/:noteId
```

Delete a customer note.

**Roles:** admin, manager

---

### Customer Credit Management

#### Get Credit Transactions
```
GET /customers/:customerId/credit/transactions
```

Get all credit transactions for a customer.

**Roles:** admin, manager

#### Charge Credit
```
POST /customers/:customerId/credit/charge
```

Charge an amount to customer's credit account.

**Roles:** admin, manager

**Request Body:**
```json
{
  "amount": 100.00,
  "description": "Invoice #1234"
}
```

#### Record Credit Payment
```
POST /customers/:customerId/credit/payment
```

Record a payment against customer's credit.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "amount": 50.00,
  "paymentMethod": "cash",
  "reference": "PMT-001"
}
```

#### Update Credit Limit
```
PUT /customers/:customerId/credit/limit
```

Update customer's credit limit.

**Roles:** admin, manager

**Request Body:**
```json
{
  "creditLimit": 5000.00
}
```

---

### Customer Store Credit

#### Get Store Credit Transactions
```
GET /customers/:customerId/store-credit/transactions
```

Get all store credit transactions for a customer.

**Roles:** admin, manager

#### Add Store Credit
```
POST /customers/:customerId/store-credit/add
```

Add store credit to a customer's account.

**Roles:** admin, manager

**Request Body:**
```json
{
  "amount": 25.00,
  "reason": "Refund for returned item",
  "expiryDate": "2024-12-31"
}
```

#### Deduct Store Credit
```
POST /customers/:customerId/store-credit/deduct
```

Deduct store credit from a customer's account.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "amount": 10.00,
  "transactionId": "txn-uuid"
}
```

#### Redeem Loyalty Points
```
POST /customers/:customerId/loyalty/redeem
```

Redeem loyalty points for store credit.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "points": 500,
  "conversionRate": 0.01
}
```

---

### Products

Base Path: `/products`

#### Create Product
```
POST /products
```

Create a new product.

**Roles:** admin, manager

**Request Body:**
```json
{
  "name": "Yoga Mat Premium",
  "sku": "YM-001",
  "barcode": "1234567890123",
  "description": "Premium yoga mat with extra cushioning",
  "categoryId": "category-uuid",
  "price": 49.99,
  "cost": 25.00,
  "stockQuantity": 100,
  "minStockLevel": 10,
  "unit": "piece",
  "trackInventory": true
}
```

#### List Products
```
GET /products?page=1&limit=10&search=yoga&categoryId=uuid
```

Get paginated list of products with filtering.

**Roles:** Any authenticated user

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search by name, SKU, or barcode
- `categoryId`: Filter by category
- `status`: Filter by status
- `trackInventory`: Filter by inventory tracking
- `minPrice`: Minimum price
- `maxPrice`: Maximum price

#### Get Low Stock Products
```
GET /products/low-stock?threshold=10
```

Get products with stock below threshold.

**Roles:** Any authenticated user

**Query Parameters:**
- `threshold`: Stock threshold (default: uses product's minStockLevel)

#### Get Stock Value
```
GET /products/stock-value
```

Get total inventory value and cost.

**Roles:** admin, manager

**Response:**
```json
{
  "totalCost": 50000.00,
  "totalValue": 100000.00,
  "potentialProfit": 50000.00,
  "productCount": 500
}
```

#### Get Product by SKU
```
GET /products/sku/:sku
```

Get product by SKU code.

**Roles:** Any authenticated user

#### Get Product by Barcode
```
GET /products/barcode/:barcode
```

Get product by barcode.

**Roles:** Any authenticated user

#### Get Product by ID
```
GET /products/:id
```

Get product details by ID.

**Roles:** Any authenticated user

#### Update Product
```
PATCH /products/:id
```

Update product information.

**Roles:** admin, manager

#### Set Stock Quantity
```
PATCH /products/:id/stock/set
```

Set absolute stock quantity for a product.

**Roles:** admin, manager

**Request Body:**
```json
{
  "quantity": 50
}
```

#### Adjust Stock Quantity
```
PATCH /products/:id/stock/adjust
```

Adjust stock by adding or subtracting.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "adjustment": -5
}
```

#### Delete Product
```
DELETE /products/:id
```

Delete a product.

**Roles:** admin

#### Get Product Statistics
```
GET /products/stats
```

Get overall product statistics.

**Roles:** admin, manager

**Response:**
```json
{
  "totalProducts": 500,
  "activeProducts": 450,
  "lowStockProducts": 25,
  "outOfStockProducts": 10,
  "totalStockValue": 100000.00
}
```

#### Get Out of Stock Products
```
GET /products/stock/out
```

Get products that are out of stock.

**Roles:** Any authenticated user

#### Bulk Update Product Status
```
POST /products/bulk/status
```

Update status for multiple products.

**Roles:** admin, manager

**Request Body:**
```json
{
  "productIds": ["uuid1", "uuid2"],
  "status": "active"
}
```

#### Adjust Inventory with Tracking
```
POST /products/:id/inventory/adjust
```

Adjust inventory with detailed tracking and reason.

**Roles:** admin, manager

**Request Body:**
```json
{
  "adjustment": -10,
  "reason": "damaged",
  "notes": "Water damage from leak",
  "batchNumber": "BATCH-001"
}
```

#### Get Product Bundles
```
GET /products/bundles
```

Get all product bundles.

**Roles:** Any authenticated user

#### Calculate Bundle Price
```
POST /products/bundles/calculate
```

Calculate total price for a product bundle with discounts.

**Roles:** Any authenticated user

**Request Body:**
```json
{
  "products": [
    { "productId": "uuid1", "quantity": 2 },
    { "productId": "uuid2", "quantity": 1 }
  ],
  "discountPercentage": 10
}
```

#### Search by Attributes
```
POST /products/search/attributes
```

Search products by custom attributes.

**Roles:** Any authenticated user

**Request Body:**
```json
{
  "attributes": {
    "color": "blue",
    "size": "medium",
    "material": "cotton"
  }
}
```

#### Get Available Attributes
```
GET /products/attributes
```

Get all available product attributes.

**Roles:** Any authenticated user

#### Add/Update Custom Fields
```
POST /products/:id/fields
```

Add or update custom fields for a product.

**Roles:** admin, manager

**Request Body:**
```json
{
  "fields": {
    "warranty": "2 years",
    "manufacturer": "YogaCo",
    "origin": "USA"
  }
}
```

#### Generate Barcode
```
POST /products/barcode/generate
```

Generate a barcode for a product.

**Roles:** admin, manager

**Request Body:**
```json
{
  "productId": "uuid",
  "format": "EAN13"
}
```

#### Get Products by Pricing Tier
```
GET /products/pricing/:tier
```

Get products by pricing tier (e.g., wholesale, retail, vip).

**Roles:** Any authenticated user

#### Update Product Pricing
```
PUT /products/:id/pricing
```

Update pricing tiers for a product.

**Roles:** admin, manager

**Request Body:**
```json
{
  "retail": 49.99,
  "wholesale": 35.00,
  "vip": 44.99
}
```

#### Get Products by Subcategory
```
GET /products/subcategory/:subcategoryId
```

Get all products in a subcategory.

**Roles:** Any authenticated user

#### Get Category Subcategories
```
GET /products/categories/:category/subcategories
```

Get all subcategories of a category.

**Roles:** Any authenticated user

---

### Categories

Base Path: `/categories`

#### Create Category
```
POST /categories
```

Create a new category.

**Roles:** admin, manager

**Request Body:**
```json
{
  "name": "Yoga Equipment",
  "description": "All yoga-related equipment",
  "parentId": null,
  "imageUrl": "https://example.com/image.jpg"
}
```

#### List Categories
```
GET /categories
```

Get all categories (hierarchical).

**Roles:** Any authenticated user

#### Get Main Categories
```
GET /categories/main
```

Get all top-level categories (no parent).

**Roles:** Any authenticated user

#### Get Subcategories
```
GET /categories/:id/subcategories
```

Get all subcategories of a category.

**Roles:** Any authenticated user

#### Get Category by ID
```
GET /categories/:id
```

Get category details by ID.

**Roles:** Any authenticated user

#### Update Category
```
PATCH /categories/:id
```

Update category information.

**Roles:** admin, manager

#### Delete Category
```
DELETE /categories/:id
```

Delete a category.

**Roles:** admin

---

### Expenses

Base Path: `/expenses`

#### List Expenses
```
GET /expenses?page=1&limit=10&status=pending
```

Get all expenses with filtering.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending, approved, rejected, paid)
- `category`: Filter by category
- `branchId`: Filter by branch
- `startDate`: Start date for range
- `endDate`: End date for range

#### Get Expense Statistics
```
GET /expenses/stats?startDate=2024-01-01&endDate=2024-01-31
```

Get overall expense statistics.

**Query Parameters:**
- `startDate`: Optional start date
- `endDate`: Optional end date

**Response:**
```json
{
  "totalExpenses": 50000.00,
  "pendingExpenses": 5000.00,
  "approvedExpenses": 40000.00,
  "paidExpenses": 35000.00,
  "expenseCount": 150
}
```

#### Get Category Statistics
```
GET /expenses/stats/categories?startDate=2024-01-01&endDate=2024-01-31
```

Get expense statistics by category.

#### Get Expenses by Period
```
GET /expenses/stats/period?startDate=2024-01-01&endDate=2024-12-31&groupBy=month
```

Get expenses grouped by time period.

**Query Parameters:**
- `startDate`: Start date (required)
- `endDate`: End date (required)
- `groupBy`: Grouping period (day, week, month, year)

#### Get Top Expenses
```
GET /expenses/top?limit=10&startDate=2024-01-01&endDate=2024-01-31
```

Get top expenses by amount.

#### Get Pending Expenses
```
GET /expenses/pending
```

Get all expenses pending approval.

#### Get Expenses by Category
```
GET /expenses/category/:category?startDate=2024-01-01&endDate=2024-01-31
```

Get all expenses in a specific category.

#### Get Expenses by Branch
```
GET /expenses/branch/:branchId?startDate=2024-01-01&endDate=2024-01-31
```

Get all expenses for a specific branch.

#### Get Expense by ID
```
GET /expenses/:id
```

Get expense details by ID.

#### Create Expense
```
POST /expenses
```

Create a new expense record.

**Request Body:**
```json
{
  "category": "utilities",
  "description": "Monthly electricity bill",
  "amount": 500.00,
  "branchId": "branch-uuid",
  "date": "2024-01-15",
  "vendor": "Power Company",
  "paymentMethod": "bank_transfer",
  "receiptUrl": "https://example.com/receipt.pdf"
}
```

#### Update Expense
```
PUT /expenses/:id
```

Update an expense record.

#### Delete Expense
```
DELETE /expenses/:id
```

Delete an expense.

#### Approve Expense
```
POST /expenses/:id/approve
```

Approve a pending expense.

#### Reject Expense
```
POST /expenses/:id/reject
```

Reject a pending expense.

#### Mark Expense as Paid
```
POST /expenses/:id/mark-paid
```

Mark an approved expense as paid.

**Request Body:**
```json
{
  "paymentMethod": "bank_transfer",
  "paidDate": "2024-01-20"
}
```

---

### Payments

Base Path: `/payments`

#### Create Payment
```
POST /payments
```

Create a new payment record.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "invoiceId": "invoice-uuid",
  "customerId": "customer-uuid",
  "amount": 150.00,
  "paymentMethod": "card",
  "transactionId": "txn-123456",
  "notes": "Payment for invoice #INV-001"
}
```

#### List Payments
```
GET /payments?page=1&limit=10&paymentMethod=card
```

Get paginated list of payments.

**Roles:** admin, manager, cashier

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `paymentMethod`: Filter by payment method
- `customerId`: Filter by customer
- `startDate`: Start date
- `endDate`: End date
- `status`: Filter by status

#### Get Payment Statistics
```
GET /payments/stats?startDate=2024-01-01&endDate=2024-01-31
```

Get payment statistics.

**Roles:** admin, manager

**Response:**
```json
{
  "totalPayments": 50000.00,
  "paymentCount": 200,
  "averagePaymentAmount": 250.00,
  "byMethod": {
    "cash": 20000.00,
    "card": 25000.00,
    "bank_transfer": 5000.00
  }
}
```

#### Get Payment by ID
```
GET /payments/:id
```

Get payment details by ID.

**Roles:** admin, manager, cashier

#### Update Payment
```
PATCH /payments/:id
```

Update payment information.

**Roles:** admin, manager

#### Refund Payment
```
POST /payments/:id/refund
```

Process a refund for a payment.

**Roles:** admin, manager

**Request Body:**
```json
{
  "notes": "Customer returned product"
}
```

#### Delete Payment
```
DELETE /payments/:id
```

Delete a payment record.

**Roles:** admin

---

### Permissions

Base Path: `/permissions`

#### Create Permission
```
POST /permissions
```

Create a new permission.

**Roles:** admin

#### List Permissions
```
GET /permissions
```

Get all permissions.

**Roles:** Any authenticated user

#### Get Permissions by Role
```
GET /permissions/role/:roleId
```

Get all permissions assigned to a role.

**Roles:** Any authenticated user

#### Get Permission by ID
```
GET /permissions/:id
```

Get permission details by ID.

**Roles:** Any authenticated user

#### Update Permission
```
PATCH /permissions/:id
```

Update permission information.

**Roles:** admin

#### Delete Permission
```
DELETE /permissions/:id
```

Delete a permission.

**Roles:** admin

---

### Analytics

Base Path: `/analytics`

All endpoints require JWT authentication with admin or manager roles.

#### Get Dashboard Analytics
```
GET /analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31&branchId=uuid
```

Get comprehensive dashboard analytics with overview and charts.

**Query Parameters:**
- `startDate`: Optional start date
- `endDate`: Optional end date
- `branchId`: Optional branch filter
- `granularity`: Data granularity (day, week, month)

**Response:**
```json
{
  "overview": {
    "totalSales": 100000.00,
    "totalRevenue": 250000.00,
    "transactionCount": 1000,
    "averageOrderValue": 250.00,
    "growthRate": 15.5
  },
  "charts": {
    "salesTrend": [...],
    "topProducts": [...],
    "categoryBreakdown": [...]
  }
}
```

#### Get Trend Analysis
```
GET /analytics/trends?startDate=2024-01-01&endDate=2024-01-31
```

Get trend analysis with growth metrics.

**Query Parameters:**
- `startDate`: Optional start date
- `endDate`: Optional end date
- `branchId`: Optional branch filter

**Response:**
```json
{
  "salesTrend": {
    "current": 50000.00,
    "previous": 45000.00,
    "growth": 11.1,
    "projection": 55000.00
  },
  "customerTrend": {...},
  "inventoryTrend": {...}
}
```

#### Get Comparative Analysis
```
GET /analytics/comparative?startDate=2024-01-01&endDate=2024-01-31&comparePeriodsCount=3
```

Get comparative analysis across multiple time periods.

**Query Parameters:**
- `startDate`: Start date
- `endDate`: End date
- `branchId`: Optional branch filter
- `comparePeriodsCount`: Number of periods to compare

#### Get Product Performance Analytics
```
GET /analytics/products/performance?startDate=2024-01-01&endDate=2024-01-31
```

Get detailed product performance analytics.

**Response:**
```json
{
  "topProducts": [...],
  "slowMoving": [...],
  "categoryPerformance": [...],
  "profitMargins": [...]
}
```

#### Get Customer Behavior Analytics
```
GET /analytics/customers/behavior?startDate=2024-01-01&endDate=2024-01-31
```

Get customer behavior and purchasing patterns.

**Response:**
```json
{
  "purchaseFrequency": {...},
  "averageOrderValue": {...},
  "customerSegmentation": [...],
  "retentionRate": 75.5,
  "churnRate": 5.2
}
```

---

### Backup

Base Path: `/backup`

#### Create Manual Backup
```
POST /backup
```

Create a manual backup of the database.

**Roles:** admin

**Request Body:**
```json
{
  "description": "Pre-migration backup",
  "includeFiles": true
}
```

#### Schedule Automatic Backups
```
POST /backup/schedule
```

Configure automatic backup schedule.

**Roles:** admin

**Request Body:**
```json
{
  "frequency": "daily",
  "time": "02:00",
  "retention": 30,
  "cloudUpload": true
}
```

#### Get Backup History
```
GET /backup
```

Get list of all backups.

**Roles:** admin, manager

#### Get Backup by ID
```
GET /backup/:id
```

Get backup details by ID.

**Roles:** admin, manager

#### Get Backup Status
```
GET /backup/:id/status
```

Get current status of a backup.

**Roles:** admin, manager

#### Restore from Backup
```
POST /backup/:id/restore
```

Restore database from a backup.

**Roles:** admin

**Request Body:**
```json
{
  "confirmRestore": true
}
```

#### Upload Backup to Cloud
```
POST /backup/:id/upload
```

Upload a backup file to cloud storage.

**Roles:** admin

**Request Body:**
```json
{
  "provider": "s3",
  "bucket": "backups-bucket"
}
```

#### Delete Backup
```
DELETE /backup/:id
```

Delete a backup file.

**Roles:** admin

---

### Export

Base Path: `/export`

All endpoints require JWT authentication with admin or manager roles.

#### Export Report
```
POST /export/report
```

Export a custom report in specified format.

**Request Body:**
```json
{
  "reportType": "sales",
  "format": "xlsx",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "branchId": "uuid",
  "includeCharts": true
}
```

**Response:**
```json
{
  "downloadUrl": "https://example.com/exports/report-123.xlsx",
  "expiresAt": "2024-02-01T00:00:00Z"
}
```

#### Export Sales Data
```
GET /export/sales?format=csv&startDate=2024-01-01&endDate=2024-01-31
```

Export sales data in specified format.

**Query Parameters:**
- `format`: Export format (csv, xlsx, pdf)
- `startDate`: Optional start date
- `endDate`: Optional end date
- `branchId`: Optional branch filter

#### Export Inventory Data
```
GET /export/inventory?format=xlsx&branchId=uuid
```

Export current inventory data.

**Query Parameters:**
- `format`: Export format (csv, xlsx, pdf)
- `branchId`: Optional branch filter

#### Export Customer Data
```
GET /export/customers?format=csv&startDate=2024-01-01&endDate=2024-01-31
```

Export customer data.

**Query Parameters:**
- `format`: Export format (csv, xlsx, pdf)
- `startDate`: Optional start date (for filtering by registration date)
- `endDate`: Optional end date
- `branchId`: Optional branch filter

---

### Inventory

Base Path: `/inventory`

#### List Transactions
```
GET /inventory/transactions?page=1&limit=10&type=adjustment
```

Get all inventory transactions.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `type`: Filter by transaction type (in, out, adjustment, transfer)
- `productId`: Filter by product
- `branchId`: Filter by branch
- `startDate`: Start date
- `endDate`: End date

#### Get Transaction by ID
```
GET /inventory/transactions/:id
```

Get transaction details by ID.

#### Create Transaction
```
POST /inventory/transactions
```

Create a new inventory transaction.

**Request Body:**
```json
{
  "type": "in",
  "productId": "product-uuid",
  "quantity": 50,
  "branchId": "branch-uuid",
  "reference": "PO-001",
  "notes": "Received from supplier"
}
```

#### Update Transaction
```
PUT /inventory/transactions/:id
```

Update a transaction.

#### Delete Transaction
```
DELETE /inventory/transactions/:id
```

Delete a transaction.

#### Cancel Transaction
```
POST /inventory/transactions/:id/cancel
```

Cancel a transaction and reverse inventory changes.

---

#### Get Stock Levels
```
GET /inventory/stock-levels?productId=uuid&locationId=uuid
```

Get current stock levels.

**Query Parameters:**
- `productId`: Filter by product
- `locationId`: Filter by location/branch
- `lowStock`: Show only low stock items

#### Get Low Stock Products
```
GET /inventory/stock-levels/low
```

Get products with low stock levels.

#### Get Out of Stock Products
```
GET /inventory/stock-levels/out
```

Get products that are out of stock.

#### Get Stock Level by Product
```
GET /inventory/stock-levels/:productId?locationId=uuid
```

Get stock level for a specific product.

---

#### Create Adjustment
```
POST /inventory/adjustments
```

Create an inventory adjustment.

**Request Body:**
```json
{
  "productId": "product-uuid",
  "quantity": -5,
  "reason": "damaged",
  "branchId": "branch-uuid",
  "notes": "Water damage from leak"
}
```

#### Create Write-off
```
POST /inventory/write-offs
```

Create an inventory write-off.

**Request Body:**
```json
{
  "productId": "product-uuid",
  "quantity": 10,
  "reason": "expired",
  "branchId": "branch-uuid"
}
```

#### Transfer Stock
```
POST /inventory/transfers
```

Transfer stock between locations.

**Request Body:**
```json
{
  "productId": "product-uuid",
  "quantity": 20,
  "fromBranchId": "branch1-uuid",
  "toBranchId": "branch2-uuid",
  "notes": "Transfer to cover shortage"
}
```

---

#### Get Transactions by Batch
```
GET /inventory/batches/:batchNumber/transactions
```

Get all transactions for a specific batch.

#### Get Transactions by Serial Number
```
GET /inventory/serials/:serialNumber/transactions
```

Get all transactions for a specific serial number.

#### Get Expiring Batches
```
GET /inventory/batches/expiring?daysThreshold=30
```

Get batches expiring within the specified days.

**Query Parameters:**
- `daysThreshold`: Number of days (default: 30)

#### Get Expired Batches
```
GET /inventory/batches/expired
```

Get all expired batches.

#### Get Inventory Statistics
```
GET /inventory/stats
```

Get overall inventory statistics.

**Response:**
```json
{
  "totalProducts": 500,
  "totalStockValue": 100000.00,
  "lowStockProducts": 25,
  "outOfStockProducts": 10,
  "expiringBatches": 5
}
```

---

### Invoices

Base Path: `/invoices`

#### Create Invoice
```
POST /invoices
```

Create a new invoice.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "customerId": "customer-uuid",
  "branchId": "branch-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "price": 49.99,
      "discount": 0
    }
  ],
  "taxRate": 8.5,
  "dueDate": "2024-02-15",
  "notes": "Payment due within 30 days"
}
```

#### List Invoices
```
GET /invoices?page=1&limit=10&status=unpaid
```

Get paginated list of invoices.

**Roles:** admin, manager, cashier

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (draft, pending, paid, overdue, cancelled)
- `customerId`: Filter by customer
- `branchId`: Filter by branch
- `startDate`: Start date
- `endDate`: End date

#### Get Invoice Statistics
```
GET /invoices/stats?branchId=uuid
```

Get invoice statistics.

**Roles:** admin, manager

**Response:**
```json
{
  "totalInvoices": 500,
  "totalAmount": 150000.00,
  "paidAmount": 120000.00,
  "unpaidAmount": 30000.00,
  "overdueAmount": 5000.00,
  "averageInvoiceValue": 300.00
}
```

#### Get Invoice by ID
```
GET /invoices/:id
```

Get invoice details by ID.

**Roles:** admin, manager, cashier

#### Update Invoice
```
PATCH /invoices/:id
```

Update invoice information.

**Roles:** admin, manager

#### Delete Invoice
```
DELETE /invoices/:id
```

Delete an invoice.

**Roles:** admin

#### Mark Invoice as Paid
```
POST /invoices/:id/mark-paid
```

Mark an invoice as fully paid.

**Roles:** admin, manager, cashier

#### Record Partial Payment
```
POST /invoices/:id/partial-payment
```

Record a partial payment for an invoice.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "amount": 50.00,
  "paymentMethod": "card",
  "transactionId": "txn-123"
}
```

#### Send Invoice to Customer
```
POST /invoices/:id/send
```

Send invoice to customer via email.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "email": "customer@example.com",
  "message": "Please find your invoice attached"
}
```

#### Get Overdue Invoices
```
GET /invoices/overdue?page=1&limit=10&branchId=uuid
```

Get all overdue invoices.

**Roles:** admin, manager

#### Generate Invoice PDF
```
POST /invoices/:id/pdf
```

Generate PDF version of invoice.

**Roles:** admin, manager, cashier

**Response:**
```json
{
  "pdfUrl": "https://example.com/invoices/INV-001.pdf"
}
```

#### Email Invoice with PDF
```
POST /invoices/:id/email
```

Generate and email invoice PDF.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "email": "customer@example.com",
  "subject": "Your Invoice",
  "message": "Thank you for your business"
}
```

---

### Notifications

Base Path: `/notifications`

#### Send Notification
```
POST /notifications
```

Send a notification to users.

**Roles:** admin, manager

**Request Body:**
```json
{
  "title": "System Maintenance",
  "message": "System will be down for maintenance on Sunday",
  "type": "info",
  "recipients": ["user-uuid1", "user-uuid2"],
  "channel": "email"
}
```

#### Send Bulk Notifications
```
POST /notifications/bulk
```

Send notifications to multiple users or groups.

**Roles:** admin, manager

**Request Body:**
```json
{
  "title": "Monthly Newsletter",
  "message": "Check out our new products",
  "type": "marketing",
  "recipientGroups": ["all_managers", "branch_staff"],
  "channels": ["email", "push"]
}
```

#### Get Notification History
```
GET /notifications
```

Get notification history.

**Roles:** admin, manager, staff

#### Get User Notification Preferences
```
GET /notifications/preferences/:userId
```

Get notification preferences for a user.

**Roles:** admin, manager, staff

**Response:**
```json
{
  "userId": "uuid",
  "email": true,
  "push": true,
  "sms": false,
  "categories": {
    "sales": true,
    "inventory": true,
    "system": false
  }
}
```

#### Update Notification Preferences
```
PATCH /notifications/preferences/:userId
```

Update user notification preferences.

**Roles:** admin, manager, staff

**Request Body:**
```json
{
  "email": true,
  "push": false,
  "categories": {
    "sales": true,
    "inventory": false
  }
}
```

#### Get Notification by ID
```
GET /notifications/:id
```

Get notification details by ID.

**Roles:** admin, manager, staff

#### Update Notification
```
PATCH /notifications/:id
```

Update a notification.

**Roles:** admin, manager

#### Delete Notification
```
DELETE /notifications/:id
```

Delete a notification.

**Roles:** admin

---

### POS (Point of Sale)

Base Path: `/pos`

#### Create Sale Transaction
```
POST /pos/transactions
```

Create a new sale transaction.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "customerId": "customer-uuid",
  "branchId": "branch-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "price": 49.99,
      "discount": 5.00
    }
  ],
  "paymentMethod": "card",
  "taxRate": 8.5,
  "subtotal": 99.98,
  "tax": 8.50,
  "discount": 10.00,
  "total": 98.48,
  "notes": "Customer loyalty discount applied"
}
```

#### Get Sales Statistics
```
GET /pos/stats?branchId=uuid
```

Get sales statistics.

**Roles:** admin, manager

**Response:**
```json
{
  "totalSales": 50000.00,
  "transactionCount": 200,
  "averageTransactionValue": 250.00,
  "topProducts": [...],
  "salesByPaymentMethod": {...}
}
```

#### Get Daily Sales Report
```
GET /pos/sales/daily?date=2024-01-15&branchId=uuid
```

Get daily sales report.

**Roles:** admin, manager

**Query Parameters:**
- `date`: Specific date (default: today)
- `branchId`: Optional branch filter

#### List Transactions
```
GET /pos/transactions?page=1&limit=10&startDate=2024-01-01
```

Get all sales transactions.

**Roles:** admin, manager, cashier

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `customerId`: Filter by customer
- `branchId`: Filter by branch
- `paymentMethod`: Filter by payment method
- `startDate`: Start date
- `endDate`: End date

#### List Held Transactions
```
GET /pos/transactions/held?page=1&limit=10
```

Get all transactions that are on hold.

**Roles:** admin, manager, cashier

#### Get Held Transaction
```
GET /pos/transactions/held/:id
```

Retrieve a specific held transaction by ID.

**Roles:** admin, manager, cashier

#### Get Transaction History
```
GET /pos/transactions/history?page=1&limit=10
```

Get transaction history with filtering.

**Roles:** admin, manager, cashier

#### Get Transaction by ID
```
GET /pos/transactions/:id
```

Get transaction details by ID.

**Roles:** admin, manager, cashier

#### Hold Transaction
```
POST /pos/transactions/:id/hold
```

Put a transaction on hold.

**Roles:** admin, manager, cashier

#### Resume Held Transaction
```
POST /pos/transactions/:id/resume
```

Resume a held transaction.

**Roles:** admin, manager, cashier

#### Process Refund
```
POST /pos/transactions/:id/refund
```

Process a full or partial refund.

**Roles:** admin, manager

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 1
    }
  ],
  "reason": "Product defective",
  "refundMethod": "original"
}
```

#### Split Payment
```
POST /pos/transactions/:id/split-payment
```

Split payment across multiple payment methods.

**Roles:** admin, manager, cashier

**Request Body:**
```json
{
  "payments": [
    {
      "method": "cash",
      "amount": 50.00
    },
    {
      "method": "card",
      "amount": 48.48
    }
  ]
}
```

#### Update Transaction
```
PATCH /pos/transactions/:id
```

Update transaction information.

**Roles:** admin, manager

#### Delete Transaction
```
DELETE /pos/transactions/:id
```

Delete a transaction.

**Roles:** admin

---

### Purchase Orders

Base Path: `/purchase-orders`

#### Create Purchase Order
```
POST /purchase-orders
```

Create a new purchase order.

**Roles:** admin, manager

**Request Body:**
```json
{
  "supplierId": "supplier-uuid",
  "branchId": "branch-uuid",
  "expectedDeliveryDate": "2024-02-01",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 100,
      "unitCost": 25.00
    }
  ],
  "notes": "Rush order needed",
  "shippingAddress": "123 Main St, New York, NY 10001"
}
```

#### List Purchase Orders
```
GET /purchase-orders?page=1&limit=10&status=pending
```

Get all purchase orders.

**Roles:** Any authenticated user

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (draft, submitted, approved, received, cancelled)
- `supplierId`: Filter by supplier
- `branchId`: Filter by branch
- `startDate`: Start date
- `endDate`: End date

#### Get Purchase Order Statistics
```
GET /purchase-orders/stats
```

Get purchase order statistics.

**Roles:** admin, manager

**Response:**
```json
{
  "totalOrders": 150,
  "totalValue": 250000.00,
  "pendingOrders": 20,
  "receivedOrders": 100,
  "averageOrderValue": 1666.67
}
```

#### Get Purchase Order by PO Number
```
GET /purchase-orders/po-number/:poNumber
```

Get purchase order by PO number.

**Roles:** Any authenticated user

#### Get Purchase Order by ID
```
GET /purchase-orders/:id
```

Get purchase order details by ID.

**Roles:** Any authenticated user

#### Update Purchase Order
```
PATCH /purchase-orders/:id
```

Update purchase order (draft only).

**Roles:** admin, manager

#### Submit Purchase Order
```
POST /purchase-orders/:id/submit
```

Submit purchase order for approval.

**Roles:** admin, manager

#### Approve Purchase Order
```
POST /purchase-orders/:id/approve
```

Approve a purchase order.

**Roles:** admin, manager

#### Receive Purchase Order
```
POST /purchase-orders/:id/receive
```

Record receipt of inventory against purchase order.

**Roles:** admin, manager, staff

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product-uuid",
      "quantityReceived": 95,
      "condition": "good"
    }
  ],
  "receivedDate": "2024-02-01",
  "notes": "5 items damaged in transit"
}
```

#### Cancel Purchase Order
```
POST /purchase-orders/:id/cancel
```

Cancel a purchase order.

**Roles:** admin, manager

#### Delete Purchase Order
```
DELETE /purchase-orders/:id
```

Delete purchase order (draft only).

**Roles:** admin

---

### Reports

Base Path: `/reports`

All endpoints require JWT authentication with admin or manager roles.

#### Generate Sales Report
```
GET /reports/sales?period=month&startDate=2024-01-01&endDate=2024-01-31
```

Generate comprehensive sales report.

**Query Parameters:**
- `period`: Report period (custom, day, week, month, year)
- `startDate`: Start date (for custom period)
- `endDate`: End date (for custom period)
- `branchId`: Optional branch filter

**Response:**
```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "totalSales": 150000.00,
  "transactionCount": 600,
  "averageOrderValue": 250.00,
  "topProducts": [...],
  "salesByDay": [...],
  "salesByCategory": [...]
}
```

#### Generate Daily Sales Report
```
GET /reports/sales/daily?startDate=2024-01-01&endDate=2024-01-31
```

Generate daily sales breakdown.

#### Generate Weekly Sales Report
```
GET /reports/sales/weekly?startDate=2024-01-01&endDate=2024-01-31
```

Generate weekly sales breakdown.

#### Generate Monthly Sales Report
```
GET /reports/sales/monthly?startDate=2024-01-01&endDate=2024-12-31
```

Generate monthly sales breakdown.

#### Generate Yearly Sales Report
```
GET /reports/sales/yearly?startDate=2024-01-01&endDate=2024-12-31
```

Generate yearly sales breakdown.

#### Generate Inventory Valuation Report
```
GET /reports/inventory/valuation?branchId=uuid
```

Generate inventory valuation report.

**Response:**
```json
{
  "totalCost": 50000.00,
  "totalRetailValue": 100000.00,
  "potentialProfit": 50000.00,
  "productCount": 500,
  "byCategory": [...],
  "lowStockValue": 5000.00
}
```

#### Generate Profit & Loss Report
```
GET /reports/profit-loss?startDate=2024-01-01&endDate=2024-01-31
```

Generate profit and loss statement.

**Response:**
```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "revenue": 150000.00,
  "costOfGoodsSold": 75000.00,
  "grossProfit": 75000.00,
  "expenses": {
    "rent": 5000.00,
    "utilities": 1000.00,
    "salaries": 20000.00,
    "other": 3000.00
  },
  "totalExpenses": 29000.00,
  "netProfit": 46000.00,
  "profitMargin": 30.67
}
```

#### Generate Slow-Moving Stock Report
```
GET /reports/inventory/slow-moving?daysThreshold=90&branchId=uuid
```

Generate report of slow-moving inventory.

**Query Parameters:**
- `daysThreshold`: Days without sales (default: 90)
- `branchId`: Optional branch filter

#### Generate Employee Performance Report
```
GET /reports/employees/performance?startDate=2024-01-01&endDate=2024-01-31
```

Generate employee performance metrics.

**Response:**
```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "employees": [
    {
      "employeeId": "uuid",
      "name": "John Doe",
      "salesCount": 100,
      "totalSales": 25000.00,
      "averageSale": 250.00,
      "performance": "excellent"
    }
  ]
}
```

#### Generate Customer Analytics Report
```
GET /reports/customers/analytics?startDate=2024-01-01&endDate=2024-01-31
```

Generate customer analytics and behavior report.

**Response:**
```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "totalCustomers": 500,
  "newCustomers": 50,
  "returningCustomers": 450,
  "averageOrderValue": 250.00,
  "customerLifetimeValue": 1500.00,
  "topCustomers": [...],
  "segmentAnalysis": [...]
}
```

#### Generate Tax Report
```
GET /reports/tax?startDate=2024-01-01&endDate=2024-01-31
```

Generate tax report for specified period.

**Response:**
```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "taxableAmount": 140000.00,
  "taxCollected": 11900.00,
  "taxRate": 8.5,
  "transactionCount": 560,
  "byCategory": [...],
  "byBranch": [...]
}
```

---

### Roles

Base Path: `/roles`

#### Create Role
```
POST /roles
```

Create a new role.

**Roles:** admin

**Request Body:**
```json
{
  "name": "supervisor",
  "description": "Supervisor with extended permissions",
  "permissions": ["read:products", "write:products", "read:sales"]
}
```

#### List Roles
```
GET /roles
```

Get all roles.

**Roles:** Any authenticated user

#### Get Role by ID
```
GET /roles/:id
```

Get role details by ID.

**Roles:** Any authenticated user

#### Update Role
```
PATCH /roles/:id
```

Update role information.

**Roles:** admin

#### Delete Role
```
DELETE /roles/:id
```

Delete a role.

**Roles:** admin

#### Assign Permissions to Role
```
POST /roles/:id/permissions
```

Assign permissions to a role.

**Roles:** admin

**Request Body:**
```json
{
  "permissionIds": ["perm-uuid1", "perm-uuid2", "perm-uuid3"]
}
```

---

### Settings

Base Path: `/settings`

#### Create Setting
```
POST /settings
```

Create a new setting.

**Roles:** admin

**Request Body:**
```json
{
  "key": "default_tax_rate",
  "value": "8.5",
  "category": "tax",
  "description": "Default tax rate percentage",
  "type": "number",
  "isPublic": false
}
```

#### Bulk Update Settings
```
PATCH /settings/bulk
```

Update multiple settings at once.

**Roles:** admin, manager

**Request Body:**
```json
{
  "settings": [
    { "key": "default_tax_rate", "value": "9.0" },
    { "key": "currency", "value": "USD" },
    { "key": "receipt_footer", "value": "Thank you!" }
  ]
}
```

#### List All Settings
```
GET /settings
```

Get all settings.

**Roles:** admin, manager, staff

#### Get All Settings as Object
```
GET /settings/all-as-object
```

Get all settings as key-value object.

**Roles:** admin, manager, staff

**Response:**
```json
{
  "default_tax_rate": "8.5",
  "currency": "USD",
  "receipt_footer": "Thank you!",
  "allow_negative_stock": false
}
```

#### Get Settings by Category
```
GET /settings/category/:category
```

Get all settings in a specific category.

**Roles:** admin, manager, staff

#### Get Setting by Key
```
GET /settings/key/:key
```

Get a specific setting by key.

**Roles:** admin, manager, staff

#### Update Setting by Key
```
PATCH /settings/key/:key
```

Update a setting by key.

**Roles:** admin, manager

**Request Body:**
```json
{
  "value": "9.0"
}
```

#### Get Setting by ID
```
GET /settings/:id
```

Get setting details by ID.

**Roles:** admin, manager, staff

#### Update Setting by ID
```
PATCH /settings/:id
```

Update setting by ID.

**Roles:** admin

#### Delete Setting
```
DELETE /settings/:id
```

Delete a setting.

**Roles:** admin

#### Initialize Default Settings
```
POST /settings/initialize-defaults
```

Initialize default system settings.

**Roles:** admin

---

### Suppliers

Base Path: `/suppliers`

#### Create Supplier
```
POST /suppliers
```

Create a new supplier.

**Roles:** admin, manager

**Request Body:**
```json
{
  "name": "Yoga Equipment Co.",
  "code": "YEC-001",
  "email": "orders@yogaequip.com",
  "phone": "+1234567890",
  "address": "456 Supply St",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90001",
  "country": "USA",
  "contactPerson": "Jane Smith",
  "paymentTerms": "Net 30",
  "taxId": "12-3456789"
}
```

#### List Suppliers
```
GET /suppliers?search=yoga&status=active
```

Get all suppliers with filtering.

**Roles:** Any authenticated user

**Query Parameters:**
- `search`: Search by name, code, or contact
- `status`: Filter by status (active, inactive)
- `city`: Filter by city
- `country`: Filter by country

#### Get Supplier Statistics
```
GET /suppliers/stats
```

Get overall supplier statistics.

**Roles:** admin, manager

**Response:**
```json
{
  "totalSuppliers": 50,
  "activeSuppliers": 45,
  "totalPurchaseOrders": 500,
  "totalPurchaseValue": 500000.00,
  "averageOrderValue": 1000.00
}
```

#### Get Supplier by Code
```
GET /suppliers/code/:code
```

Get supplier by unique code.

**Roles:** Any authenticated user

#### Get Supplier by ID
```
GET /suppliers/:id
```

Get supplier details by ID.

**Roles:** Any authenticated user

#### Update Supplier
```
PATCH /suppliers/:id
```

Update supplier information.

**Roles:** admin, manager

#### Update Payment Terms
```
PUT /suppliers/:id/payment-terms
```

Update supplier payment terms.

**Roles:** admin, manager

**Request Body:**
```json
{
  "paymentTerms": "Net 45"
}
```

#### Delete Supplier
```
DELETE /suppliers/:id
```

Delete a supplier.

**Roles:** admin

---

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common HTTP Status Codes

- **200 OK:** Request succeeded
- **201 Created:** Resource created successfully
- **400 Bad Request:** Invalid request parameters
- **401 Unauthorized:** Authentication required or failed
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **409 Conflict:** Resource conflict (e.g., duplicate email)
- **422 Unprocessable Entity:** Validation failed
- **500 Internal Server Error:** Server error

### Error Response Fields

- `statusCode`: HTTP status code
- `message`: Human-readable error message
- `error`: Error type/category
- `details`: Array of detailed error information (for validation errors)

---

## Additional Information

### Rate Limiting

API requests may be rate-limited. Rate limit information is included in response headers:

- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

### Versioning

The API version is indicated in the response headers:
- `X-API-Version`: Current API version

### Timestamps

All timestamps are returned in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

### Currency

All monetary values are in the configured currency (default: USD) and represented as decimal numbers with 2 decimal places.

---

**Last Updated:** 2025-01-07
**API Version:** 1.0
