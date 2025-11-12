import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Setting, SettingCategory, BusinessType, SettingDataType } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateSettingValueDto } from './dto/update-setting-value.dto';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';
import {
  RestaurantSettingsDto,
  UpdateBusinessTypeDto,
  UpdateRestaurantSettingsDto,
  RestaurantConfigurationDto,
} from './dto/restaurant-settings.dto';
import { DEFAULT_RESTAURANT_SETTINGS } from '../restaurant/common/restaurant.constants';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async create(createSettingDto: CreateSettingDto): Promise<Setting> {
    // Check if setting with key already exists
    const existing = await this.settingsRepository.findOne({
      where: { key: createSettingDto.key },
    });

    if (existing) {
      throw new BadRequestException(
        `Setting with key "${createSettingDto.key}" already exists`,
      );
    }

    const setting = this.settingsRepository.create(createSettingDto);
    return this.settingsRepository.save(setting);
  }

  async findAll(category?: SettingCategory): Promise<Setting[]> {
    const where: any = {};

    if (category) {
      where.category = category;
    }

    return this.settingsRepository.find({
      where,
      order: { category: 'ASC', key: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with ID ${id} not found`);
    }

    return setting;
  }

  async findByKey(key: string): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    return setting;
  }

  async update(id: string, updateSettingDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findOne(id);

    if (setting.isReadOnly) {
      throw new BadRequestException(
        'Cannot update read-only setting',
      );
    }

    Object.assign(setting, updateSettingDto);
    return this.settingsRepository.save(setting);
  }

  async updateByKey(
    key: string,
    updateValueDto: UpdateSettingValueDto,
  ): Promise<Setting> {
    const setting = await this.findByKey(key);

    if (setting.isReadOnly) {
      throw new BadRequestException(
        'Cannot update read-only setting',
      );
    }

    setting.value = updateValueDto.value;
    return this.settingsRepository.save(setting);
  }

  async bulkUpdate(
    bulkUpdateDto: BulkUpdateSettingsDto,
  ): Promise<{ updated: number; settings: Setting[] }> {
    const keys = Object.keys(bulkUpdateDto.settings);

    // Find all settings with these keys
    const settings = await this.settingsRepository.find({
      where: { key: In(keys) },
    });

    if (settings.length === 0) {
      throw new NotFoundException('No settings found with the provided keys');
    }

    // Check for read-only settings
    const readOnlySettings = settings.filter((s) => s.isReadOnly);
    if (readOnlySettings.length > 0) {
      throw new BadRequestException(
        `Cannot update read-only settings: ${readOnlySettings.map((s) => s.key).join(', ')}`,
      );
    }

    // Update settings
    const updatedSettings: Setting[] = [];
    for (const setting of settings) {
      setting.value = bulkUpdateDto.settings[setting.key];
      const updated = await this.settingsRepository.save(setting);
      updatedSettings.push(updated);
    }

    return {
      updated: updatedSettings.length,
      settings: updatedSettings,
    };
  }

  async remove(id: string): Promise<void> {
    const setting = await this.findOne(id);

    if (setting.isReadOnly) {
      throw new BadRequestException(
        'Cannot delete read-only setting',
      );
    }

    await this.settingsRepository.remove(setting);
  }

  async getByCategory(category: SettingCategory): Promise<Setting[]> {
    return this.settingsRepository.find({
      where: { category },
      order: { key: 'ASC' },
    });
  }

  async getAllAsObject(): Promise<Record<string, any>> {
    const settings = await this.settingsRepository.find();
    const result: Record<string, any> = {};

    for (const setting of settings) {
      // Parse value based on data type
      let parsedValue: any = setting.value;

      try {
        switch (setting.dataType) {
          case 'number':
            parsedValue = parseFloat(setting.value);
            break;
          case 'boolean':
            parsedValue = setting.value === 'true';
            break;
          case 'json':
            parsedValue = JSON.parse(setting.value);
            break;
          case 'array':
            parsedValue = JSON.parse(setting.value);
            break;
          default:
            parsedValue = setting.value;
        }
      } catch (error) {
        // If parsing fails, keep as string
        parsedValue = setting.value;
      }

      result[setting.key] = parsedValue;
    }

    return result;
  }

  async initializeDefaults(): Promise<void> {
    // Initialize default settings if they don't exist
    const defaults = [
      {
        key: 'business_name',
        value: 'Yoga POS',
        dataType: 'string',
        category: SettingCategory.BUSINESS,
        label: 'Business Name',
        description: 'The name of your business',
      },
      {
        key: 'currency',
        value: 'USD',
        dataType: 'string',
        category: SettingCategory.BUSINESS,
        label: 'Currency',
        description: 'Default currency for transactions',
      },
      {
        key: 'tax_rate',
        value: '0',
        dataType: 'number',
        category: SettingCategory.TAX,
        label: 'Tax Rate',
        description: 'Default tax rate percentage',
      },
      {
        key: 'enable_email_notifications',
        value: 'true',
        dataType: 'boolean',
        category: SettingCategory.NOTIFICATION,
        label: 'Enable Email Notifications',
        description: 'Enable email notifications for users',
      },
    ];

    for (const defaultSetting of defaults) {
      const exists = await this.settingsRepository.findOne({
        where: { key: defaultSetting.key },
      });

      if (!exists) {
        const setting = this.settingsRepository.create(defaultSetting as any);
        await this.settingsRepository.save(setting);
      }
    }
  }

  // ============================================================================
  // Restaurant Mode Methods
  // ============================================================================

  /**
   * Get the current business type
   */
  async getBusinessType(): Promise<BusinessType> {
    try {
      const setting = await this.findByKey('business_type');
      return setting.value as BusinessType;
    } catch (error) {
      return BusinessType.RETAIL; // Default to retail if not set
    }
  }

  /**
   * Update the business type
   */
  async updateBusinessType(
    updateDto: UpdateBusinessTypeDto,
  ): Promise<Setting> {
    let setting: Setting;

    try {
      setting = await this.findByKey('business_type');
    } catch (error) {
      // Create the setting if it doesn't exist
      setting = this.settingsRepository.create({
        key: 'business_type',
        value: updateDto.businessType,
        dataType: SettingDataType.STRING,
        category: SettingCategory.BUSINESS,
        label: 'Business Type',
        description: 'Type of business: retail, restaurant, or hybrid',
        businessType: updateDto.businessType,
      });
      return this.settingsRepository.save(setting);
    }

    setting.value = updateDto.businessType;
    setting.businessType = updateDto.businessType;

    // If switching to restaurant or hybrid, enable restaurant mode
    if (
      updateDto.businessType === BusinessType.RESTAURANT ||
      updateDto.businessType === BusinessType.HYBRID
    ) {
      await this.enableRestaurantMode();
    }

    return this.settingsRepository.save(setting);
  }

  /**
   * Check if restaurant mode is enabled
   */
  async isRestaurantModeEnabled(): Promise<boolean> {
    try {
      const setting = await this.findByKey('restaurant_mode_enabled');
      return setting.value === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Enable restaurant mode
   */
  async enableRestaurantMode(): Promise<void> {
    let setting: Setting;

    try {
      setting = await this.findByKey('restaurant_mode_enabled');
      setting.value = 'true';
    } catch (error) {
      setting = this.settingsRepository.create({
        key: 'restaurant_mode_enabled',
        value: 'true',
        dataType: SettingDataType.BOOLEAN,
        category: SettingCategory.RESTAURANT,
        label: 'Restaurant Mode Enabled',
        description: 'Enable restaurant-specific features',
      });
    }

    await this.settingsRepository.save(setting);
  }

  /**
   * Disable restaurant mode
   */
  async disableRestaurantMode(): Promise<void> {
    try {
      const setting = await this.findByKey('restaurant_mode_enabled');
      setting.value = 'false';
      await this.settingsRepository.save(setting);
    } catch (error) {
      // Setting doesn't exist, nothing to disable
    }
  }

  /**
   * Get restaurant settings
   */
  async getRestaurantSettings(): Promise<RestaurantSettingsDto> {
    const settings = await this.findAll();
    const settingWithRestaurantConfig = settings.find(
      (s) => s.restaurantSettings != null,
    );

    if (!settingWithRestaurantConfig?.restaurantSettings) {
      // Return default settings if not configured
      return DEFAULT_RESTAURANT_SETTINGS as RestaurantSettingsDto;
    }

    return settingWithRestaurantConfig.restaurantSettings as RestaurantSettingsDto;
  }

  /**
   * Update restaurant settings
   */
  async updateRestaurantSettings(
    updateDto: UpdateRestaurantSettingsDto,
  ): Promise<Setting> {
    // Find the business type setting or create one
    let setting: Setting;

    try {
      setting = await this.findByKey('business_type');
    } catch (error) {
      // Create a new setting for restaurant configuration
      setting = this.settingsRepository.create({
        key: 'restaurant_configuration',
        value: JSON.stringify(updateDto.restaurantSettings),
        dataType: SettingDataType.JSON,
        category: SettingCategory.RESTAURANT,
        label: 'Restaurant Configuration',
        description: 'Restaurant-specific settings and features',
        restaurantSettings: updateDto.restaurantSettings,
      });
      return this.settingsRepository.save(setting);
    }

    // Update the restaurant settings
    setting.restaurantSettings = updateDto.restaurantSettings;
    return this.settingsRepository.save(setting);
  }

  /**
   * Get complete restaurant configuration
   */
  async getRestaurantConfiguration(): Promise<RestaurantConfigurationDto> {
    const businessType = await this.getBusinessType();
    const restaurantModeEnabled = await this.isRestaurantModeEnabled();
    const restaurantSettings = await this.getRestaurantSettings();

    // Determine available features based on settings
    const availableFeatures: string[] = [];

    if (restaurantSettings.tableManagement?.enabled) {
      availableFeatures.push('table_management');
    }
    if (restaurantSettings.kitchenDisplay?.enabled) {
      availableFeatures.push('kitchen_display');
    }
    if (restaurantSettings.delivery?.enabled) {
      availableFeatures.push('delivery_management');
    }
    if (restaurantSettings.reservations?.enabled) {
      availableFeatures.push('reservations');
    }
    if (restaurantSettings.orderingFlow?.allowSplitBills) {
      availableFeatures.push('split_bills');
    }
    if (restaurantSettings.orderingFlow?.allowCourseTiming) {
      availableFeatures.push('course_timing');
    }
    if (restaurantSettings.tableManagement?.qrMenuEnabled) {
      availableFeatures.push('menu_qr_code');
    }

    return {
      businessType,
      restaurantModeEnabled,
      restaurantSettings,
      availableFeatures,
    };
  }

  /**
   * Initialize restaurant settings with defaults
   */
  async initializeRestaurantSettings(): Promise<void> {
    const businessType = await this.getBusinessType();

    // Only initialize for restaurant or hybrid businesses
    if (
      businessType === BusinessType.RESTAURANT ||
      businessType === BusinessType.HYBRID
    ) {
      try {
        const currentSettings = await this.getRestaurantSettings();

        // If settings are already configured, don't overwrite
        if (JSON.stringify(currentSettings) !== JSON.stringify(DEFAULT_RESTAURANT_SETTINGS)) {
          return;
        }
      } catch (error) {
        // Settings don't exist, will create them
      }

      await this.updateRestaurantSettings({
        restaurantSettings: DEFAULT_RESTAURANT_SETTINGS as RestaurantSettingsDto,
      });
    }
  }
}
