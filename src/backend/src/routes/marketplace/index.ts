import express from 'express';
// import listingsRouter from './listings';
// import ordersRouter from './orders';
// import reviewsRouter from './reviews';
// import sellerRouter from './seller';
// import paymentsRouter from './payments';
// import analyticsRouter from './analytics';
// import adminRouter from './admin';
// import categoriesRouter from './categories';
// import favoritesRouter from './favorites';
// import questionsRouter from './questions';
// import boostRouter from './boost';
// import couponsRouter from './coupons';
// import disputesRouter from './disputes';
// import fidelityRouter from './fidelity';
// import affiliatesRouter from './affiliates';
// import eventsRouter from './events';
// import spacesRouter from './spaces';
// import jobsRouter from './jobs';
import kycRouter from './kyc';
// import shippingRouter from './shipping';
// import notificationsRouter from './notifications';
// import searchRouter from './search';
// import recommendationsRouter from './recommendations';

const router = express.Router();

// Middleware de autenticação para todas as rotas do marketplace
// router.use(authenticateUser);

// Middleware de rate limiting específico para marketplace
// router.use(rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 100 // máximo 100 requests por IP por janela
// }));

// Rotas principais
// router.use('/listings', listingsRouter);
// router.use('/orders', ordersRouter);
// router.use('/reviews', reviewsRouter);
// router.use('/seller', sellerRouter);
// router.use('/payments', paymentsRouter);
// router.use('/analytics', analyticsRouter);
// router.use('/admin', adminRouter);
// router.use('/categories', categoriesRouter);
// router.use('/favorites', favoritesRouter);
// router.use('/questions', questionsRouter);
// router.use('/boost', boostRouter);
// router.use('/coupons', couponsRouter);
// router.use('/disputes', disputesRouter);
// router.use('/fidelity', fidelityRouter);
// router.use('/affiliates', affiliatesRouter);
// router.use('/events', eventsRouter);
// router.use('/spaces', spacesRouter);
// router.use('/jobs', jobsRouter);
router.use('/kyc', kycRouter);
// router.use('/shipping', shippingRouter);
// router.use('/notifications', notificationsRouter);
// router.use('/search', searchRouter);
// router.use('/recommendations', recommendationsRouter);

// Rota de health check para marketplace
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'marketplace',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;

