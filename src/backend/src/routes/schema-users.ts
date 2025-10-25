import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithSchemaTenant } from '../middleware/schema-tenant';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { validateUserLimit } from '../middleware/validateUserLimit';

const router = Router();

// Exemplo de rota para criar um usuário dentro do schema do tenant
router.post('/users',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('role').isIn(['MEMBER', 'TRAINER', 'ADMIN', 'OWNER']).withMessage('Invalid role'),
  validateUserLimit, // NOVO: Validar limite de usuários
  asyncHandler(async (req: RequestWithSchemaTenant, res: Response) => {
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

    const { email, password, firstName, lastName, phone, role } = req.body;
    const prisma = req.prisma; // Usar o cliente Prisma dinâmico

    if (!prisma) {
      return res.status(500).json({ success: false, error: { message: 'Prisma client not available for tenant.' } });
    }

    // Verificar se o usuário já existe no schema do tenant
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'User already exists with this email in this tenant',
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        // password removido - agora é gerenciado via Account
        firstName,
        lastName,
        phone,
        role: role || 'MEMBER',
        status: 'ACTIVE',
        profile: {},
        tenant: {
          connect: {
            id: req.tenant?.id || ''
          }
        }
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

    // Senha já foi incluída na criação do usuário acima

    logger.info(`User created in schema tenant ${req.tenant?.id}: ${user.email}`);

    return res.status(201).json({
      success: true,
      data: { user },
    });
  })
);

// Exemplo de rota para listar usuários de um tenant
router.get('/users', asyncHandler(async (req: RequestWithSchemaTenant, res: Response) => {
  const prisma = req.prisma;

  if (!prisma) {
    return res.status(500).json({ success: false, error: { message: 'Prisma client not available for tenant.' } });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return res.status(200).json({
    success: true,
    data: { users },
  });
}));

export default router;