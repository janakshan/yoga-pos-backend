# Product Management Module - Feature Documentation

## Overview

The Product Management Module has been comprehensively updated with advanced features for managing products in a retail/yoga studio environment. This document outlines all the new features and how to use them.

## Table of Contents

1. [Product Catalog with Categories and Subcategories](#1-product-catalog-with-categories-and-subcategories)
2. [Product Attributes and Variations](#2-product-attributes-and-variations)
3. [Barcode Generation and Management](#3-barcode-generation-and-management)
4. [Pricing Tiers](#4-pricing-tiers)
5. [Product Images and Descriptions](#5-product-images-and-descriptions)
6. [Bundled Products and Kits](#6-bundled-products-and-kits)
7. [Supplier Information Linkage](#7-supplier-information-linkage)
8. [Unit of Measure Conversions](#8-unit-of-measure-conversions)
9. [Product Tags and Custom Fields](#9-product-tags-and-custom-fields)
10. [Usage Examples](#10-usage-examples)

---

## 1. Product Catalog with Categories and Subcategories

### Main Categories (15 total)

- `yoga_mat` - Yoga Mats
- `yoga_block` - Yoga Blocks
- `yoga_strap` - Yoga Straps
- `yoga_wheel` - Yoga Wheels
- `yoga_bolster` - Yoga Bolsters
- `yoga_blanket` - Yoga Blankets
- `clothing` - Clothing and Apparel
- `accessories` - Accessories
- `equipment` - Equipment
- `supplements` - Supplements and Nutrition
- `books` - Books and Media
- `gift_cards` - Gift Cards
- `memberships` - Memberships
- `classes` - Classes
- `workshops` - Workshops
- `other` - Other Items

### Subcategories

Each main category now supports subcategories for better organization:

#### Yoga Mat Subcategories:
- `yoga_mat_standard` - Standard Mats
- `yoga_mat_thick` - Thick Mats
- `yoga_mat_travel` - Travel Mats
- `yoga_mat_eco` - Eco-Friendly Mats
- `yoga_mat_premium` - Premium Mats

#### Clothing Subcategories:
- `clothing_tops` - Tops
- `clothing_bottoms` - Bottoms
- `clothing_sets` - Sets
- `clothing_mens` - Men's Wear
- `clothing_womens` - Women's Wear

#### Supplements Subcategories:
- `supplements_protein` - Protein
- `supplements_vitamins` - Vitamins
- `supplements_energy` - Energy
- `supplements_recovery` - Recovery

*See `src/features/products/types/product.types.js` for complete subcategory list*

### API Usage

```javascript
// Get subcategories for a category
const subcategories = await productService.getSubcategories('yoga_mat');

// Filter products by subcategory
const products = await productService.getBySubcategory('yoga_mat_premium');
```

---

## 2. Product Attributes and Variations

### Product Attributes

Attributes provide detailed product information and can be used for filtering and searching.

**Attribute Structure:**
```javascript
{
  id: 'attr_001',
  name: 'Color',        // Attribute name
  value: 'Ocean Blue',  // Attribute value
  isVariant: false      // Whether this creates variants
}
```

### Common Attribute Types

- **Color** - Product color
- **Size** - Size (S, M, L, XL, etc.)
- **Material** - Material composition
- **Thickness** - Product thickness
- **Length** - Product length
- **Width** - Product width
- **Weight** - Product weight
- **Flavor** - Flavor for supplements
- **Scent** - Scent/fragrance

### Product Variants

Variants are product variations (e.g., different sizes/colors of the same product):

```javascript
{
  id: 'var_001',
  name: 'Small - Gray',
  sku: 'CL-001-LS-SM',
  price: 59.99,                    // Legacy price
  pricing: {                       // Multi-tier pricing
    retail: 59.99,
    wholesale: 49.99,
    member: 54.99
  },
  stockQuantity: 15,
  attributes: { size: 'S', color: 'gray' },
  barcode: '1234567890135',
  imageUrl: '/images/variant-small.jpg'
}
```

### API Usage

```javascript
// Search products by attributes
const blueProducts = await productService.searchByAttributes({
  Color: 'Blue',
  Material: 'TPE'
});

// Get all available attribute names
const attributes = await productService.getAvailableAttributes();
// Returns: ['Color', 'Size', 'Material', 'Thickness', ...]
```

---

## 3. Barcode Generation and Management

### Barcode Types Supported

1. **EAN-13** - European Article Number (13 digits)
2. **UPC-A** - Universal Product Code (12 digits)
3. **CODE128** - Alphanumeric barcode
4. **CUSTOM** - Custom format

### Barcode Generation

The system includes automatic barcode generation with validation:

```javascript
import { generateBarcode, validateBarcode } from '@/features/products/utils/barcodeUtils';

// Generate EAN-13 barcode
const barcode = generateBarcode({
  type: 'EAN13',
  prefix: '200',
  sku: 'YM-001-BLU',
  productId: 'prod_001'
});
// Returns: '2001234567891' (13 digits with check digit)

// Generate UPC-A barcode
const upcBarcode = generateBarcode({
  type: 'UPCA',
  prefix: '0',
  sku: 'PROD-123'
});
// Returns: '012345678905' (12 digits with check digit)

// Validate barcode
const isValid = validateBarcode('2001234567891', 'EAN13');
// Returns: true/false
```

### Barcode Features

- **Automatic Check Digit Calculation** - Validates barcode integrity
- **Variant Barcode Generation** - Auto-generate barcodes for variants
- **Uniqueness Checking** - Ensures no duplicate barcodes
- **Format Validation** - Validates barcode format and structure

### API Usage

```javascript
// Generate barcode via service
const barcode = await productService.generateProductBarcode({
  type: 'EAN13',
  sku: 'YM-001',
  productId: 'prod_001'
});
```

---

## 4. Pricing Tiers

### Multi-Tier Pricing Structure

Every product now supports multiple pricing tiers:

```javascript
{
  pricing: {
    retail: 49.99,      // Standard customer price
    wholesale: 39.99,   // Bulk buyer price (20% off)
    member: 44.99,      // Member discount price (10% off)
    custom: 42.00       // Optional custom tier
  }
}
```

### Pricing Tiers

1. **Retail** - Standard price for walk-in customers
2. **Wholesale** - Discounted price for bulk purchases
3. **Member** - Special price for registered members
4. **Custom** - Optional custom pricing tier

### Default Pricing Calculation

When creating a product with only a base price, the system automatically calculates:
- **Wholesale**: 85% of retail price (15% discount)
- **Member**: 92% of retail price (8% discount)

### API Usage

```javascript
// Update pricing tiers
await productService.updatePricing('prod_001', {
  retail: 49.99,
  wholesale: 39.99,
  member: 44.99
});

// Get products by pricing tier and range
const affordableForMembers = await productService.getByPricingTier(
  'member',  // tier
  0,         // min price
  50         // max price
);

// Get product price for specific tier (from store)
const memberPrice = store.getProductPriceByTier('prod_001', 'member');
```

---

## 5. Product Images and Descriptions

### Multiple Images Support

Products now support multiple images:

```javascript
{
  imageUrl: '/images/product-main.jpg',  // Primary image (backwards compatible)
  imageUrls: [                            // Multiple images
    '/images/product-main.jpg',
    '/images/product-angle1.jpg',
    '/images/product-angle2.jpg',
    '/images/product-detail.jpg'
  ]
}
```

### Enhanced Descriptions

Products support rich text descriptions with markdown formatting support.

---

## 6. Bundled Products and Kits

### Bundle Structure

Create product bundles with automatic pricing and savings calculation:

```javascript
{
  id: 'prod_013',
  name: 'Yoga Starter Kit Bundle',
  isBundle: true,
  bundle: {
    id: 'bundle_001',
    name: 'Yoga Starter Kit',
    description: 'Everything you need to start your yoga journey',
    items: [
      {
        productId: 'prod_001',  // Premium Yoga Mat
        quantity: 1,
        discount: 0             // Optional item-specific discount %
      },
      {
        productId: 'prod_003',  // Cork Blocks
        quantity: 1,
        discount: 0
      },
      {
        productId: 'prod_004',  // Yoga Strap
        quantity: 1,
        discount: 0
      }
    ],
    bundlePrice: 84.97,          // Total bundle price
    savings: 5.00                // Amount saved vs buying separately
  }
}
```

### Bundle Features

- **Automatic Price Calculation** - Calculate total from individual items
- **Savings Tracking** - Show how much customer saves
- **Inventory Tracking** - Track bundle stock based on component availability
- **Item-Level Discounts** - Apply discounts to individual bundle items
- **Multi-Tier Bundle Pricing** - Support retail/wholesale/member pricing for bundles

### API Usage

```javascript
// Get all bundle products
const bundles = await productService.getBundles();

// Calculate bundle pricing
const bundleInfo = await productService.calculateBundlePrice([
  { productId: 'prod_001', quantity: 1, discount: 0 },
  { productId: 'prod_003', quantity: 1, discount: 0 },
  { productId: 'prod_004', quantity: 1, discount: 0 }
]);

// Returns:
// {
//   items: [...],              // Detailed item info
//   totalPrice: 84.97,         // Bundle price with discounts
//   totalCost: 43.00,          // Total cost
//   regularPrice: 89.97        // Sum of individual prices
// }
```

---

## 7. Supplier Information Linkage

### Supplier Fields

Products can be linked to suppliers for better inventory management:

```javascript
{
  supplier: 'Yoga Supplies Co.',      // Supplier name
  supplierId: 'sup_001',              // Supplier ID reference
}
```

### Benefits

- Track which supplier provides each product
- Generate purchase orders by supplier
- Analyze supplier performance
- Manage multiple suppliers per category

---

## 8. Unit of Measure Conversions

### Standard Units

- `piece` - Individual items
- `set` - Sets of items
- `pack` - Packages
- `kg` - Kilograms
- `g` - Grams
- `ml` - Milliliters
- `l` - Liters
- `service` - Services
- `session` - Sessions

### Built-in Conversions

```javascript
// Weight conversions
kg ↔ g        (1 kg = 1000 g)

// Volume conversions
l ↔ ml        (1 L = 1000 ml)

// Package conversions
set → piece   (Product-specific)
pack → piece  (Product-specific)
```

### Product-Specific Conversions

Products can define custom unit conversions:

```javascript
{
  unit: 'piece',
  unitConversions: [
    {
      fromUnit: 'piece',
      toUnit: 'g',
      conversionFactor: 900,
      formula: '1 container = 900g'
    },
    {
      fromUnit: 'g',
      toUnit: 'piece',
      conversionFactor: 0.001111,
      formula: '900g = 1 container'
    }
  ]
}
```

### Conversion Utilities

```javascript
import {
  convertUnit,
  formatQuantity,
  getAvailableConversions
} from '@/features/products/utils/unitConversionUtils';

// Convert quantity between units
const grams = convertUnit(2, 'kg', 'g');
// Returns: 2000

// Format quantity with unit
const formatted = formatQuantity(1.5, 'kg', { decimals: 2 });
// Returns: "1.5 Kilogram"

// Get all available conversions for a unit
const conversions = getAvailableConversions('kg');
// Returns: [{fromUnit: 'kg', toUnit: 'g', conversionFactor: 1000, ...}]

// Convert stock for display
const display = convertStockForDisplay(100, 'g', 'kg');
// Returns: {quantity: 0.1, unit: 'kg', success: true}
```

---

## 9. Product Tags and Custom Fields

### Tags

Tags enable flexible categorization and search:

```javascript
{
  tags: ['yoga', 'mat', 'premium', 'eco-friendly', 'non-slip']
}
```

**Features:**
- Multi-tag support
- Tag-based filtering
- Tag-based search
- Popular tags tracking

### Custom Fields

Store any additional product information:

```javascript
{
  customFields: {
    weight: '1.2kg',
    dimensions: '183cm x 61cm x 0.6cm',
    warranty: '1 year',
    manufactureDate: '2024-01',
    certifications: ['Eco-Cert', 'OEKO-TEX']
  }
}
```

**Use Cases:**
- Product specifications
- Certifications
- Warranty information
- Manufacturing details
- Custom business logic

### API Usage

```javascript
// Add custom field to product
await productService.addCustomField(
  'prod_001',
  'warranty',
  '2 years'
);

// Custom fields are automatically included in product object
const product = await productService.getById('prod_001');
console.log(product.customFields.warranty); // "2 years"
```

---

## 10. Usage Examples

### Example 1: Create a Complete Product with All Features

```javascript
import { productService } from '@/features/products/services';
import { generateBarcode } from '@/features/products/utils/barcodeUtils';

// Generate barcode
const barcode = generateBarcode({
  type: 'EAN13',
  sku: 'YM-005-GRN'
});

// Create product
const product = await productService.create({
  // Basic Info
  sku: 'YM-005-GRN',
  name: 'Premium Cork Yoga Mat - Green',
  description: 'Sustainable cork yoga mat with natural rubber base',

  // Category & Subcategory
  category: 'yoga_mat',
  subcategory: 'yoga_mat_eco',

  // Pricing Tiers
  pricing: {
    retail: 79.99,
    wholesale: 64.99,
    member: 71.99
  },
  price: 79.99, // Legacy field
  cost: 40.00,

  // Inventory
  stockQuantity: 50,
  lowStockThreshold: 10,
  trackInventory: true,
  allowBackorder: false,

  // Unit & Conversions
  unit: 'piece',
  unitConversions: [],

  // Images
  imageUrls: [
    '/images/cork-mat-green-1.jpg',
    '/images/cork-mat-green-2.jpg',
    '/images/cork-mat-green-detail.jpg'
  ],

  // Barcode
  barcode: barcode,

  // Attributes
  attributes: [
    { id: 'attr_1', name: 'Material', value: 'Cork & Natural Rubber', isVariant: false },
    { id: 'attr_2', name: 'Color', value: 'Forest Green', isVariant: true },
    { id: 'attr_3', name: 'Thickness', value: '5mm', isVariant: false },
    { id: 'attr_4', name: 'Dimensions', value: '183cm x 61cm', isVariant: false }
  ],

  // Tags
  tags: ['yoga', 'mat', 'eco', 'cork', 'sustainable', 'premium'],

  // Supplier
  supplier: 'EcoYoga Supplies Ltd.',
  supplierId: 'sup_003',

  // Tax
  taxRate: 10,
  status: 'active',

  // Custom Fields
  customFields: {
    weight: '2.1kg',
    warranty: '1 year',
    madeIn: 'Portugal',
    certifications: ['Eco-Cert', 'OEKO-TEX Standard 100'],
    careInstructions: 'Wipe with damp cloth'
  }
});

console.log('Product created:', product.id);
```

### Example 2: Create a Bundle Product

```javascript
// Calculate bundle pricing first
const bundleCalc = await productService.calculateBundlePrice([
  { productId: 'prod_001', quantity: 1, discount: 0 },
  { productId: 'prod_007', quantity: 1, discount: 0 },
  { productId: 'prod_004', quantity: 1, discount: 5 } // 5% discount on strap
]);

// Create bundle with 10% overall discount
const bundlePrice = bundleCalc.totalPrice * 0.90;
const savings = bundleCalc.regularPrice - bundlePrice;

const bundle = await productService.create({
  sku: 'BDL-002-FULL',
  name: 'Complete Yoga Bundle',
  description: 'Everything you need: mat, water bottle, and strap',
  category: 'equipment',
  subcategory: 'equipment_kits',

  // Bundle pricing
  price: bundlePrice,
  pricing: {
    retail: bundlePrice,
    wholesale: bundlePrice * 0.85,
    member: bundlePrice * 0.92
  },
  cost: bundleCalc.totalCost,

  // Bundle configuration
  isBundle: true,
  bundle: {
    id: 'bundle_002',
    name: 'Complete Yoga Bundle',
    description: 'Save money with this complete set',
    items: bundleCalc.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      discount: item.discount || 0
    })),
    bundlePrice: bundlePrice,
    savings: savings
  },

  stockQuantity: 20,
  lowStockThreshold: 5,
  unit: 'set',
  trackInventory: true,

  tags: ['bundle', 'kit', 'complete', 'yoga'],
  status: 'active',
  taxRate: 10
});
```

### Example 3: Product with Variants

```javascript
const mainProduct = await productService.create({
  sku: 'CL-002-TS',
  name: 'Yoga Tank Top',
  description: 'Breathable cotton-blend tank top',
  category: 'clothing',
  subcategory: 'clothing_tops',

  price: 34.99,
  pricing: {
    retail: 34.99,
    wholesale: 27.99,
    member: 31.49
  },
  cost: 15.00,

  stockQuantity: 120, // Total across all variants
  lowStockThreshold: 30,

  // Variants
  variants: [
    {
      id: 'var_ts_001',
      name: 'Small - White',
      sku: 'CL-002-TS-SM-WHT',
      pricing: {
        retail: 34.99,
        wholesale: 27.99,
        member: 31.49
      },
      stockQuantity: 25,
      attributes: { size: 'S', color: 'white' },
      barcode: generateBarcode({ type: 'EAN13', sku: 'CL-002-TS-SM-WHT' })
    },
    {
      id: 'var_ts_002',
      name: 'Medium - White',
      sku: 'CL-002-TS-MD-WHT',
      pricing: {
        retail: 34.99,
        wholesale: 27.99,
        member: 31.49
      },
      stockQuantity: 40,
      attributes: { size: 'M', color: 'white' },
      barcode: generateBarcode({ type: 'EAN13', sku: 'CL-002-TS-MD-WHT' })
    },
    {
      id: 'var_ts_003',
      name: 'Large - White',
      sku: 'CL-002-TS-LG-WHT',
      pricing: {
        retail: 34.99,
        wholesale: 27.99,
        member: 31.49
      },
      stockQuantity: 35,
      attributes: { size: 'L', color: 'white' },
      barcode: generateBarcode({ type: 'EAN13', sku: 'CL-002-TS-LG-WHT' })
    },
    {
      id: 'var_ts_004',
      name: 'X-Large - White',
      sku: 'CL-002-TS-XL-WHT',
      pricing: {
        retail: 36.99, // Slight upcharge for XL
        wholesale: 29.59,
        member: 33.29
      },
      stockQuantity: 20,
      attributes: { size: 'XL', color: 'white' },
      barcode: generateBarcode({ type: 'EAN13', sku: 'CL-002-TS-XL-WHT' })
    }
  ],

  // Main product attributes (shared across variants)
  attributes: [
    { id: 'attr_ts_1', name: 'Material', value: '95% Cotton, 5% Spandex', isVariant: false },
    { id: 'attr_ts_2', name: 'Style', value: 'Tank Top', isVariant: false },
    { id: 'attr_ts_3', name: 'Fit', value: 'Athletic', isVariant: false }
  ],

  tags: ['clothing', 'tank-top', 'women', 'cotton', 'breathable'],
  supplier: 'ActiveWear Pro',
  taxRate: 10,
  status: 'active'
});
```

### Example 4: Using Unit Conversions

```javascript
import { convertUnit, formatQuantity } from '@/features/products/utils/unitConversionUtils';

// Create product with conversions
const proteinPowder = await productService.create({
  sku: 'SUP-003-VAN',
  name: 'Vanilla Protein - 2kg',
  category: 'supplements',
  subcategory: 'supplements_protein',

  unit: 'kg',
  unitConversions: [
    {
      fromUnit: 'kg',
      toUnit: 'g',
      conversionFactor: 1000,
      formula: '1 kg = 1000 g'
    },
    {
      fromUnit: 'kg',
      toUnit: 'piece',
      conversionFactor: 0.5,
      formula: '1 container = 2 kg'
    }
  ],

  stockQuantity: 50, // 50 kg in stock

  pricing: {
    retail: 89.99,
    wholesale: 72.99,
    member: 80.99
  },
  // ... other fields
});

// Convert stock to different units
const stockInGrams = convertUnit(50, 'kg', 'g');
console.log(`Stock in grams: ${stockInGrams}g`); // 50000g

const stockInContainers = convertUnit(50, 'kg', 'piece', proteinPowder.unitConversions);
console.log(`Stock in containers: ${stockInContainers}`); // 25 containers

// Format for display
const formatted = formatQuantity(2, 'kg', { decimals: 1 });
console.log(formatted); // "2.0 Kilogram"
```

### Example 5: Advanced Filtering and Search

```javascript
// Search by attributes
const blueMats = await productService.searchByAttributes({
  Color: 'Blue',
  Material: 'TPE'
});

// Get products by subcategory
const premiumMats = await productService.getBySubcategory('yoga_mat_premium');

// Get products in pricing range for member tier
const affordableForMembers = await productService.getByPricingTier(
  'member',
  20,     // min price
  50      // max price
);

// Get all bundles
const allBundles = await productService.getBundles();

// Complex filtering
const filteredProducts = await productService.getList({
  search: 'yoga mat',
  category: 'yoga_mat',
  status: 'active',
  minPrice: 30,
  maxPrice: 80,
  lowStock: false,
  tags: ['premium', 'eco-friendly'],
  sortBy: 'price',
  sortOrder: 'asc'
});
```

---

## File Structure

```
src/features/products/
├── components/
│   ├── ProductForm.jsx           # Product creation/edit form
│   ├── ProductList.jsx            # Product list with CRUD
│   └── ProductCard.jsx            # Product card display
├── hooks/
│   ├── useProducts.js             # Product CRUD hooks
│   └── useProductForm.js          # Form management
├── services/
│   └── productService.js          # API service layer
├── store/
│   ├── productSlice.js            # Zustand state management
│   └── productSelectors.js        # State selectors
├── types/
│   └── product.types.js           # Type definitions & constants
└── utils/
    ├── barcodeUtils.js            # Barcode generation/validation
    ├── unitConversionUtils.js     # Unit conversion utilities
    └── index.js                   # Utils exports
```

---

## API Reference

### Product Service Methods

```javascript
// Core CRUD
productService.getList(filters)          // Get products with filters
productService.getById(id)               // Get single product
productService.getBySku(sku)             // Get product by SKU
productService.create(data)              // Create new product
productService.update(id, data)          // Update product
productService.remove(id)                // Delete product

// Statistics
productService.getStats()                // Get product statistics

// Inventory
productService.adjustInventory(id, qty)  // Adjust stock
productService.getLowStockProducts()     // Get low stock items
productService.getOutOfStockProducts()   // Get out of stock items

// Bundles
productService.getBundles()              // Get all bundles
productService.calculateBundlePrice(items) // Calculate bundle pricing

// Categories & Subcategories
productService.getBySubcategory(id)      // Get products by subcategory
productService.getSubcategories(category) // Get subcategories

// Barcode
productService.generateProductBarcode(opts) // Generate barcode

// Attributes
productService.searchByAttributes(filters) // Search by attributes
productService.getAvailableAttributes()    // Get all attribute names

// Pricing
productService.getByPricingTier(tier, min, max) // Filter by price tier
productService.updatePricing(id, pricing) // Update pricing tiers

// Custom Fields
productService.addCustomField(id, name, value) // Add custom field

// Bulk Operations
productService.bulkUpdateStatus(ids, status) // Bulk status update
```

### Store Methods

```javascript
// State Mutations
store.setProducts(products)              // Set products list
store.addProduct(product)                // Add product
store.updateProduct(id, updates)         // Update product
store.removeProduct(id)                  // Remove product
store.setSelectedProduct(product)        // Set selection
store.updateProductInventory(id, qty)    // Update inventory
store.bulkUpdateProductStatus(ids, status) // Bulk update

// Getters
store.getProductById(id)                 // Get by ID
store.getProductBySku(sku)               // Get by SKU
store.getProductsByCategory(category)    // Get by category
store.getProductsBySubcategory(subcatId) // Get by subcategory
store.getActiveProducts()                // Get active products
store.getLowStockProducts()              // Get low stock
store.getOutOfStockProducts()            // Get out of stock
store.getBundleProducts()                // Get bundles
store.getProductsByAttribute(name, val)  // Get by attribute
store.getProductPriceByTier(id, tier)    // Get price by tier
```

---

## Migration Guide

### Updating Existing Products

Existing products will continue to work with the new system. The module maintains backwards compatibility:

- `price` field is maintained alongside `pricing` tiers
- Single `imageUrl` works alongside `imageUrls` array
- Products without subcategories, attributes, or bundles function normally

To upgrade existing products to use new features:

```javascript
// Example: Add pricing tiers to existing product
const product = await productService.getById('prod_001');
await productService.updatePricing(product.id, {
  retail: product.price,
  wholesale: product.price * 0.85,
  member: product.price * 0.92
});

// Example: Add attributes to existing product
await productService.update(product.id, {
  attributes: [
    { id: 'attr_1', name: 'Color', value: 'Blue', isVariant: false },
    { id: 'attr_2', name: 'Material', value: 'TPE', isVariant: false }
  ]
});

// Example: Generate barcode for existing product
const barcode = await productService.generateProductBarcode({
  sku: product.sku,
  productId: product.id
});
await productService.update(product.id, { barcode });
```

---

## Best Practices

1. **Use Subcategories** - Organize products with subcategories for better filtering
2. **Set Pricing Tiers** - Define all pricing tiers when creating products
3. **Add Attributes** - Use attributes for detailed product information
4. **Generate Barcodes** - Auto-generate barcodes for inventory tracking
5. **Use Bundles** - Create bundles for promotional pricing
6. **Link Suppliers** - Always link products to suppliers
7. **Define Conversions** - Set up unit conversions for products with multiple units
8. **Add Custom Fields** - Use custom fields for business-specific data
9. **Tag Appropriately** - Use tags for better search and categorization
10. **Multiple Images** - Provide multiple product images for better presentation

---

## Support

For questions or issues with the Product Management Module:

1. Check this documentation
2. Review the TypeScript types in `product.types.js`
3. Examine example products in `productService.js`
4. Test with the included sample data

---

**Version:** 2.0
**Last Updated:** 2024-03-10
**Author:** Product Management Team
