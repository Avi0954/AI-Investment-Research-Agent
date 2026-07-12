import { Router } from 'express';
import healthRoutes from './health.routes.js';
import analysisRoutes from './analysis.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/analyze', analysisRoutes);

export default router;
