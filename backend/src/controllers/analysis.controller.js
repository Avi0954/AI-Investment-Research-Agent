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
    
    // Call the LangGraph workflow with a safety timeout (55 seconds to beat Vercel's 60s kill)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 55000)
    );

    const analysisResult = await Promise.race([
      runInvestmentGraph(company),
      timeoutPromise
    ]);
    
    return successResponse(res, HTTP_STATUS.OK, analysisResult, MESSAGES.ANALYSIS_SUCCESS);
  } catch (error) {
    logger.error('Analyze', `Controller Error: ${error.message}`);
    
    if (error.message && error.message.includes('429')) {
      return res.status(429).json({
        success: false,
        error: "AI service unavailable",
        details: "Groq rate limit reached"
      });
    }

    if (error.message && error.message.includes('timed out')) {
      return res.status(504).json({
        success: false,
        error: "Request Timeout",
        details: "The analysis took too long to complete."
      });
    }

    return res.status(500).json({
      success: false,
      error: "AI service unavailable",
      details: error.message || "An unexpected error occurred."
    });
  }
};
