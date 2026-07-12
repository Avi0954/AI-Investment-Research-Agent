import { Router } from 'express';
import { analyzeCompany } from '../controllers/analysis.controller.js';

const router = Router();

router.post('/analyze', analyzeCompany);

export default router;
