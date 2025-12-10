/**
 * Subscription Routes - Simplified Version
 * 
 * Rotas para gerenciamento de assinaturas SAAS
 */

import { Router, Request, Response } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';

const router = Router();
const authMiddleware = getAuthMiddleware();

/**
 * POST /api/subscription/free
 * Ativa oplano FREE para um usuário
 */
router.post('/free', authMiddleware.authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const prisma = getPrismaClient();

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }

        // Buscar usuário e tenant atual
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true } // Incluir tenant para verificar se é default
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Se o usuário já tem um tenant próprio (não default-tenant), apenas atualizar o plano
        // Mas se ele estiver no default-tenant, precisamos CRIAR um novo tenant
        const isDefaultTenant = user.tenantId === 'default-tenant' || user.tenant?.subdomain === 'default';

        if (!isDefaultTenant) {
            // Lógica antiga: apenas atualiza assinatura
            let subscription = await prisma.subscription.findFirst({
                where: { tenantId: user.tenantId! }
            });

            if (subscription) {
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        planId: 'free',
                        status: 'active',
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
                        cancelAtPeriodEnd: false,
                    }
                });
            } else {
                await prisma.subscription.create({
                    data: {
                        tenantId: user.tenantId!,
                        planId: 'free',
                        status: 'active',
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        cancelAtPeriodEnd: false,
                    }
                });
            }

            return res.json({
                success: true,
                message: 'Plano FREE ativado com sucesso',
                tenantId: user.tenantId
            });
        }

        // === CRIAÇÃO DE NOVO TENANT (Fluxo Diferido) ===

        // Gerar subdomínio único baseado no nome/email
        let baseSubdomain = (user.firstName || user.email.split('@')[0])
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

        if (baseSubdomain.length < 3) baseSubdomain = `fitos${baseSubdomain}`;

        let subdomain = baseSubdomain;
        let counter = 1;

        // Verificar disponibilidade do subdomínio
        while (await prisma.tenant.findUnique({ where: { subdomain } })) {
            subdomain = `${baseSubdomain}${counter}`;
            counter++;
        }

        // Criar novo Tenant
        const newTenant = await prisma.tenant.create({
            data: {
                name: `${user.firstName || 'User'}'s Gym`,
                subdomain: subdomain,
                status: 'active',
                billingEmail: user.email,
                plan: 'free',
                settings: {
                    timezone: 'America/Sao_Paulo',
                    currency: 'BRL',
                    language: 'pt-BR'
                }
            }
        });

        // Mover usuário para o novo tenant e tornar OWNER
        await prisma.user.update({
            where: { id: user.id },
            data: {
                tenantId: newTenant.id,
                role: 'OWNER'
            }
        });

        // Criar Assinatura para o novo tenant
        const subscription = await prisma.subscription.create({
            data: {
                tenantId: newTenant.id,
                planId: 'free',
                status: 'active',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 365 * 10 * 24 * 60 * 60 * 1000), // "Forever"
                cancelAtPeriodEnd: false,
            }
        });

        res.json({
            success: true,
            message: 'Tenant criado e plano FREE ativado',
            tenant: newTenant,
            subscription,
            redirectUrl: `http://${newTenant.subdomain}.localhost:3000` // Ajustar para domínio real em prod
        });

    } catch (error: any) {
        console.error('Erro ao ativar plano FREE:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao ativar plano FREE'
        });
    }
});

/**
 * POST /api/subscription/create-checkout
 * Cria uma sessão de checkout para planos pagos
 */
router.post('/create-checkout', authMiddleware.authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { planId, billingCycle } = req.body;
        const prisma = getPrismaClient();

        if (!userId || !planId || !billingCycle) {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Por enquanto, retornar URL de demo
        // TODO: Integrar com Stripe/MercadoPago real
        const checkoutUrl = `${process.env.FRONTEND_URL}/checkout/demo?plan=${planId}&cycle=${billingCycle}`;

        res.json({
            success: true,
            checkoutUrl,
            message: 'Checkout em desenvolvimento - usando demo'
        });

    } catch (error: any) {
        console.error('Erro ao criar checkout:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao criar checkout'
        });
    }
});

/**
 * GET /api/subscription/verify-checkout
 * Verifica status de uma sessão de checkout
 */
router.get('/verify-checkout', authMiddleware.authenticateToken, async (req: Request, res: Response) => {
    try {
        const sessionId = req.query.session_id as string;
        const userId = (req as any).user?.id;
        const prisma = getPrismaClient();

        if (!sessionId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID e usuário são obrigatórios'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Buscar subscription do usuário
        const subscription = await prisma.subscription.findFirst({
            where: { tenantId: user.tenantId }
        });

        if (!subscription || subscription.status !== 'active') {
            return res.status(404).json({
                success: false,
                error: 'Assinatura não encontrada ou não ativa'
            });
        }

        res.json({
            success: true,
            subscription: {
                id: subscription.id,
                planId: subscription.planId,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd
            }
        });

    } catch (error: any) {
        console.error('Erro ao verificar checkout:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar checkout'
        });
    }
});

/**
 * GET /api/subscription/current
 * Retorna a assinatura atual do usuário
 */
router.get('/current', authMiddleware.authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const prisma = getPrismaClient();

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        const subscription = await prisma.subscription.findFirst({
            where: { tenantId: user.tenantId }
        });

        res.json({
            success: true,
            subscription: subscription || null
        });

    } catch (error: any) {
        console.error('Erro ao buscar assinatura:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar assinatura'
        });
    }
});

export default router;
