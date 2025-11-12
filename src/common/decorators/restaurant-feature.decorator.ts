import { SetMetadata } from '@nestjs/common';
import { RESTAURANT_FEATURE_KEY, RestaurantFeature } from '../../modules/restaurant/common/restaurant.constants';

/**
 * Decorator to mark routes that require specific restaurant features to be enabled
 *
 * @param features - One or more restaurant features required
 *
 * @example
 * ```typescript
 * @RestaurantFeatures(RestaurantFeature.TABLE_MANAGEMENT)
 * @Get('tables')
 * getTables() {
 *   // This endpoint only works when table management is enabled
 * }
 *
 * @RestaurantFeatures(RestaurantFeature.TABLE_MANAGEMENT, RestaurantFeature.RESERVATIONS)
 * @Post('reserve-table')
 * reserveTable() {
 *   // This endpoint requires both features to be enabled
 * }
 * ```
 */
export const RestaurantFeatures = (...features: RestaurantFeature[]) =>
  SetMetadata(RESTAURANT_FEATURE_KEY, features);
