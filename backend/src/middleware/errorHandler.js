import { HTTP_STATUS, ERROR_CODES } from '../constants/statusCodes.js';
import { MESSAGES } from '../constants/messages.js';
import { errorResponse } from '../utils/responseHandler.js';

export const notFoundHandler = (req, res, next) => {
  return res.status(404).json({ error: "Route not found" });
};

export const globalErrorHandler = (err, req, res, next) => {
  console.error(`[GlobalError]: ${err.name} - ${err.message}`);
  
  if (err.type === 'entity.too.large') {
    return errorResponse(res, HTTP_STATUS.PAYLOAD_TOO_LARGE, 'PAYLOAD_TOO_LARGE', 'Request payload exceeds the maximum allowed size of 10kb.');
  }
  
  if (err.name === 'ValidationError') {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST, err.message);
  }
  
  if (err.message && err.message.includes('429')) {
    return errorResponse(res, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED', 'Too many requests. The LLM provider rate limit was exceeded. Please wait a moment and try again.');
  }
  
  if (err.name === 'ProviderError' || err.name === 'TimeoutError') {
    // Return a safe message to the client, logging the real one internally
    return errorResponse(res, HTTP_STATUS.BAD_GATEWAY, 'PROVIDER_ERROR', 'A data provider encountered an error or timed out.');
  }

  // Hide stack trace and node internals in production for security
  return errorResponse(
    res,
    err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    err.code || ERROR_CODES.SERVER_ERROR,
    MESSAGES.INTERNAL_SERVER_ERROR || 'An unexpected internal error occurred.'
  );
};
