import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { authRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { createAccessToken, createRefreshToken } from '../utils/jwt-helper';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register new user
router.post('/register', authRateLimiter, registerValidation, asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }

  const { email, password, firstName, lastName, phone } = req.body;
  const tenantId = req.tenant?.id;

  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
  }

  const prisma = getPrismaClient();

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      tenantId,
    },
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: {
        message: 'User already exists with this email',
      },
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      tenantId,
      role: 'MEMBER', // Default role
      status: 'ACTIVE',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  // Generate JWT tokens
  const accessToken = createAccessToken({
    userId: user.id, 
    tenantId,
    email: user.email,
    role: user.role 
  });

  const refreshToken = createRefreshToken({
    userId: user.id, 
    tenantId
  });

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  logger.info('User registered successfully', {
    userId: user.id,
    email: user.email,
    tenantId,
  });

  return res.status(201).json({
    success: true,
    data: {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
}));

// Login user
router.post('/login', authRateLimiter, loginValidation, asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }

  const { email, password } = req.body;
  const tenantId = req.tenant?.id;

  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
  }

  const prisma = getPrismaClient();

  // Find user
  const user = await prisma.user.findFirst({
    where: {
      email,
      tenantId,
    },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials',
      },
    });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials',
      },
    });
  }

  // Check if user is active
  if (user.status !== 'ACTIVE') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Account is not active',
      },
    });
  }

  // Generate JWT tokens
  const accessToken = createAccessToken({
    userId: user.id, 
    tenantId,
    email: user.email,
    role: user.role 
  });

  const refreshToken = createRefreshToken({
    userId: user.id, 
    tenantId
  });

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email,
    tenantId,
  });

  return res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Refresh token is required',
      },
    });
  }

  const prisma = getPrismaClient();

  // Find refresh token in database
  const tokenRecord = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

  if (!tokenRecord) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired refresh token',
      },
    });
  }

  // Generate new access token
  const accessToken = createAccessToken({
    userId: tokenRecord.user.id, 
    tenantId: tokenRecord.user.tenantId,
    email: tokenRecord.user.email,
    role: tokenRecord.user.role 
  });

  return res.json({
    success: true,
    data: {
      accessToken,
    },
  });
}));

// Logout
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const prisma = getPrismaClient();
    
    // Remove refresh token from database
    await prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
      },
    });
  }

  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
}));

export { router as authRoutes };
