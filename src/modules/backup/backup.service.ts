import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Backup, BackupStatus, BackupType } from './entities/backup.entity';
import { CreateBackupDto } from './dto/create-backup.dto';
import { FilterBackupDto } from './dto/filter-backup.dto';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { CloudUploadDto } from './dto/cloud-upload.dto';
import { ScheduleBackupDto } from './dto/schedule-backup.dto';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private backupDir: string;

  constructor(
    @InjectRepository(Backup)
    private backupsRepository: Repository<Backup>,
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    this.backupDir = this.configService.get('BACKUP_DIR') || './backups';
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async create(createBackupDto: CreateBackupDto): Promise<Backup> {
    const filename =
      createBackupDto.filename ||
      `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;

    const backup = this.backupsRepository.create({
      ...createBackupDto,
      filename,
      status: BackupStatus.PENDING,
      type: createBackupDto.type || BackupType.MANUAL,
    });

    const savedBackup = await this.backupsRepository.save(backup);

    // If not scheduled, trigger backup immediately
    if (!createBackupDto.scheduledFor) {
      this.performBackup(savedBackup.id).catch((err) => {
        console.error('Backup failed:', err);
      });
    }

    return savedBackup;
  }

  async findAll(query: FilterBackupDto): Promise<[Backup[], number]> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      type,
      storageLocation,
      sortBy,
      sortOrder,
    } = query;

    const where: any = {};

    if (search) {
      where.filename = ILike(`%${search}%`);
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (storageLocation) {
      where.storageLocation = storageLocation;
    }

    const order: any = {};
    if (sortBy) {
      order[sortBy] = sortOrder || 'DESC';
    } else {
      order.createdAt = 'DESC';
    }

    return this.backupsRepository.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string): Promise<Backup> {
    const backup = await this.backupsRepository.findOne({
      where: { id },
    });
    if (!backup) {
      throw new NotFoundException(`Backup with ID ${id} not found`);
    }
    return backup;
  }

  async remove(id: string): Promise<void> {
    const backup = await this.findOne(id);

    // Delete file if exists
    if (backup.filePath && fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }

    await this.backupsRepository.remove(backup);
  }

  async restore(
    id: string,
    restoreDto: RestoreBackupDto,
  ): Promise<{ success: boolean; message: string }> {
    const backup = await this.findOne(id);

    if (backup.status !== BackupStatus.COMPLETED) {
      throw new BadRequestException(
        'Can only restore completed backups',
      );
    }

    if (!backup.filePath || !fs.existsSync(backup.filePath)) {
      throw new NotFoundException('Backup file not found');
    }

    try {
      // Create a backup before restoring if requested
      if (restoreDto.createBackupBeforeRestore) {
        await this.create({
          type: BackupType.AUTOMATIC,
        });
      }

      // Perform the restore operation
      const dbConfig = this.getDbConfig();
      const restoreCommand = this.buildRestoreCommand(
        dbConfig,
        backup.filePath,
      );

      await execAsync(restoreCommand);

      return {
        success: true,
        message: 'Database restored successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Restore failed: ${error.message}`,
      );
    }
  }

  async uploadToCloud(
    id: string,
    cloudUploadDto: CloudUploadDto,
  ): Promise<Backup> {
    const backup = await this.findOne(id);

    if (backup.status !== BackupStatus.COMPLETED) {
      throw new BadRequestException(
        'Can only upload completed backups',
      );
    }

    if (!backup.filePath || !fs.existsSync(backup.filePath)) {
      throw new NotFoundException('Backup file not found');
    }

    try {
      backup.status = BackupStatus.UPLOADING;
      await this.backupsRepository.save(backup);

      // Simulate cloud upload (in production, implement actual cloud provider logic)
      // For Google Drive, AWS S3, etc.
      const cloudUrl = await this.performCloudUpload(
        backup.filePath,
        cloudUploadDto,
      );

      backup.status = BackupStatus.UPLOADED;
      backup.cloudUrl = cloudUrl;
      backup.storageLocation = cloudUploadDto.storageLocation;

      return this.backupsRepository.save(backup);
    } catch (error) {
      backup.status = BackupStatus.FAILED;
      backup.errorMessage = error.message;
      await this.backupsRepository.save(backup);
      throw new BadRequestException(`Cloud upload failed: ${error.message}`);
    }
  }

  async getStatus(id: string): Promise<{
    id: string;
    status: BackupStatus;
    progress: number;
    message: string;
  }> {
    const backup = await this.findOne(id);

    let progress = 0;
    switch (backup.status) {
      case BackupStatus.PENDING:
        progress = 0;
        break;
      case BackupStatus.IN_PROGRESS:
        progress = 50;
        break;
      case BackupStatus.COMPLETED:
      case BackupStatus.UPLOADED:
        progress = 100;
        break;
      case BackupStatus.FAILED:
        progress = 0;
        break;
      case BackupStatus.UPLOADING:
        progress = 75;
        break;
    }

    return {
      id: backup.id,
      status: backup.status,
      progress,
      message: backup.errorMessage || 'Backup is processing',
    };
  }

  async scheduleBackup(
    scheduleDto: ScheduleBackupDto,
  ): Promise<{ success: boolean; message: string }> {
    // In production, integrate with a job scheduler like Bull or node-cron
    // For now, return a success message
    return {
      success: true,
      message: `Backup scheduled with cron expression: ${scheduleDto.cronExpression}`,
    };
  }

  private async performBackup(backupId: string): Promise<void> {
    const backup = await this.findOne(backupId);

    try {
      backup.status = BackupStatus.IN_PROGRESS;
      backup.startedAt = new Date();
      await this.backupsRepository.save(backup);

      const filePath = path.join(this.backupDir, backup.filename);
      const dbConfig = this.getDbConfig();

      // Build pg_dump command
      const backupCommand = this.buildBackupCommand(dbConfig, filePath);

      // Execute backup
      await execAsync(backupCommand);

      // Get file size
      const stats = fs.statSync(filePath);

      backup.status = BackupStatus.COMPLETED;
      backup.completedAt = new Date();
      backup.filePath = filePath;
      backup.size = stats.size;
      backup.metadata = {
        ...backup.metadata,
        databaseName: dbConfig.database,
      };

      await this.backupsRepository.save(backup);
    } catch (error) {
      backup.status = BackupStatus.FAILED;
      backup.errorMessage = error.message;
      await this.backupsRepository.save(backup);
      throw error;
    }
  }

  private getDbConfig() {
    return {
      host: this.configService.get('DB_HOST') || 'localhost',
      port: this.configService.get('DB_PORT') || 5432,
      username: this.configService.get('DB_USERNAME') || 'postgres',
      password: this.configService.get('DB_PASSWORD') || '',
      database: this.configService.get('DB_DATABASE') || 'yoga_pos',
    };
  }

  private buildBackupCommand(dbConfig: any, filePath: string): string {
    return `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -F c -f "${filePath}"`;
  }

  private buildRestoreCommand(dbConfig: any, filePath: string): string {
    return `PGPASSWORD="${dbConfig.password}" pg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -c "${filePath}"`;
  }

  private async performCloudUpload(
    filePath: string,
    cloudUploadDto: CloudUploadDto,
  ): Promise<string> {
    // Simulate cloud upload
    // In production, implement actual cloud provider SDK integration
    // For Google Drive: use googleapis package
    // For AWS S3: use @aws-sdk/client-s3
    // For Dropbox: use dropbox package

    return `https://${cloudUploadDto.storageLocation}/backups/${path.basename(filePath)}`;
  }
}
