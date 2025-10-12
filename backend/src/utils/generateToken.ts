import jwt from 'jsonwebtoken';

export const generateToken = (id: string): string => {
  // @ts-ignore
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};
