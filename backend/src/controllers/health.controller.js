import { HTTP_STATUS } from '../constants/statusCodes.js';
import { MESSAGES } from '../constants/messages.js';
import { successResponse } from '../utils/responseHandler.js';

export const checkHealth = (req, res, next) => {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
    
    return successResponse(res, HTTP_STATUS.OK, data, MESSAGES.SERVER_RUNNING);
  } catch (error) {
    next(error);
  }
};
