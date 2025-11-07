import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Setting, SettingCategory } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateSettingValueDto } from './dto/update-setting-value.dto';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';

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
}
