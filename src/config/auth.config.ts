import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-token-key-change-this',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
}));
