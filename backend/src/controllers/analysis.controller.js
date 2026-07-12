import { HTTP_STATUS } from '../constants/statusCodes.js';
import { MESSAGES } from '../constants/messages.js';
import { successResponse } from '../utils/responseHandler.js';
import { runInvestmentGraph } from '../services/analysisService.js';
import { logger } from '../utils/logger.js';

// Step 5: Prompt Injection Protection Blacklist
const INJECTION_BLACKLIST = [
  'ignore previous',
  'system prompt',
  'execute',
  'instruction',
  'code',
  'return',
  'bypass',
  'override'
];

export const analyzeCompany = async (req, res, next) => {
  try {
    let { company } = req.body;
    
    // Step 4: Input Validation
    if (!company || typeof company !== 'string' || company.trim().length === 0) {
      logger.warn('Security', `Validation failure: Empty company name from IP ${req.ip}`);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Invalid company name.' });
    }

    company = company.trim();

    if (company.length > 50) {
      logger.warn('Security', `Validation failure: Oversized company name from IP ${req.ip}`);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Company name too long.' });
    }

    const invalidCharRegex = /[^a-zA-Z0-9\s.,&-]/;
    if (invalidCharRegex.test(company)) {
      logger.warn('Security', `Validation failure: Invalid characters in company name from IP ${req.ip}`);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Company name contains invalid characters.' });
    }

    const lowerCompany = company.toLowerCase();
    for (const phrase of INJECTION_BLACKLIST) {
      if (lowerCompany.includes(phrase)) {
        logger.warn('Security', `Prompt injection attempt blocked from IP ${req.ip}: ${company}`);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Invalid company name format.' }); // Generic message for security
      }
    }
    
    // Call the LangGraph workflow
    const analysisResult = await runInvestmentGraph(company);
    
    return successResponse(res, HTTP_STATUS.OK, analysisResult, MESSAGES.ANALYSIS_SUCCESS);
  } catch (error) {
    next(error);
  }
};
