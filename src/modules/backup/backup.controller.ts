import {
  Controller,
  Get,
  Post,
  Body,
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
} from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { FilterBackupDto } from './dto/filter-backup.dto';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { CloudUploadDto } from './dto/cloud-upload.dto';
import { ScheduleBackupDto } from './dto/schedule-backup.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Backup')
@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary: 'Create manual backup',
    description: 'Create a manual database backup',
  })
  @ApiResponse({
    status: 201,
    description: 'Backup created successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createBackupDto: CreateBackupDto) {
    return this.backupService.create(createBackupDto);
  }

  @Post('schedule')
  @Roles('admin')
  @ApiOperation({
    summary: 'Schedule automatic backups',
    description: 'Set up automatic backup scheduling using cron expressions',
  })
  @ApiResponse({
    status: 201,
    description: 'Backup scheduled successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid cron expression' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  scheduleBackup(@Body() scheduleDto: ScheduleBackupDto) {
    return this.backupService.scheduleBackup(scheduleDto);
  }

  @Get()
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Get backup history',
    description: 'Retrieve all backups with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Backups retrieved successfully',
  })
  async findAll(@Query() query: FilterBackupDto) {
    const [data, total] = await this.backupService.findAll(query);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: total,
        totalPages: Math.ceil(total / (query.limit || 10)),
      },
    };
  }

  @Get(':id')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Get backup by ID',
    description: 'Retrieve a specific backup',
  })
  @ApiResponse({
    status: 200,
    description: 'Backup retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  findOne(@Param('id') id: string) {
    return this.backupService.findOne(id);
  }

  @Get(':id/status')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Get backup status',
    description: 'Monitor backup progress and status',
  })
  @ApiResponse({
    status: 200,
    description: 'Backup status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  getStatus(@Param('id') id: string) {
    return this.backupService.getStatus(id);
  }

  @Post(':id/restore')
  @Roles('admin')
  @ApiOperation({
    summary: 'Restore from backup',
    description: 'Restore database from a backup file',
  })
  @ApiResponse({
    status: 200,
    description: 'Database restored successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid backup or restore failed' })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  restore(@Param('id') id: string, @Body() restoreDto: RestoreBackupDto) {
    return this.backupService.restore(id, restoreDto);
  }

  @Post(':id/upload')
  @Roles('admin')
  @ApiOperation({
    summary: 'Upload backup to cloud',
    description: 'Upload a backup file to cloud storage (Google Drive, AWS S3, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Backup uploaded to cloud successfully',
  })
  @ApiResponse({ status: 400, description: 'Upload failed' })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  uploadToCloud(@Param('id') id: string, @Body() cloudUploadDto: CloudUploadDto) {
    return this.backupService.uploadToCloud(id, cloudUploadDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete a backup',
    description: 'Remove a backup file and its record',
  })
  @ApiResponse({
    status: 200,
    description: 'Backup deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.backupService.remove(id);
  }
}
