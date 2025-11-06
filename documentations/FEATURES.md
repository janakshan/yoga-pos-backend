# Yoga POS - Advanced Features Documentation

This document describes the advanced features implemented in the Yoga POS system, including multi-language support, multi-currency, custom branding, hardware integration, notification system, and backup & recovery.

## Table of Contents

1. [Multi-Language Support](#multi-language-support)
2. [Multi-Currency Support](#multi-currency-support)
3. [Custom Branding](#custom-branding)
4. [Hardware Support](#hardware-support)
5. [Notification System](#notification-system)
6. [Backup & Recovery System](#backup--recovery-system)

---

## Multi-Language Support

### Overview
The POS system now supports multiple languages with easy switching between English, Spanish, and French.

### Features
- **Supported Languages:**
  - English (en)
  - Spanish (es)
  - French (fr)

- **Translation Coverage:**
  - All UI components
  - Navigation menus
  - POS interface
  - Reports and receipts
  - Error messages and notifications
  - Settings pages

### Implementation
- Built with `i18next` and `react-i18next`
- Translation files located in `/src/i18n/locales/`
- Language preference persisted in localStorage
- Automatic language detection on first visit

### Usage
```javascript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();

  return <button>{t('common.save')}</button>;
};
```

### Adding New Languages
1. Create a new translation file in `/src/i18n/locales/` (e.g., `de.json`)
2. Copy structure from existing translation files
3. Import in `/src/i18n/config.js`
4. Add language option in Settings > Localization

---

## Multi-Currency Support

### Overview
Support for multiple currencies with automatic conversion and flexible exchange rate management.

### Features
- **Pre-configured Currencies:**
  - USD (US Dollar)
  - EUR (Euro)
  - GBP (British Pound)
  - JPY (Japanese Yen)
  - CAD (Canadian Dollar)
  - AUD (Australian Dollar)
  - INR (Indian Rupee)
  - MXN (Mexican Peso)

- **Capabilities:**
  - Set base currency
  - Configure exchange rates
  - Automatic currency conversion
  - Multi-currency transactions
  - Locale-specific formatting

### Implementation

#### Currency Utilities (`/src/utils/currency.js`)

```javascript
import { formatCurrency, convertCurrency } from './utils/currency';

// Format currency with locale
const formatted = formatCurrency(100, 'USD', 'en-US');
// Output: "$100.00"

// Convert between currencies
const converted = convertCurrency(100, 'USD', 'EUR', currencies);
// Output: 92.00 (based on exchange rate)
```

#### Using Multi-Currency in Components

```javascript
const { currency, currencies, enableMultiCurrency } = useStore();

// Get current currency symbol
const symbol = getCurrencySymbol(currency);

// Format price
const price = formatCurrency(amount, currency, locale);
```

### Configuration
Navigate to **Settings > Localization** to:
- Enable/disable multi-currency support
- Select base currency
- Update exchange rates
- Choose display currency

---

## Custom Branding

### Overview
Customize the appearance of your POS system with business branding, logos, and colors.

### Features

#### Business Information
- Business name
- Address and contact details
- Email and website
- Tax ID
- Logo upload

#### Brand Colors
- Primary color (main brand color)
- Secondary color (accents and highlights)
- Accent color (additional accents)
- Custom CSS support

#### Receipt Customization
- Custom header text
- Custom footer text
- Logo on receipts
- Branded colors

### Implementation

#### Branding Settings (`/src/features/settings/components/BrandingSettings.jsx`)

Access via: **Settings > Branding**

#### Using Branding in Components

```javascript
const { branding, businessInfo } = useStore();

// Apply brand colors
<div style={{ color: branding.primaryColor }}>
  {businessInfo.name}
</div>

// Display logo
{businessInfo.logo && (
  <img src={businessInfo.logo} alt="Logo" />
)}
```

#### Branded Receipt Component

```javascript
import BrandedReceipt from './components/receipts/BrandedReceipt';

<BrandedReceipt transaction={transaction} />
```

---

## Hardware Support

### Overview
Integration with POS hardware devices for professional retail operations.

### Supported Devices

#### 1. Receipt Printer

**Features:**
- ESC/POS protocol support
- Thermal, inkjet, and laser printers
- USB, Network, and Bluetooth connectivity
- Auto-cut paper option
- Custom paper width configuration
- Character set selection

**Configuration:**
Navigate to **Settings > Hardware > Receipt Printer**

**Connection Types:**
- **USB:** Direct USB connection using Web USB API
- **Network:** TCP/IP connection (requires IP address and port)
- **Bluetooth:** Wireless connection using Web Bluetooth API

**Usage:**
```javascript
import { printerService } from './services/hardware';

// Connect to printer
await printerService.connect(settings);

// Print receipt
await printerService.printReceipt(receiptData);

// Test printer
await printerService.testPrint();
```

**ESC/POS Commands:**
The printer service generates ESC/POS commands for:
- Text formatting (bold, size, alignment)
- Paper cutting
- Cash drawer opening
- Barcode printing

---

#### 2. Barcode Scanner

**Features:**
- USB and Bluetooth scanners
- Keyboard wedge support
- Serial port connection
- Configurable prefix/suffix
- Auto-submit on scan
- Barcode format validation

**Configuration:**
Navigate to **Settings > Hardware > Barcode Scanner**

**Supported Formats:**
- EAN-13, EAN-8
- UPC-A, UPC-E
- CODE-39, CODE-128
- QR Codes

**Usage:**
```javascript
import { scannerService } from './services/hardware';

// Initialize scanner with callback
scannerService.initialize(settings, (barcode) => {
  console.log('Scanned:', barcode);
  // Add product to cart
});

// Validate barcode
const isValid = scannerService.validateBarcode(code, 'EAN13');
```

---

#### 3. Cash Drawer

**Features:**
- Printer-connected drawers
- Direct serial/USB connection
- Configurable pulse width
- Auto-open on sale option
- Manual open command

**Configuration:**
Navigate to **Settings > Hardware > Cash Drawer**

**Connection Types:**
- **Via Printer:** Uses printer's cash drawer port
- **Serial:** Direct serial connection
- **USB:** Direct USB connection

**Usage:**
```javascript
import { cashDrawerService } from './services/hardware';

// Initialize drawer
await cashDrawerService.initialize(settings, printerService);

// Open drawer
await cashDrawerService.open();

// Check auto-open setting
if (cashDrawerService.shouldOpenOnSale()) {
  await cashDrawerService.open();
}
```

---

#### 4. Customer Display Pole

**Features:**
- 2-line or 4-line displays
- Configurable columns (typically 20)
- Serial, USB, or Network connection
- Real-time price display
- Welcome and thank you messages

**Configuration:**
Navigate to **Settings > Hardware > Customer Display**

**Display Types:**
- **Pole Display:** Traditional 2-line VFD/LCD
- **Tablet:** Secondary tablet as customer display
- **Monitor:** Additional monitor

**Usage:**
```javascript
import { customerDisplayService } from './services/hardware';

// Initialize display
await customerDisplayService.initialize(settings);

// Display total
await customerDisplayService.displayTotal(49.99, '$');

// Display item
await customerDisplayService.displayItem('Yoga Mat', 29.99, '$');

// Show welcome message
await customerDisplayService.displayWelcome();

// Show thank you message
await customerDisplayService.displayThankYou();

// Clear display
await customerDisplayService.clearDisplay();
```

---

## Browser Compatibility

### Web APIs Used

The hardware features use modern Web APIs:

- **Web USB API:** For USB device communication
- **Web Serial API:** For serial port communication
- **Web Bluetooth API:** For Bluetooth device communication

### Supported Browsers

| Browser | USB | Serial | Bluetooth |
|---------|-----|--------|-----------|
| Chrome/Edge (v89+) | ✅ | ✅ | ✅ |
| Opera (v76+) | ✅ | ✅ | ✅ |
| Firefox | ❌ | ❌ | Limited |
| Safari | ❌ | ❌ | ❌ |

**Note:** For best hardware support, use Chromium-based browsers (Chrome, Edge, Opera).

### Fallback Options

When Web APIs are unavailable:
- **Receipt Printing:** Falls back to browser print dialog
- **Barcode Scanning:** Manual entry option available
- **Cash Drawer:** Manual operation
- **Customer Display:** On-screen display option

---

## Configuration Files

### Settings Store (`/src/store/slices/settingsSlice.js`)

All settings are persisted in localStorage under the key `yoga-pos-storage`.

### Hardware Services

Located in `/src/services/hardware/`:
- `printerService.js` - Receipt printer
- `scannerService.js` - Barcode scanner
- `cashDrawerService.js` - Cash drawer
- `customerDisplayService.js` - Customer display

### Translation Files

Located in `/src/i18n/locales/`:
- `en.json` - English translations
- `es.json` - Spanish translations
- `fr.json` - French translations

---

## Integration Examples

### Complete POS Transaction with Hardware

```javascript
import hardwareServices from './services/hardware';
import { useStore } from './store';

const processSale = async (transaction) => {
  const { hardware, businessInfo, branding } = useStore();

  // 1. Display total on customer display
  if (hardware.customerDisplay.enabled) {
    await hardwareServices.customerDisplay.displayTotal(
      transaction.total,
      currencySymbol
    );
  }

  // 2. Process payment
  const result = await processPayment(transaction);

  if (result.success) {
    // 3. Print receipt
    if (hardware.receiptPrinter.enabled) {
      const receiptData = formatReceiptData(transaction, businessInfo);
      await hardwareServices.printer.printReceipt(receiptData);
    }

    // 4. Open cash drawer (if cash payment)
    if (transaction.paymentMethod === 'cash' &&
        hardware.cashDrawer.enabled &&
        hardware.cashDrawer.openOnSale) {
      await hardwareServices.cashDrawer.open();
    }

    // 5. Show thank you message
    if (hardware.customerDisplay.enabled) {
      await hardwareServices.customerDisplay.displayThankYou();
    }
  }
};
```

### Barcode Scanning Integration

```javascript
import { scannerService } from './services/hardware';
import { useStore } from './store';

const setupScanner = () => {
  const { hardware } = useStore();

  if (hardware.barcodeScanner.enabled) {
    scannerService.initialize(hardware.barcodeScanner, async (barcode) => {
      // Find product by barcode
      const product = await findProductByBarcode(barcode);

      if (product) {
        // Add to cart
        addToCart(product);

        // Display on customer display
        await customerDisplayService.displayItem(
          product.name,
          product.price,
          currencySymbol
        );
      } else {
        toast.error('Product not found');
      }
    });
  }
};
```

---

## Troubleshooting

### Hardware Connection Issues

**Problem:** Device not connecting

**Solutions:**
1. Check device is powered on and cables connected
2. Verify correct connection type selected in settings
3. For USB devices, check browser permissions
4. For network devices, verify IP address and port
5. Try test connection button in settings

**Problem:** Printer not printing

**Solutions:**
1. Check paper is loaded correctly
2. Verify printer is not in error state
3. Test printer using test print button
4. Check ESC/POS command compatibility
5. Try fallback browser print option

**Problem:** Scanner not detecting barcodes

**Solutions:**
1. Check scanner is connected and enabled
2. Verify barcode format is supported
3. Test with known good barcode
4. Check prefix/suffix settings
5. Ensure page has focus for keyboard input

### Language/Translation Issues

**Problem:** Text not translating

**Solutions:**
1. Check language is selected in Settings > Localization
2. Verify translation key exists in language file
3. Clear browser cache and localStorage
4. Check console for i18next errors

### Currency Issues

**Problem:** Wrong currency symbol displaying

**Solutions:**
1. Verify currency selected in Settings > Localization
2. Check exchange rates are configured correctly
3. Clear localStorage and reconfigure
4. Ensure locale matches currency (e.g., en-US for USD)

---

## Security Considerations

### Hardware Access

Web APIs require user permission:
- USB: User must explicitly select device
- Serial: Port access requires user permission
- Bluetooth: Device pairing requires user consent

### Data Storage

- All settings stored in browser localStorage
- No sensitive data transmitted to external servers
- Hardware configurations remain local

### Best Practices

1. Always use HTTPS in production
2. Regularly update exchange rates
3. Backup business information and branding
4. Test hardware on different browsers
5. Keep translation files updated

---

## Future Enhancements

Planned features for future releases:

1. **Additional Languages:** German, Italian, Portuguese, Chinese
2. **More Currencies:** Cryptocurrency support
3. **Advanced Branding:** Custom themes, multiple locations
4. **Hardware Expansion:**
   - Payment terminals
   - Kitchen printers
   - Label printers
   - Scales
   - Signature pads
5. **Cloud Sync:** Sync settings across devices
6. **Mobile App:** Native mobile POS app

---

## Support

For issues or questions:
- Check documentation in `/docs/`
- Review code examples
- Test hardware connections
- Check browser console for errors
- Verify browser compatibility

---

## Notification System

### Overview
Multi-channel notification system supporting Email, SMS, and WhatsApp for automated customer communication and business alerts.

### Features

#### Notification Channels
- **Email** - Email notifications via SMTP
- **SMS** - SMS notifications via Twilio/similar services
- **WhatsApp** - WhatsApp Business API integration
- **In-App** - Toast and sound notifications

#### Event-Based Triggers
Automatic notifications for:
- **Sale Confirmation** - Order/receipt sent to customers
- **Booking Confirmation** - Class/appointment confirmations
- **Low Stock Alerts** - Inventory alerts to staff
- **Payment Reminders** - Outstanding invoice reminders
- **Membership Expiry** - Membership renewal notifications
- **Return Processed** - Return/refund confirmations
- **Daily Summary** - End-of-day sales summary

#### Notification Templates
Pre-built templates with variable substitution:
```javascript
{
  subject: 'Order Confirmation - #{orderNumber}',
  message: 'Thank you for your purchase! Order #{orderNumber} for #{total} has been confirmed.',
  variables: ['orderNumber', 'total', 'customerName', 'items']
}
```

### Implementation

#### Service Layer (`/src/services/notification/`)

**Core Services:**
- `notificationService.js` - Main notification orchestration
- `emailNotificationProvider.js` - Email sending
- `smsNotificationProvider.js` - SMS sending
- `whatsappNotificationProvider.js` - WhatsApp sending

**Usage:**
```javascript
import { notificationService } from './services/notification';

// Send notification
await notificationService.send({
  userId: 'user_123',
  type: 'email',
  channel: 'email',
  eventType: 'sale_confirmation',
  subject: 'Your order is confirmed',
  message: 'Thank you for your purchase!',
  metadata: {
    orderId: 'ORD-123',
    total: 49.99
  }
});

// Get notification history
const history = await notificationService.getHistory({
  userId: 'user_123',
  type: 'email',
  startDate: '2025-01-01',
  endDate: '2025-11-06'
});

// Get notification statistics
const stats = await notificationService.getStats();
```

#### Store Integration

**Notification Slice** (`/src/store/slices/notificationSlice.js`):

```javascript
const { notifications, stats, preferences, updatePreferences } = useStore();

// Update notification preferences
updatePreferences({
  emailEnabled: true,
  smsEnabled: false,
  whatsappEnabled: true,
  lowStockAlerts: true,
  orderNotifications: true,
  soundEnabled: true
});
```

#### Configuration

Navigate to **Settings > Notifications** to:
- Enable/disable notification channels
- Configure SMTP settings for email
- Set up SMS provider (Twilio)
- Configure WhatsApp Business API
- Customize notification templates
- Set up event triggers
- Manage notification preferences per user
- View notification history and statistics

### Notification Queue

Features a queue system for reliable delivery:
- Retry failed notifications (up to 3 attempts)
- Track delivery status
- Queue management
- Priority-based sending

### Testing

Mock implementations included for development:
- Email simulation with console logs
- SMS simulation
- WhatsApp simulation
- Notification delivery tracking

---

## Backup & Recovery System

### Overview
Comprehensive backup and recovery system with support for local and cloud storage, automated scheduling, encryption, and one-click restore.

### Features

#### Backup Types
1. **Full Backup** - Complete system backup including all data
2. **Incremental Backup** - Only changed data since last backup
3. **Selective Backup** - Choose specific data to backup

#### Storage Options
- **Local Backup** - Download as JSON file to local machine
- **Cloud Backup** - Upload to cloud storage:
  - Google Drive
  - Dropbox
  - AWS S3 (S3-compatible storage)

#### Security
- **AES-256-GCM Encryption** - Military-grade encryption for backups
- **Password Protection** - Optional password for backup files
- **Encrypted Cloud Storage** - Backups encrypted before upload

### Implementation

#### Backup Service (`/src/services/backup/backupService.js`)

**Core Functions:**

```javascript
import { backupService } from './services/backup';

// Create manual backup
const backup = await backupService.createBackup({
  type: 'full',
  description: 'Manual backup before system update',
  encrypted: true,
  password: 'secure-password'
});

// Download backup locally
await backupService.downloadBackup(backup.id, backup.filename);

// Upload to cloud
await backupService.uploadToCloud(backup, {
  provider: 'google_drive', // 'dropbox', 'aws_s3'
  credentials: {
    // Provider-specific credentials
  }
});

// Restore from backup
await backupService.restoreBackup(backupId, {
  createPreRestoreBackup: true // Safety backup before restore
});

// Get backup history
const history = await backupService.getBackupHistory();

// Get backup statistics
const stats = await backupService.getBackupStats();

// Delete old backups
await backupService.cleanupOldBackups(30); // Keep last 30 days
```

#### Auto-Backup Scheduler (`/src/services/backup/autoBackupScheduler.js`)

**Automated Backup Features:**
- **Frequency Options:** Hourly, Daily, Weekly, Monthly
- **Scheduled Time:** Set specific time for daily/weekly/monthly backups
- **Auto-cleanup:** Automatically delete backups older than retention period
- **Cloud Auto-upload:** Automatically upload to configured cloud provider
- **Backup Verification:** Verify backup integrity after creation

**Usage:**
```javascript
import { autoBackupScheduler } from './services/backup';

// Start auto-backup
await autoBackupScheduler.startAutoBackup({
  frequency: 'daily', // 'hourly', 'weekly', 'monthly'
  time: '02:00', // Time for daily/weekly/monthly (24-hour format)
  enabled: true,
  cloudProvider: 'google_drive',
  retentionDays: 30,
  encrypted: true
});

// Stop auto-backup
await autoBackupScheduler.stopAutoBackup();

// Get backup status
const status = await autoBackupScheduler.getBackupStatus();
```

#### Store Integration

**Backup Slice** (`/src/store/slices/backupSlice.js`):

```javascript
const {
  backups,
  backupSettings,
  backupStatus,
  updateBackupSettings,
  addBackup,
  removeBackup
} = useStore();

// Update backup settings
updateBackupSettings({
  autoBackup: {
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    cloudProvider: 'google_drive',
    retentionDays: 30
  },
  encryption: {
    enabled: true,
    password: 'encrypted-password'
  },
  cloudProviders: {
    googleDrive: {
      enabled: true,
      credentials: {
        // OAuth credentials
      }
    },
    dropbox: {
      enabled: false
    },
    awsS3: {
      enabled: false
    }
  }
});
```

#### Configuration

Navigate to **Settings > Backup & Cloud** to:
- Enable/disable auto-backup
- Set backup frequency and time
- Configure cloud storage providers
- Set encryption password
- View backup history (last 50 backups)
- Restore from backup
- Download/upload backups
- Configure retention policy
- View backup statistics

### Backup Data Structure

Backups include:
```json
{
  "metadata": {
    "id": "backup_20251106_140530",
    "version": "2.0",
    "timestamp": "2025-11-06T14:05:30.000Z",
    "type": "full",
    "encrypted": true,
    "size": 1254367
  },
  "data": {
    "products": [...],
    "customers": [...],
    "transactions": [...],
    "inventory": [...],
    "invoices": [...],
    "payments": [...],
    "users": [...],
    "settings": {...},
    // ... all other data
  }
}
```

### Recovery Process

1. **Pre-Restore Backup** - Automatically creates safety backup of current state
2. **Validation** - Verifies backup file integrity and version compatibility
3. **Decryption** - Decrypts backup if encrypted
4. **Data Restore** - Restores all data to state management and storage
5. **Verification** - Verifies restored data integrity
6. **Reload** - Refreshes application to reflect restored state

### Backup Best Practices

1. **Regular Backups** - Enable daily auto-backup at minimum
2. **Cloud Storage** - Always enable cloud backup for disaster recovery
3. **Encryption** - Always encrypt backups containing sensitive data
4. **Retention Policy** - Keep at least 30 days of backup history
5. **Test Restore** - Periodically test backup restoration
6. **Pre-Update Backup** - Always backup before major updates
7. **Multiple Locations** - Store backups in multiple cloud providers

### Browser Compatibility

**Backup Features:**
- Local Download: All modern browsers
- File Upload: All modern browsers
- Cloud Integration: Requires API keys/OAuth

**Encryption:**
- Uses Web Crypto API (supported in all modern browsers)
- AES-256-GCM encryption standard
- PBKDF2 key derivation

---

## License

Copyright © 2025 Yoga POS. All rights reserved.

**Version**: 2.0
**Last Updated**: 2025-11-06
