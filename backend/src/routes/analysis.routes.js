import { Router } from 'express';
import { analyzeCompany } from '../controllers/analysis.controller.js';
import { validateAnalyzeRequest } from '../middleware/validator.js';

const router = Router();

router.post('/', validateAnalyzeRequest, analyzeCompany);

export default router;
