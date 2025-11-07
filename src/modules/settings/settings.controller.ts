import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateSettingValueDto } from './dto/update-setting-value.dto';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';
import { SettingCategory } from './entities/setting.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary: 'Create a new setting',
    description: 'Create a new system setting',
  })
  @ApiResponse({
    status: 201,
    description: 'Setting created successfully',
  })
  @ApiResponse({ status: 400, description: 'Setting already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(createSettingDto);
  }

  @Patch('bulk')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Bulk update settings',
    description: 'Update multiple settings at once using key-value pairs',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid settings or read-only settings' })
  @ApiResponse({ status: 404, description: 'No settings found' })
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdateSettingsDto) {
    return this.settingsService.bulkUpdate(bulkUpdateDto);
  }

  @Get()
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({
    summary: 'Get all settings',
    description: 'Retrieve all system settings, optionally filtered by category',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: SettingCategory,
    description: 'Filter by category',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
  })
  findAll(@Query('category') category?: SettingCategory) {
    return this.settingsService.findAll(category);
  }

  @Get('all-as-object')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({
    summary: 'Get all settings as key-value object',
    description: 'Retrieve all settings as a single object with parsed values',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings object retrieved successfully',
  })
  getAllAsObject() {
    return this.settingsService.getAllAsObject();
  }

  @Get('category/:category')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({
    summary: 'Get settings by category',
    description: 'Retrieve all settings in a specific category',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
  })
  getByCategory(@Param('category') category: SettingCategory) {
    return this.settingsService.getByCategory(category);
  }

  @Get('key/:key')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({
    summary: 'Get setting by key',
    description: 'Retrieve a specific setting by its key',
  })
  @ApiResponse({
    status: 200,
    description: 'Setting retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Patch('key/:key')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Update setting by key',
    description: 'Update a setting value using its key',
  })
  @ApiResponse({
    status: 200,
    description: 'Setting updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot update read-only setting' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  updateByKey(
    @Param('key') key: string,
    @Body() updateValueDto: UpdateSettingValueDto,
  ) {
    return this.settingsService.updateByKey(key, updateValueDto);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({
    summary: 'Get setting by ID',
    description: 'Retrieve a specific setting by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Setting retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  findOne(@Param('id') id: string) {
    return this.settingsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Update setting by ID',
    description: 'Update a setting using its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Setting updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot update read-only setting' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  update(@Param('id') id: string, @Body() updateSettingDto: UpdateSettingDto) {
    return this.settingsService.update(id, updateSettingDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete a setting',
    description: 'Delete a setting from the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Setting deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot delete read-only setting' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  remove(@Param('id') id: string) {
    return this.settingsService.remove(id);
  }

  @Post('initialize-defaults')
  @Roles('admin')
  @ApiOperation({
    summary: 'Initialize default settings',
    description: 'Create default system settings if they do not exist',
  })
  @ApiResponse({
    status: 201,
    description: 'Default settings initialized successfully',
  })
  async initializeDefaults() {
    await this.settingsService.initializeDefaults();
    return { message: 'Default settings initialized successfully' };
  }
}
