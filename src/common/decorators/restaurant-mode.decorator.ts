import { SetMetadata } from '@nestjs/common';
import { RESTAURANT_MODE_KEY } from '../../modules/restaurant/common/restaurant.constants';

/**
 * Decorator to mark routes that require restaurant mode to be enabled
 *
 * @example
 * ```typescript
 * @RestaurantMode()
 * @Get('tables')
 * getTables() {
 *   // This endpoint only works when restaurant mode is enabled
 * }
 * ```
 */
export const RestaurantMode = () => SetMetadata(RESTAURANT_MODE_KEY, true);
