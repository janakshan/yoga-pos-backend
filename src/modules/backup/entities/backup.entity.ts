import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
}

export enum BackupType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  SCHEDULED = 'scheduled',
}

export enum BackupStorageLocation {
  LOCAL = 'local',
  GOOGLE_DRIVE = 'google_drive',
  AWS_S3 = 'aws_s3',
  DROPBOX = 'dropbox',
}

@Entity('backups')
export class Backup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  filename: string;

  @Column({
    type: 'enum',
    enum: BackupType,
    default: BackupType.MANUAL,
  })
  type: BackupType;

  @Column({
    type: 'enum',
    enum: BackupStatus,
    default: BackupStatus.PENDING,
  })
  status: BackupStatus;

  @Column({
    type: 'enum',
    enum: BackupStorageLocation,
    default: BackupStorageLocation.LOCAL,
  })
  storageLocation: BackupStorageLocation;

  @Column({ type: 'bigint', nullable: true })
  size: number; // Size in bytes

  @Column({ nullable: true })
  filePath: string; // Local file path

  @Column({ nullable: true })
  cloudUrl: string; // Cloud storage URL

  @Column({ nullable: true })
  cloudFileId: string; // Cloud provider file ID

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    tablesIncluded?: string[];
    recordCount?: number;
    compressionType?: string;
    databaseName?: string;
    version?: string;
    checksum?: string;
    [key: string]: any;
  };

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor: Date;

  @Column({ default: false })
  isAutoDeleteEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  retentionDays: number; // Auto-delete after N days

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
