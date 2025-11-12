import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RESTAURANT_MODE_KEY } from '../../modules/restaurant/common/restaurant.constants';
import { SettingsService } from '../../modules/settings/settings.service';
import { BusinessType } from '../../modules/settings/entities/setting.entity';

/**
 * Guard to check if restaurant mode is enabled
 * Used with @RestaurantMode() decorator
 */
@Injectable()
export class RestaurantModeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private settingsService: SettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresRestaurantMode = this.reflector.getAllAndOverride<boolean>(
      RESTAURANT_MODE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If the route doesn't require restaurant mode, allow access
    if (!requiresRestaurantMode) {
      return true;
    }

    try {
      // Check if restaurant mode is enabled in settings
      const restaurantModeEnabled = await this.settingsService.findByKey(
        'restaurant_mode_enabled',
      );

      if (restaurantModeEnabled.value !== 'true') {
        throw new ForbiddenException(
          'This feature requires restaurant mode to be enabled',
        );
      }

      // Also check business type
      const businessTypeSetting = await this.settingsService.findByKey('business_type');
      const businessType = businessTypeSetting.value as BusinessType;

      if (businessType === BusinessType.RETAIL) {
        throw new ForbiddenException(
          'This feature is only available for restaurant or hybrid business types',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // If settings don't exist, restaurant mode is not configured
      throw new ForbiddenException(
        'Restaurant mode is not configured. Please configure business type in settings.',
      );
    }
  }
}
