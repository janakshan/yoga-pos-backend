# Menu Modifiers & Enhanced Products API Documentation

## Overview

This document describes the Menu Modifiers and Enhanced Products system implemented for the restaurant POS backend. The system allows restaurants to create customizable menu items with modifiers, manage pricing, validate selections, and implement complex availability rules.

## Features Implemented

### ✅ Core Features
- **Modifier Management**: Complete CRUD operations for modifiers
- **Modifier Group Management**: Group modifiers together with selection rules
- **Product Enhancement**: Extended Product entity with restaurant-specific fields
- **Product-Modifier Relationships**: Many-to-many relationships between products and modifier groups
- **Pricing Calculation**: Dynamic pricing with fixed amounts and percentages
- **Selection Validation**: Min/max selections, required/optional groups
- **Availability Rules**: Time-based, day-based, and date-range availability
- **Inventory Tracking**: Optional stock tracking for modifiers
- **Bulk Operations**: Batch updates for availability and stock

### 🎯 Use Cases
- Pizza toppings (e.g., Extra Cheese, Pepperoni, Olives)
- Size options (e.g., Small, Medium, Large)
- Cooking preferences (e.g., Rare, Medium, Well Done)
- Drink customizations (e.g., Ice level, Sugar level)
- Special requests (e.g., No onions, Extra spicy)

---

## Database Schema

### Entities

#### 1. **modifier_groups**
Represents a group of modifiers (e.g., "Size", "Toppings").

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Group name (e.g., "Toppings") |
| description | TEXT | Optional description |
| branch_id | UUID | FK to branches |
| type | ENUM | 'required' or 'optional' |
| selection_type | ENUM | 'single' or 'multiple' |
| min_selections | INTEGER | Minimum selections required (default: 0) |
| max_selections | INTEGER | Maximum selections allowed (null = unlimited) |
| display_name | VARCHAR | Customer-facing name |
| sort_order | INTEGER | Display order |
| is_active | BOOLEAN | Active status |
| show_in_pos | BOOLEAN | Show in POS |
| show_in_online_menu | BOOLEAN | Show in online menu |
| category | VARCHAR | Category for grouping |
| free_modifier_count | INTEGER | Number of free modifiers |
| charge_above_free | BOOLEAN | Charge for modifiers beyond free count |
| availability | JSONB | Time-based availability rules |
| conditional_rules | JSONB | Conditional display rules |
| ui_config | JSONB | UI configuration |
| metadata | JSONB | Additional metadata |

#### 2. **modifiers**
Represents individual modifier options (e.g., "Extra Cheese").

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Modifier name |
| description | TEXT | Optional description |
| modifier_group_id | UUID | FK to modifier_groups |
| branch_id | UUID | FK to branches |
| price_adjustment_type | ENUM | 'fixed' or 'percentage' |
| price_adjustment | DECIMAL(10,2) | Price adjustment amount |
| is_active | BOOLEAN | Active status |
| is_available | BOOLEAN | Currently available |
| is_default | BOOLEAN | Default selection for group |
| sort_order | INTEGER | Display order |
| sku | VARCHAR | SKU for inventory tracking |
| image_url | VARCHAR | Image URL |
| nutritional_info | JSONB | Nutritional information |
| availability | JSONB | Time-based availability |
| track_inventory | BOOLEAN | Track inventory |
| stock_quantity | INTEGER | Stock quantity |
| out_of_stock_action | VARCHAR | 'hide', 'disable', or 'show' |
| cost | DECIMAL(10,2) | Cost for reporting |
| metadata | JSONB | Additional metadata |

#### 3. **product_modifier_groups**
Junction table linking products to modifier groups (many-to-many).

| Column | Type | Description |
|--------|------|-------------|
| product_id | UUID | FK to products |
| modifier_group_id | UUID | FK to modifier_groups |

#### 4. **products** (Enhanced)
Additional restaurant-specific columns added to existing products table:

