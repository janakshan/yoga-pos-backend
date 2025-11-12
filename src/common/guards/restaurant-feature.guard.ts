import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RESTAURANT_FEATURE_KEY,
  RestaurantFeature,
} from '../../modules/restaurant/common/restaurant.constants';
import { SettingsService } from '../../modules/settings/settings.service';
import { BusinessType } from '../../modules/settings/entities/setting.entity';

/**
 * Guard to check if specific restaurant features are enabled
 * Used with @RestaurantFeatures() decorator
 */
@Injectable()
export class RestaurantFeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private settingsService: SettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<RestaurantFeature[]>(
      RESTAURANT_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no specific features are required, allow access
    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    try {
      // First, check if restaurant mode is enabled
      const restaurantModeEnabled = await this.settingsService.findByKey(
        'restaurant_mode_enabled',
      );

      if (restaurantModeEnabled.value !== 'true') {
        throw new ForbiddenException(
          'Restaurant mode must be enabled to use this feature',
        );
      }

      // Check business type
      const businessTypeSetting = await this.settingsService.findByKey('business_type');
      const businessType = businessTypeSetting.value as BusinessType;

      if (businessType === BusinessType.RETAIL) {
        throw new ForbiddenException(
          'This feature is only available for restaurant or hybrid business types',
        );
      }

      // Get all settings to check restaurant features
      const settings = await this.settingsService.findAll();
      const settingWithRestaurantConfig = settings.find(
        (s) => s.restaurantSettings != null,
      );

      if (!settingWithRestaurantConfig?.restaurantSettings) {
        throw new ForbiddenException(
          'Restaurant settings are not configured',
        );
      }

      const restaurantSettings = settingWithRestaurantConfig.restaurantSettings;

      // Check if all required features are enabled
      for (const feature of requiredFeatures) {
        if (!this.isFeatureEnabled(feature, restaurantSettings)) {
          throw new ForbiddenException(
            `Required restaurant feature "${feature}" is not enabled`,
          );
        }
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException(
        'Unable to verify restaurant features. Please check your configuration.',
      );
    }
  }

  /**
   * Check if a specific restaurant feature is enabled in settings
   */
  private isFeatureEnabled(
    feature: RestaurantFeature,
    restaurantSettings: any,
  ): boolean {
    switch (feature) {
      case RestaurantFeature.TABLE_MANAGEMENT:
        return restaurantSettings.tableManagement?.enabled === true;

      case RestaurantFeature.KITCHEN_DISPLAY:
        return restaurantSettings.kitchenDisplay?.enabled === true;

      case RestaurantFeature.ONLINE_ORDERING:
        return restaurantSettings.deliveryEnabled === true;

      case RestaurantFeature.MENU_QR_CODE:
        return restaurantSettings.tableManagement?.qrMenuEnabled === true;

      case RestaurantFeature.SPLIT_BILLS:
        return restaurantSettings.orderingFlow?.allowSplitBills === true;

      case RestaurantFeature.COURSE_TIMING:
        return restaurantSettings.orderingFlow?.allowCourseTiming === true;

      case RestaurantFeature.RESERVATIONS:
        return restaurantSettings.reservations?.enabled === true;

      case RestaurantFeature.DELIVERY_MANAGEMENT:
        return restaurantSettings.delivery?.enabled === true;

      case RestaurantFeature.WAITER_APP:
        // Waiter app is enabled if table management is enabled
        return restaurantSettings.tableManagement?.enabled === true;

      default:
        return false;
    }
  }
}
