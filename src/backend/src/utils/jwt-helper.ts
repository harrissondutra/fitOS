import { signToken } from '../types/jwt';
import { config } from '../config/config';

export const createAccessToken = (payload: { userId: string; tenantId: string; email?: string; role?: string }) => {
  return signToken(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
};

export const createRefreshToken = (payload: { userId: string; tenantId: string }) => {
  return signToken(payload, config.jwt.secret, { expiresIn: config.jwt.refreshExpiresIn as any });
};