| Column | Type | Description |
|--------|------|-------------|
| kitchen_station | VARCHAR | Kitchen station assignment |
| restaurant_category | VARCHAR | Menu category (appetizer, main, dessert, etc.) |
| preparation_time | INTEGER | Preparation time in minutes |
| cooking_instructions | TEXT | Cooking instructions |
| is_popular | BOOLEAN | Popular item flag |
| is_recommended | BOOLEAN | Recommended item flag |
| is_new | BOOLEAN | New item flag |
| is_seasonal | BOOLEAN | Seasonal item flag |
| is_spicy | BOOLEAN | Spicy item flag |
| spiciness_level | INTEGER | Spiciness level (0-5) |
| allergens | TEXT[] | List of allergens |
| dietary_restrictions | TEXT[] | Dietary restrictions |
| nutritional_info | JSONB | Nutritional information |
| is_available | BOOLEAN | Currently available |
| availability | JSONB | Time-based availability |
| has_size_variations | BOOLEAN | Has size variations |
| size_variations | JSONB | Size variation details |
| available_for_takeaway | BOOLEAN | Available for takeaway |
| available_for_delivery | BOOLEAN | Available for delivery |
| available_for_dine_in | BOOLEAN | Available for dine-in |
| tags | TEXT[] | Menu tags |
| is_combo | BOOLEAN | Is combo meal |
| combo_items | JSONB | Combo meal items |
| menu_sort_order | INTEGER | Menu display order |

---

## API Endpoints

### Modifier Endpoints

#### Create Modifier
```
POST /api/v1/restaurant/modifiers
```

**Request Body:**
```json
{
  "name": "Extra Cheese",
  "description": "Add extra cheese to your dish",
  "modifierGroupId": "123e4567-e89b-12d3-a456-426614174000",
  "branchId": "123e4567-e89b-12d3-a456-426614174001",
  "priceAdjustmentType": "fixed",
  "priceAdjustment": 2.50,
  "isActive": true,
  "isAvailable": true,
  "sortOrder": 1,
  "nutritionalInfo": {
    "calories": 100,
    "allergens": ["dairy"]
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "modifier-uuid",
  "name": "Extra Cheese",
  "priceAdjustment": 2.50,
  "modifierGroup": { ... },
  "createdAt": "2025-01-13T...",
  "updatedAt": "2025-01-13T..."
}
```

#### Get All Modifiers
```
GET /api/v1/restaurant/modifiers?branchId=xxx&modifierGroupId=yyy&page=1&limit=20
```

**Query Parameters:**
- `branchId` (optional): Filter by branch
- `modifierGroupId` (optional): Filter by modifier group
- `search` (optional): Search by name
- `isActive` (optional): Filter by active status
- `isAvailable` (optional): Filter by availability
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `sortBy` (optional, default: 'sortOrder'): Sort field
- `sortOrder` (optional, default: 'ASC'): Sort order

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "modifier-uuid",
      "name": "Extra Cheese",
      "priceAdjustment": 2.50,
      "modifierGroup": { ... },
      ...
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Get Single Modifier
```
GET /api/v1/restaurant/modifiers/:id
```

**Response:** `200 OK`

#### Update Modifier
```
PATCH /api/v1/restaurant/modifiers/:id
```

**Request Body:** (Partial update)
```json
{
  "priceAdjustment": 3.00,
  "isAvailable": false
}
```

**Response:** `200 OK`

#### Delete Modifier
```
DELETE /api/v1/restaurant/modifiers/:id
```

**Response:** `204 No Content`

---

### Modifier Group Endpoints

#### Create Modifier Group
```
POST /api/v1/restaurant/modifiers/groups
```

**Request Body:**
```json
{
  "name": "Toppings",
  "description": "Choose your favorite toppings",
  "branchId": "123e4567-e89b-12d3-a456-426614174000",
  "type": "optional",
  "selectionType": "multiple",
  "minSelections": 0,
  "maxSelections": 3,
  "displayName": "Choose Your Toppings",
  "sortOrder": 1,
  "freeModifierCount": 2,
  "chargeAboveFree": true,
  "showInPos": true,
  "showInOnlineMenu": true
}
```

**Response:** `201 Created`

#### Get All Modifier Groups
```
GET /api/v1/restaurant/modifiers/groups?branchId=xxx&category=yyy
```

