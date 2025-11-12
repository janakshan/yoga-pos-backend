import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { ServerShift } from './server-shift.entity';

export enum TipType {
  CASH = 'cash',
  CARD = 'card',
  DIGITAL = 'digital',
  POOLED = 'pooled',
}

export enum TipStatus {
  PENDING = 'pending',
  PAID = 'paid',
  DISPUTED = 'disputed',
}

@Entity('server_tips')
export class ServerTip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'server_id' })
  server: User;

  @Column({ name: 'server_id' })
  serverId: string;

  @ManyToOne(() => Invoice, { nullable: true, eager: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ name: 'invoice_id', nullable: true })
  invoiceId: string;

  @ManyToOne(() => ServerShift, { nullable: true })
  @JoinColumn({ name: 'shift_id' })
  shift: ServerShift;

  @Column({ name: 'shift_id', nullable: true })
  shiftId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TipType,
    default: TipType.CASH,
  })
  type: TipType;

  @Column({
    type: 'enum',
    enum: TipStatus,
    default: TipStatus.PENDING,
  })
  status: TipStatus;

  @Column({ type: 'timestamp' })
  tipDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tipPercentage: number; // Percentage of order total

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  orderTotal: number; // Total order amount this tip is based on

  @Column({ type: 'boolean', default: false })
  isPooled: boolean; // If tip is part of pooled tips

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  pooledSharePercentage: number; // Server's share of pooled tips

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    customerName?: string;
    tableNumber?: string;
    paymentMethod?: string;
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
