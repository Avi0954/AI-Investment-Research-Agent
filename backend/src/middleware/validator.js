import { HTTP_STATUS, ERROR_CODES } from '../constants/statusCodes.js';
import { MESSAGES } from '../constants/messages.js';
import { errorResponse } from '../utils/responseHandler.js';

export const validateAnalyzeRequest = (req, res, next) => {
  const { company } = req.body;

  if (company === undefined || company === null) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST, MESSAGES.COMPANY_NAME_REQUIRED);
  }

  if (typeof company !== 'string' || company.trim().length === 0) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST, MESSAGES.COMPANY_NAME_INVALID);
  }

  const trimmed = company.trim();

  // Validate characters (allow alphanumeric, spaces, dots, hyphens, and ampersands)
  const validCompanyRegex = /^[a-zA-Z0-9\s.\-&]+$/;
  if (!validCompanyRegex.test(trimmed)) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST, "Company name contains invalid characters.");
  }

  // Sanitize input
  req.body.company = trimmed;
  
  next();
};
