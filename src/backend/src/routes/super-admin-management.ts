import { Router } from 'express';
import integrationsRoutes from './integrations';
import globalLimitsRoutes from './global-limits';

const router = Router();

// Mount all super admin management routes
router.use('/integrations', integrationsRoutes);
router.use('/global-limits', globalLimitsRoutes);

export default router;









