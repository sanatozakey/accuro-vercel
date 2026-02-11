import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export const generateToken = (id: string): string => {
  // @ts-ignore - jsonwebtoken types are overly strict for expiresIn string values
  return jwt.sign({ id }, jwtConfig.secret, {
    expiresIn: jwtConfig.accessTokenExpiry,
  });
};

// Generate refresh token with longer expiry
export const generateRefreshToken = (id: string): string => {
  // @ts-ignore - jsonwebtoken types are overly strict for expiresIn string values
  return jwt.sign({ id, type: 'refresh' }, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshTokenExpiry,
  });
};