**Query Parameters:**
- `branchId` (optional): Filter by branch
- `search` (optional): Search by name
- `category` (optional): Filter by category
- `type` (optional): Filter by type (required/optional)
- `selectionType` (optional): Filter by selection type (single/multiple)
- `isActive` (optional): Filter by active status
- `showInPos` (optional): Filter by POS visibility
- `showInOnlineMenu` (optional): Filter by online menu visibility
- `page`, `limit`, `sortBy`, `sortOrder`: Pagination options

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "group-uuid",
      "name": "Toppings",
      "type": "optional",
      "selectionType": "multiple",
      "minSelections": 0,
      "maxSelections": 3,
      "modifiers": [
        {
          "id": "mod-uuid-1",
          "name": "Extra Cheese",
          "priceAdjustment": 2.50,
          ...
        },
        ...
      ],
      ...
    }
  ],
  "meta": { ... }
}
```

#### Get Single Modifier Group
```
GET /api/v1/restaurant/modifiers/groups/:id
```

#### Update Modifier Group
```
PATCH /api/v1/restaurant/modifiers/groups/:id
```

#### Delete Modifier Group
```
DELETE /api/v1/restaurant/modifiers/groups/:id
```

---

### Product-Modifier Assignment Endpoints

#### Assign Modifier Groups to Product
```
POST /api/v1/restaurant/modifiers/products/:productId/assign
```

**Request Body:**
```json
{
  "modifierGroupIds": [
    "123e4567-e89b-12d3-a456-426614174000",
    "123e4567-e89b-12d3-a456-426614174001"
  ]
}
```

**Response:** `200 OK`
```json
{
  "id": "product-uuid",
  "name": "Margherita Pizza",
  "modifierGroups": [
    {
      "id": "group-uuid-1",
      "name": "Size",
      ...
    },
    {
      "id": "group-uuid-2",
      "name": "Toppings",
      ...
    }
  ],
  ...
}
```

#### Get Product Modifier Groups
```
GET /api/v1/restaurant/modifiers/products/:productId
```

Returns all active modifier groups associated with the product, with active and available modifiers only, sorted by sort order.

**Response:** `200 OK`
```json
[
  {
    "id": "group-uuid",
    "name": "Size",
    "type": "required",
    "selectionType": "single",
    "minSelections": 1,
    "maxSelections": 1,
    "modifiers": [
      {
        "id": "mod-uuid-1",
        "name": "Small",
        "priceAdjustment": 0,
        "sortOrder": 1
      },
      {
        "id": "mod-uuid-2",
        "name": "Large",
        "priceAdjustment": 3.00,
        "sortOrder": 2
      }
    ]
  }
]
```

#### Remove Modifier Group from Product
```
DELETE /api/v1/restaurant/modifiers/products/:productId/groups/:groupId
```

**Response:** `204 No Content`

---

### Validation Endpoint

#### Validate Modifier Selection
```
POST /api/v1/restaurant/modifiers/validate
```

Validates customer modifier selections against business rules and calculates total price.

**Request Body:**
```json
{
  "productId": "123e4567-e89b-12d3-a456-426614174000",
  "selections": [
    {
      "modifierGroupId": "group-uuid-1",
      "selectedModifiers": [
        {
          "modifierId": "mod-uuid-1",
          "name": "Large",
          "priceAdjustment": 3.00
        }
      ]
    },
    {
      "modifierGroupId": "group-uuid-2",
      "selectedModifiers": [
        {
          "modifierId": "mod-uuid-2",
          "name": "Extra Cheese",
          "priceAdjustment": 2.50
        },
        {
          "modifierId": "mod-uuid-3",
          "name": "Pepperoni",
          "priceAdjustment": 2.50
        }
      ]
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "valid": true,
  "errors": [],
  "totalPrice": 5.50
}
```

**Validation Errors Example:**
```json
{
  "valid": false,
  "errors": [
    "Size requires at least 1 selection(s)",
    "Toppings allows maximum 3 selection(s)",
    "Modifier Extra Spicy is not available"
  ],
  "totalPrice": 0
}
```

---

### Bulk Operations

#### Bulk Update Modifier Availability
```
PATCH /api/v1/restaurant/modifiers/bulk/availability
```

**Request Body:**
```json
{
  "modifierIds": [
    "mod-uuid-1",
    "mod-uuid-2",
    "mod-uuid-3"
  ],
  "isAvailable": false
}
```

**Response:** `204 No Content`

#### Bulk Update Modifier Stock
```
PATCH /api/v1/restaurant/modifiers/bulk/stock
```

**Request Body:**
```json
{
  "updates": [
    {
      "modifierId": "mod-uuid-1",
      "stockQuantity": 50
    },
    {
      "modifierId": "mod-uuid-2",
      "stockQuantity": 0
    }
  ]
}
```

**Response:** `204 No Content`

---

## Business Logic

### Modifier Selection Validation

The system validates modifier selections based on:

1. **Required Groups**: Groups with `type: 'required'` must have at least `minSelections` modifiers selected
2. **Optional Groups**: Groups with `type: 'optional'` can be skipped
3. **Single Selection**: Groups with `selectionType: 'single'` allow exactly one modifier
4. **Multiple Selection**: Groups with `selectionType: 'multiple'` allow multiple modifiers up to `maxSelections`
5. **Min/Max Constraints**: Validates `minSelections` and `maxSelections` rules
6. **Availability**: Only active and available modifiers can be selected

### Pricing Calculation

#### Fixed Price Adjustment
```
Total = Base Product Price + Sum(Fixed Modifier Prices)
```

Example:
- Pizza Base: $10.00
- Extra Cheese (Fixed): +$2.50
- Pepperoni (Fixed): +$2.50
- **Total: $15.00**

#### Percentage Price Adjustment
```
Total = Base Product Price + Sum(Base Price × Percentage / 100)
```

Example:
- Pizza Base: $10.00
- Extra Large (Percentage): +50% = +$5.00
- **Total: $15.00**

#### Free Modifier Logic

If `freeModifierCount = 2` and `chargeAboveFree = true`:
- First 2 modifiers: Free
- 3rd modifier onwards: Charged

Example:
- Base: $10.00
- Topping 1: $2.00 (FREE)
- Topping 2: $2.00 (FREE)
- Topping 3: $2.00 (CHARGED)
- **Total: $12.00**

### Availability Rules

#### Day-Based Availability
```json
{
  "availability": {
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }
}
```
Modifier only available on weekdays.

#### Time-Based Availability
```json
{
  "availability": {
    "timeRanges": [
      {
        "startTime": "11:00",
        "endTime": "14:00"
      },
      {
        "startTime": "18:00",
        "endTime": "22:00"
      }
    ]
  }
}
```
Modifier available during lunch (11 AM - 2 PM) and dinner (6 PM - 10 PM).

#### Date Range Availability
```json
{
  "availability": {
    "dateRanges": [
      {
        "startDate": "2025-12-01",
        "endDate": "2025-12-31"
      }
    ]
  }
}
```
Seasonal modifier available only in December.

#### Combined Rules
All rules must pass for the modifier to be available. If any rule fails, the modifier is unavailable.

---

## Integration with Orders

When creating a restaurant order, modifiers can be included in order items:

```json
{
  "productId": "product-uuid",
  "quantity": 1,
  "unitPrice": 10.00,
  "modifiers": [
    {
      "id": "group-uuid-1",
      "name": "Size",
      "options": [
        {
          "id": "mod-uuid-1",
          "name": "Large",
          "priceAdjustment": 3.00
        }
      ]
    },
    {
      "id": "group-uuid-2",
      "name": "Toppings",
      "options": [
        {
          "id": "mod-uuid-2",
          "name": "Extra Cheese",
          "priceAdjustment": 2.50
        }
      ]
    }
  ]
}
```

The order system will:
1. Validate modifier selections using the validation endpoint
2. Calculate the total item price including modifiers
3. Store the modifier selections in the order item for kitchen display and receipt printing

---

## Authentication & Authorization

All endpoints require:
- **Authentication**: JWT token via `Authorization: Bearer <token>` header
- **Authorization**: Role-based access control

### Required Roles:
- **Admin / Manager**: Create, update, delete operations
- **All authenticated users**: Read operations (GET)

---

## Error Responses

### Common Error Codes

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Modifier with SKU CHEESE-001 already exists",
  "error": "Bad Request"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Modifier group with ID xxx not found",
  "error": "Not Found"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

---

## Testing

### Run Unit Tests
```bash
npm test -- modifiers.service.spec.ts
```

### Test Coverage
The implementation includes comprehensive unit tests covering:
- CRUD operations for modifiers and modifier groups
- Product-modifier relationship management
- Modifier selection validation
- Pricing calculation (fixed, percentage, free modifiers)
- Availability checking (day, time, date ranges)
- Error handling (not found, validation errors)

---

## Database Migration

### Run Migration
```bash
npm run migration:run
```

This will create:
- `modifier_groups` table
- `modifiers` table
- `product_modifier_groups` junction table
- Add restaurant-specific columns to `products` table
- Create necessary indexes for performance

### Revert Migration
```bash
npm run migration:revert
```

---

## Examples

### Example 1: Pizza with Size and Toppings

**Setup:**
1. Create "Size" modifier group (required, single selection)
   - Small ($0)
   - Medium (+$2)
   - Large (+$4)

2. Create "Toppings" modifier group (optional, multiple selection, max 3)
   - Extra Cheese (+$2)
   - Pepperoni (+$2)
   - Mushrooms (+$1.50)
   - Olives (+$1.50)

3. Assign both groups to "Margherita Pizza" product

**Order:**
- Base Price: $10
- Size: Large (+$4)
- Toppings: Extra Cheese (+$2), Pepperoni (+$2)
- **Total: $18**

### Example 2: Drink with Customization

**Setup:**
1. Create "Size" modifier group (required, single selection)
   - Small ($0)
   - Medium (+$1)
   - Large (+$2)

2. Create "Ice Level" modifier group (required, single selection)
   - No Ice ($0)
   - Less Ice ($0)
   - Normal Ice ($0)
   - Extra Ice ($0)

3. Create "Sugar Level" modifier group (required, single selection)
   - 0% ($0)
   - 25% ($0)
   - 50% ($0)
   - 75% ($0)
   - 100% ($0)

**Order:**
- Base Price: $4
- Size: Large (+$2)
- Ice Level: Less Ice ($0)
- Sugar Level: 50% ($0)
- **Total: $6**

### Example 3: Burger with Free Toppings

**Setup:**
1. Create "Toppings" modifier group (optional, multiple, max 5, first 2 free)
   - Lettuce (+$1)
   - Tomato (+$1)
   - Cheese (+$1.50)
   - Bacon (+$2)
   - Avocado (+$2)

**Order:**
- Base Price: $8
- Toppings: Lettuce (FREE), Tomato (FREE), Cheese (+$1.50), Bacon (+$2)
- **Total: $11.50**

---

## Performance Considerations

### Indexes Created
- `modifier_groups.branch_id`
- `modifier_groups.branch_id + is_active`
- `modifier_groups.branch_id + category`
- `modifiers.modifier_group_id`
- `modifiers.modifier_group_id + sort_order`
- `modifiers.branch_id + is_active`
- `modifiers.sku` (partial index where not null)
- `product_modifier_groups.product_id`
- `product_modifier_groups.modifier_group_id`
- `products.restaurant_category` (partial index)
- `products.kitchen_station` (partial index)
- `products.is_available`
- `products.is_popular` (partial index where true)
- `products.menu_sort_order`

### Query Optimization
- Use pagination for large result sets
- Filter by `branchId` and `isActive` to reduce query scope
- Eager loading of relationships where needed
- Efficient sorting with indexed columns

---

## Future Enhancements

Potential features for future versions:
- Image upload for modifiers
- Multi-language support for modifier names
- Modifier templates for quick setup
- Analytics on popular modifier combinations
- Dynamic pricing based on time of day
- Integration with loyalty programs
- Modifier recommendations based on order history
- Conditional modifier pricing (e.g., cheaper when ordered in combination)

---

## Support

For issues or questions:
- Create an issue on GitHub
- Contact the development team
- Check the Swagger documentation at `/api/v1/docs`

---

## Changelog

### Version 1.0.0 (2025-01-13)
- Initial implementation of modifiers system
- Complete CRUD operations for modifiers and modifier groups
- Product-modifier relationships
- Enhanced product entity with restaurant fields
- Pricing calculation logic
- Selection validation
- Availability rules engine
- Comprehensive unit tests
- Database migration
- API documentation
