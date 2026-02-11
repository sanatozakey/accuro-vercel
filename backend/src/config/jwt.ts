// Validate JWT_SECRET is set in production
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: JWT_SECRET environment variable must be set in production!');
    }
    // Only allow fallback in development with a warning
    console.warn('WARNING: Using default JWT secret. Set JWT_SECRET in .env for production!');
    return 'dev-only-secret-change-in-production-immediately';
  }
  // Warn if secret seems weak (less than 32 characters)
  if (secret.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters for security!');
  }
  return secret;
};

export const jwtConfig = {
  secret: getJwtSecret(),
  accessTokenExpiry: process.env.JWT_EXPIRE || '24h',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRE || '7d',
  algorithm: 'HS256' as const,
  issuer: 'accuro-platform',
  audience: 'accuro-users',
};

export const jwtOptions = {
  expiresIn: jwtConfig.accessTokenExpiry,
  algorithm: jwtConfig.algorithm,
  issuer: jwtConfig.issuer,
  audience: jwtConfig.audience,
};

export const refreshTokenOptions = {
  expiresIn: jwtConfig.refreshTokenExpiry,
  algorithm: jwtConfig.algorithm,
  issuer: jwtConfig.issuer,
  audience: jwtConfig.audience,
};
