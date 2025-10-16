import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email?: string;
  role?: string;
}

export const signToken = (payload: JwtPayload, secret: string, options: SignOptions): string => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};
