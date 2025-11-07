import { DataSource } from 'typeorm';
import {
  Setting,
  SettingDataType,
  SettingCategory,
} from '../../modules/settings/entities/setting.entity';

export async function seedSettings(dataSource: DataSource): Promise<void> {
  const settingRepository = dataSource.getRepository(Setting);

  const settings = [
    // General Settings
    {
      key: 'app.name',
      value: 'Yoga POS',
      dataType: SettingDataType.STRING,
      category: SettingCategory.GENERAL,
      label: 'Application Name',
      description: 'The name of the application',
      isPublic: true,
      isReadOnly: false,
    },
    {
      key: 'app.timezone',
      value: 'America/Los_Angeles',
      dataType: SettingDataType.STRING,
      category: SettingCategory.GENERAL,
      label: 'Timezone',
      description: 'Default timezone for the application',
      isPublic: true,
      isReadOnly: false,
    },
    {
      key: 'app.language',
      value: 'en',
      dataType: SettingDataType.STRING,
      category: SettingCategory.GENERAL,
      label: 'Default Language',
      description: 'Default language for the application',
      isPublic: true,
      isReadOnly: false,
    },
    {
      key: 'app.currency',
      value: 'USD',
      dataType: SettingDataType.STRING,
      category: SettingCategory.GENERAL,
      label: 'Currency',
      description: 'Default currency for transactions',
      isPublic: true,
      isReadOnly: false,
    },

    // Business Settings
    {
      key: 'business.name',
      value: 'Yoga Studio & Wellness Center',
      dataType: SettingDataType.STRING,
      category: SettingCategory.BUSINESS,
      label: 'Business Name',
      description: 'Official business name',
      isPublic: true,
      isReadOnly: false,
    },
    {
      key: 'business.email',
      value: 'contact@yogastudio.com',
      dataType: SettingDataType.STRING,
      category: SettingCategory.BUSINESS,
      label: 'Business Email',
      description: 'Primary business contact email',
      isPublic: true,
      isReadOnly: false,
    },
    {
      key: 'business.phone',
      value: '+1-555-YOGA-123',
      dataType: SettingDataType.STRING,
      category: SettingCategory.BUSINESS,
      label: 'Business Phone',
      description: 'Primary business contact phone',
      isPublic: true,
      isReadOnly: false,
    },
    {
      key: 'business.address',
      value: JSON.stringify({
        street: '123 Wellness Boulevard',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        postalCode: '90001',
      }),
      dataType: SettingDataType.JSON,
      category: SettingCategory.BUSINESS,
      label: 'Business Address',
      description: 'Physical business address',
      isPublic: true,
      isReadOnly: false,
    },
    {
      key: 'business.tax_id',
      value: '12-3456789',
      dataType: SettingDataType.STRING,
      category: SettingCategory.BUSINESS,
      label: 'Tax ID',
      description: 'Business tax identification number',
      isPublic: false,
      isReadOnly: false,
    },

    // Tax Settings
    {
      key: 'tax.default_rate',
      value: '8.25',
      dataType: SettingDataType.NUMBER,
      category: SettingCategory.TAX,
      label: 'Default Tax Rate',
      description: 'Default tax rate percentage',
      isPublic: false,
      isReadOnly: false,
    },
    {
      key: 'tax.inclusive',
      value: 'false',
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.TAX,
      label: 'Tax Inclusive Pricing',
      description: 'Whether prices include tax',
      isPublic: false,
      isReadOnly: false,
    },

    // Payment Settings
    {
      key: 'payment.methods',
      value: JSON.stringify(['cash', 'card', 'bank_transfer', 'mobile_payment']),
      dataType: SettingDataType.ARRAY,
      category: SettingCategory.PAYMENT,
      label: 'Enabled Payment Methods',
      description: 'List of enabled payment methods',
      isPublic: false,
      isReadOnly: false,
    },
    {
      key: 'payment.default_method',
      value: 'cash',
      dataType: SettingDataType.STRING,
      category: SettingCategory.PAYMENT,
      label: 'Default Payment Method',
      description: 'Default payment method for transactions',
      isPublic: false,
      isReadOnly: false,
    },

    // Notification Settings
    {
      key: 'notification.email.enabled',
      value: 'true',
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.NOTIFICATION,
      label: 'Email Notifications Enabled',
      description: 'Enable or disable email notifications',
      isPublic: false,
      isReadOnly: false,
    },
    {
      key: 'notification.sms.enabled',
      value: 'false',
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.NOTIFICATION,
      label: 'SMS Notifications Enabled',
      description: 'Enable or disable SMS notifications',
      isPublic: false,
      isReadOnly: false,
    },
    {
      key: 'notification.push.enabled',
      value: 'true',
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.NOTIFICATION,
      label: 'Push Notifications Enabled',
      description: 'Enable or disable push notifications',
      isPublic: false,
      isReadOnly: false,
    },

    // Hardware Settings
    {
      key: 'hardware.receipt_printer.enabled',
      value: 'true',
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.HARDWARE,
      label: 'Receipt Printer Enabled',
      description: 'Enable or disable receipt printer',
      isPublic: false,
      isReadOnly: false,
    },
    {
      key: 'hardware.barcode_scanner.enabled',
      value: 'true',
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.HARDWARE,
      label: 'Barcode Scanner Enabled',
      description: 'Enable or disable barcode scanner',
      isPublic: false,
      isReadOnly: false,
    },
    {
      key: 'hardware.cash_drawer.enabled',
      value: 'true',
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.HARDWARE,
      label: 'Cash Drawer Enabled',
      description: 'Enable or disable cash drawer',
      isPublic: false,
      isReadOnly: false,
    },

    // Security Settings
    {
      key: 'security.pin_length',
      value: '4',
      dataType: SettingDataType.NUMBER,
      category: SettingCategory.SECURITY,
      label: 'PIN Length',
      description: 'Required length for user PINs',
      isPublic: false,
      isReadOnly: false,
    },
    {
      key: 'security.pin_max_attempts',
      value: '3',
      dataType: SettingDataType.NUMBER,
      category: SettingCategory.SECURITY,
      label: 'PIN Max Attempts',
      description: 'Maximum PIN entry attempts before lockout',
      isPublic: false,
      isReadOnly: false,
    },
    {
      key: 'security.session_timeout',
      value: '3600',
      dataType: SettingDataType.NUMBER,
      category: SettingCategory.SECURITY,
      label: 'Session Timeout',
      description: 'Session timeout in seconds',
      isPublic: false,
      isReadOnly: false,
    },

    // Branding Settings
    {
      key: 'branding.logo_url',
      value: '/assets/logo.png',
      dataType: SettingDataType.STRING,
      category: SettingCategory.BRANDING,
      label: 'Logo URL',
      description: 'URL to the company logo',
      isPublic: true,
      isReadOnly: false,
    },
    {
      key: 'branding.primary_color',
      value: '#6B46C1',
      dataType: SettingDataType.STRING,
      category: SettingCategory.BRANDING,
      label: 'Primary Color',
      description: 'Primary brand color (hex)',
      isPublic: true,
      isReadOnly: false,
    },
    {
      key: 'branding.secondary_color',
      value: '#805AD5',
      dataType: SettingDataType.STRING,
      category: SettingCategory.BRANDING,
      label: 'Secondary Color',
      description: 'Secondary brand color (hex)',
      isPublic: true,
      isReadOnly: false,
    },

    // Integration Settings
    {
      key: 'integration.accounting.enabled',
      value: 'false',
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.INTEGRATION,
      label: 'Accounting Integration Enabled',
      description: 'Enable or disable accounting software integration',
      isPublic: false,
      isReadOnly: false,
    },
    {
      key: 'integration.email.provider',
      value: 'smtp',
      dataType: SettingDataType.STRING,
      category: SettingCategory.INTEGRATION,
      label: 'Email Provider',
      description: 'Email service provider',
      isPublic: false,
      isReadOnly: false,
    },
  ];

  for (const settingData of settings) {
    const existingSetting = await settingRepository.findOne({
      where: { key: settingData.key },
    });

    if (!existingSetting) {
      const setting = settingRepository.create(settingData);
      await settingRepository.save(setting);
      console.log(`✓ Created setting: ${settingData.key}`);
    } else {
      console.log(`- Setting already exists: ${settingData.key}`);
    }
  }
}
