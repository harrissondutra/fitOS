/**
 * Subscription Routes - Simplified Version
 * 
 * Rotas para gerenciamento de assinaturas SAAS
 */

import { Router, Request, Response } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';
import { PlansConfig } from '../config/plans.config';

const router = Router();
const authMiddleware = getAuthMiddleware();
const plansConfig = new PlansConfig();

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
                        planId: 'individual',
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
                        planId: 'individual',
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
                plan: 'individual',
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
                planId: 'individual',
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

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16'
});

/**
 * POST /api/subscription/checkout-session
 * Cria uma intenção de pagamento/assinatura para o Stripe Elements (White Label)
 */
router.post('/checkout-session', async (req: Request, res: Response) => {
    try {
        const { planId, interval, email, name, userId } = req.body;

        if (!planId || !interval || !email) {
            return res.status(400).json({ success: false, error: 'Plan ID, Interval e Email são obrigatórios' });
        }

        const plan = await plansConfig.getPlanById(planId);
        if (!plan || !plan.stripePriceId) {
            return res.status(404).json({ success: false, error: 'Plano não encontrado ou sem configuração de preço' });
        }

        const priceId = interval === 'yearly' ? plan.stripePriceId.yearly : plan.stripePriceId.monthly;

        // 1. Buscar ou Criar Cliente
        let customer;
        const existingCustomers = await stripe.customers.list({ email, limit: 1 });
        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
            // Opcional: atualizar nome se mudou
            if (name && customer.name !== name) {
                await stripe.customers.update(customer.id, { name });
            }
        } else {
            customer = await stripe.customers.create({
                email,
                name: name || email.split('@')[0],
                metadata: { userId: userId || '' }
            });
        }

        // 2. Criar a Assinatura com Trial
        const metadata = {
            planId,
            interval,
            userId: userId || ''
        };

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            trial_period_days: 14,
            description: `Assinatura Plano ${plan.name} (${interval}) - FitOS`,
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['pending_setup_intent', 'latest_invoice.payment_intent'],
            metadata: {
                ...metadata,
                system_name: 'FitOS',
                environment: process.env.NODE_ENV || 'development',
                billing_cycle: interval
            }
        });

        // O clientSecret vem do pending_setup_intent (para trials de $0) 
        // ou do latest_invoice.payment_intent (se houver cobrança imediata)
        let clientSecret = null;
        if (subscription.pending_setup_intent) {
            clientSecret = (subscription.pending_setup_intent as Stripe.SetupIntent).client_secret;
        } else if (subscription.latest_invoice) {
            const invoice = subscription.latest_invoice as Stripe.Invoice;
            if (invoice.payment_intent) {
                clientSecret = (invoice.payment_intent as Stripe.PaymentIntent).client_secret;
            }
        }

        if (!clientSecret) {
            throw new Error('Não foi possível gerar o segredo de pagamento (clientSecret)');
        }

        res.json({
            success: true,
            clientSecret: clientSecret,
            subscriptionId: subscription.id,
            customerId: customer.id
        });

    } catch (error: any) {
        console.error('Erro ao criar assinatura:', error);
        res.status(500).json({ success: false, error: 'Erro ao processar assinatura: ' + error.message });
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

/**
 * GET /api/subscription/plans
 * Retorna todos os planos disponíveis
 */
router.get('/plans', async (req: Request, res: Response) => {
    try {
        const plans = await plansConfig.getAllPlans();
        res.json({
            success: true,
            data: plans
        });
    } catch (error: any) {
        console.error('Erro ao buscar planos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar planos'
        });
    }
});

export default router;
