# Printing System Documentation

## Overview

The Yoga POS system now includes a comprehensive printing solution for receipts, invoices, and reports. The printing system is optimized for both thermal printers and standard printers, with customizable templates.

## Features

- ✅ **Print-Optimized CSS** - Automatically hides UI elements when printing
- ✅ **Customizable Templates** - Business branding, logos, and custom headers/footers
- ✅ **Multiple Document Types** - Receipts, invoices, and reports
- ✅ **Responsive Design** - Works on all screen sizes
- ✅ **Professional Formatting** - Clean, organized print layouts
- ✅ **Print Preview** - View before printing with print modals

## Components

### 1. Print Styles (`/src/styles/print.css`)

The print stylesheet automatically:
- Hides navigation, sidebars, and buttons
- Optimizes page margins for printing
- Formats receipts for thermal printers (80mm width)
- Formats invoices and reports for A4 paper
- Removes shadows and effects for better print quality

### 2. BrandedReceipt Component

**Location:** `/src/components/receipts/BrandedReceipt.jsx`

**Features:**
- Business logo and information
- Receipt number and date
- Customer information
- Itemized list with quantities and prices
- Tax and discount breakdown
- Payment method and change
- Custom header and footer messages
- Barcode generation

**Usage:**
```jsx
import BrandedReceipt from '@/components/receipts/BrandedReceipt';

<BrandedReceipt transaction={transactionData} />
```

**Transaction Data Structure:**
```javascript
{
  receiptNumber: "REC-001",
  date: new Date(),
  cashier: "John Doe",
  customer: "Jane Smith",
  items: [
    { name: "Product", quantity: 2, price: 10.00 }
  ],
  subtotal: 20.00,
  discount: 2.00,
  tax: 1.80,
  total: 19.80,
  paymentMethod: "cash",
  amountPaid: 20.00,
  change: 0.20
}
```

### 3. PrintableInvoice Component

**Location:** `/src/components/invoices/PrintableInvoice.jsx`

**Features:**
- Professional invoice layout
- Company and customer billing information
- Shipping address support
- Detailed item table with descriptions
- Subtotal, discount, tax calculations
- Payment information
- Notes and terms & conditions
- Status badges (Draft, Sent, Paid, Overdue)

**Usage:**
```jsx
import PrintableInvoice from '@/components/invoices/PrintableInvoice';

<PrintableInvoice invoice={invoiceData} />
```

**Invoice Data Structure:**
```javascript
{
  invoiceNumber: "INV-001",
  date: new Date(),
  dueDate: new Date(),
  status: "sent",
  customer: {
    name: "Company Name",
    address: "123 Street",
    email: "customer@example.com",
    phone: "555-1234",
    taxId: "TAX123"
  },
  items: [
    {
      name: "Service/Product",
      description: "Detailed description",
      sku: "SKU-001",
      quantity: 1,
      price: 100.00
    }
  ],
  discount: 10.00,
  tax: 9.00,
  taxRate: 10,
  notes: "Payment terms...",
  terms: "Terms and conditions...",
  paymentMethod: "Bank Transfer",
  amountPaid: 50.00
}
```

### 4. PrintableReport Component

**Location:** `/src/components/reports/PrintableReport.jsx`

**Features:**
- Business header with logo
- Report metadata (date range, type, status)
- Statistics cards
- Data tables with automatic formatting
- Summary sections
- Professional footer

**Usage:**
```jsx
import PrintableReport from '@/components/reports/PrintableReport';

<PrintableReport report={reportData} />
```

**Report Data Structure:**
```javascript
{
  id: "REP-001",
  title: "Monthly Sales Report",
  description: "Sales summary for January 2024",
  type: "sales",
  status: "generated",
  dateRange: {
    from: "2024-01-01",
    to: "2024-01-31"
  },
  stats: {
    totalRevenue: 50000,
    totalTransactions: 150,
    averageTransaction: 333.33
  },
  data: [
    { date: "2024-01-01", sales: 1000, transactions: 5 }
  ],
  summary: "Overall positive trend...",
  notes: "Additional comments..."
}
```

### 5. PrintModal Component

**Location:** `/src/components/common/PrintModal.jsx`

A reusable modal for displaying printable content with print and close buttons.

**Usage:**
```jsx
import PrintModal from '@/components/common/PrintModal';

const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

<PrintModal
  isOpen={isPrintModalOpen}
  onClose={() => setIsPrintModalOpen(false)}
  title="Print Document"
  onPrint={() => window.print()}
>
  <PrintableComponent />
</PrintModal>
```

### 6. usePrint Hook

**Location:** `/src/hooks/usePrint.js`

A custom hook for managing print state and operations.

