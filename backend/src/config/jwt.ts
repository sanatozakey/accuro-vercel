export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
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
