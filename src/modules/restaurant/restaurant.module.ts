import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';

/**
 * Restaurant Module
 *
 * This module will handle all restaurant-specific functionality including:
 * - Table management
 * - Kitchen display system
 * - Menu management with modifiers
 * - Order management for dine-in, takeaway, and delivery
 * - Reservations
 * - Waiter app functionality
 *
 * Note: This is the base module structure. Specific features will be
 * implemented in subsequent phases.
 */
@Module({
  imports: [SettingsModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class RestaurantModule {}
