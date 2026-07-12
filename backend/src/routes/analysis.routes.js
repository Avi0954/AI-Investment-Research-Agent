import { Router } from 'express';
import { analyzeCompany } from '../controllers/analysis.controller.js';
import { validateAnalyzeRequest } from '../middleware/validator.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const analyzeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Rate limit exceeded",
    message: "Please wait before making another request"
  }
});

router.post('/', analyzeLimiter, validateAnalyzeRequest, analyzeCompany);

export default router;
