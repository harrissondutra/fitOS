import { Router, Request, Response } from 'express';
import { auth } from '../config/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const router = Router();

// Rota de teste
router.get('/api/auth/test', (req: Request, res: Response) => {
  res.json({ message: 'Auth route working!', timestamp: new Date().toISOString() });
});

// Login com email e senha
router.post('/api/auth/sign-in/email', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required' }
      });
    }

    logger.info(`🔐 Login attempt for: ${email}`);

    // Buscar usuário no Better Auth
    const user = await prisma.user.findFirst({
      where: { email }
    });

    if (!user) {
      logger.warn(`❌ User not found: ${email}`);
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    // Buscar conta do Better Auth
    const account = await prisma.account.findFirst({
      where: { 
        userId: user.id,
        providerId: 'credential'
      }
    });

    if (!account) {
      logger.warn(`❌ Account not found for user: ${email}`);
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, account.password || '');
    
    if (!passwordMatch) {
      logger.warn(`❌ Invalid password for user: ${email}`);
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    logger.info(`✅ Login successful for: ${email}`);

    // Criar sessão
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sessionToken = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session = await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        token: sessionToken
      }
    });

    // Configurar cookie de sessão
    res.cookie('better-auth.session_token', sessionToken, {
      httpOnly: true,
      secure: false, // false para desenvolvimento
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    // Retornar sucesso
    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.image
        },
        session: { 
          id: session.id,
          token: sessionToken,
          expiresAt: session.expiresAt
        }
      }
    });

  } catch (error) {
    logger.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Registro com email e senha
router.post('/api/auth/sign-up/email', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required' }
      });
    }

    logger.info(`📝 Registration attempt for: ${email}`);

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'User already exists' }
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        name: name || null,
        emailVerified: true, // Para desenvolvimento
      }
    });

    // Criar conta
    const account = await prisma.account.create({
      data: {
        id: `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        accountId: email,
        providerId: 'credential',
        password: hashedPassword,
      }
    });

    logger.info(`✅ User created: ${email}`);

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.image
        }
      }
    });

  } catch (error) {
    logger.error('❌ Registration error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Logout
router.post('/api/auth/sign-out', async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies['better-auth.session_token'];
    
    if (sessionToken) {
      // Remover sessão do banco
      await prisma.session.deleteMany({
        where: { token: sessionToken }
      });
    }

    // Limpar cookie
    res.clearCookie('better-auth.session_token');

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('❌ Logout error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Verificar sessão
router.get('/api/auth/session', async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies['better-auth.session_token'];
    
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: { message: 'No session found' }
      });
    }

    // Buscar sessão
    const session = await prisma.session.findFirst({
      where: { 
        token: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired session' }
      });
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          emailVerified: session.user.emailVerified,
          image: session.user.image
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt
        }
      }
    });

  } catch (error) {
    logger.error('❌ Session check error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export { router as authRoutes };