**Usage:**
```jsx
import { usePrint } from '@/hooks/usePrint';

const {
  isPrintModalOpen,
  printDocument,
  openPrintModal,
  closePrintModal,
  handlePrint,
  printDirectly
} = usePrint();

// Open print modal with document
openPrintModal(documentData);

// Print directly without modal
printDirectly();
```

## Implementation Examples

### Adding Print to POS Receipt

The CheckoutPanel already includes print functionality:

1. After completing a sale, a receipt is generated
2. Click "Print Receipt" button
3. The BrandedReceipt component displays in a hidden modal
4. `window.print()` opens the print dialog
5. Only the receipt content is visible in print preview

### Adding Print to Invoices

To add print functionality to invoice pages:

```jsx
import { useState } from 'react';
import PrintModal from '@/components/common/PrintModal';
import PrintableInvoice from '@/components/invoices/PrintableInvoice';

function InvoicePage({ invoice }) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div>
      <button onClick={handlePrint}>
        Print Invoice
      </button>

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Print Invoice"
        onPrint={() => window.print()}
      >
        <PrintableInvoice invoice={invoice} />
      </PrintModal>
    </div>
  );
}
```

### Adding Print to Reports

The ReportViewer component includes print functionality:

```jsx
// Already implemented in ReportViewer.jsx
<button onClick={handlePrint}>
  <Printer /> Print
</button>

<PrintModal isOpen={isPrintModalOpen} ...>
  <PrintableReport report={report} />
</PrintModal>
```

## Customization

### Business Information

Update business information in the store settings:

```javascript
{
  businessInfo: {
    name: "Your Business Name",
    address: "123 Business Street",
    phone: "555-1234",
    email: "info@business.com",
    website: "www.business.com",
    taxId: "TAX-123456",
    logo: "/path/to/logo.png"
  }
}
```

### Branding

Customize colors in store settings:

```javascript
{
  branding: {
    primaryColor: "#0ea5e9",
    secondaryColor: "#a855f7",
    accentColor: "#10b981"
  }
}
```

### Receipt Header/Footer

Add custom messages:

```javascript
{
  receiptHeader: "Thank you for your business!",
  receiptFooter: "Follow us on social media @yourbusiness"
}
```

### Print Styles

Modify `/src/styles/print.css` to customize:

- Page margins
- Receipt width (for thermal printers)
- Font sizes and families
- Colors and backgrounds
- Table styles

## Browser Print Settings

For best results, configure browser print settings:

1. **Paper Size:**
   - Receipts: 80mm thermal paper
   - Invoices/Reports: A4 or Letter

2. **Margins:**
   - Minimum margins or None

3. **Background Graphics:**
   - Enable for colored elements

4. **Scale:**
   - Default (100%)

## Thermal Printer Integration

The system includes support for thermal printers via the printerService:

**Location:** `/src/services/hardware/printerService.js`

**Supported Connections:**
- USB (Web USB API)
- Network (HTTP/IP)
- Bluetooth (Web Bluetooth API)

**Usage:**
```javascript
import { printerService } from '@/services/hardware/printerService';

// Connect to printer
await printerService.connect('usb');

// Print receipt
await printerService.printReceipt(transactionData);

// Or fallback to browser print
await printerService.browserPrint(transactionData);
```

## Troubleshooting

### Print shows full webpage

**Solution:** Ensure the component has the correct class:
- Receipts: `printable-receipt`
- Invoices: `printable-invoice`
- Reports: `printable-report`

### Styles not applied

**Solution:** Check that `/src/styles/print.css` is imported in `/src/index.css`:
```css
@import "./styles/print.css";
```

### Content cut off

**Solution:** Adjust page margins in print.css:
```css
@page {
  margin: 0.5cm;
}
```

### Images not printing

**Solution:** Enable "Background Graphics" in browser print settings.

## Best Practices

1. **Test on multiple browsers** - Chrome, Firefox, Safari, Edge
2. **Test with different paper sizes** - A4, Letter, Thermal
3. **Use print preview** - Always preview before printing
4. **Keep templates simple** - Avoid complex layouts for thermal printers
5. **Optimize images** - Compress logos and images
6. **Use web-safe fonts** - Ensure fonts are available on all systems
7. **Provide fallbacks** - Always offer browser print as alternative

## Future Enhancements

- [ ] PDF generation and download
- [ ] Email receipts/invoices
- [ ] Custom template builder
- [ ] Multi-language support
- [ ] Print queue management
- [ ] Batch printing
- [ ] Print history and logs
- [ ] Mobile printer support

## Support

For issues or questions:
1. Check browser console for errors
2. Verify data structures match documentation
3. Test with browser print preview
4. Check print.css is loaded
5. Contact development team

---

Last Updated: 2024
Version: 1.0.0
