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
  try {
    // Verificar se o token não está vazio
    if (!token || token.trim().length === 0) {
      throw new Error('Token is empty');
    }

    // Verificar se o token tem o formato correto (3 partes separadas por pontos)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Verificar se cada parte não está vazia
    if (parts.some(part => part.length === 0)) {
      throw new Error('Invalid token structure');
    }

    // Verificar o token
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Validações adicionais do payload
    if (!decoded.userId || !decoded.tenantId) {
      throw new Error('Invalid token payload');
    }

    // Verificar se os IDs não são apenas espaços em branco
    if (decoded.userId.trim().length === 0 || decoded.tenantId.trim().length === 0) {
      throw new Error('Invalid token payload');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error('Token not active');
    } else {
      throw error;
    }
  }
};
