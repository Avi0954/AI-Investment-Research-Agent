import { asyncLocalStorage, logger } from '../utils/logger.js';
import crypto from 'crypto';

export const requestLogger = (req, res, next) => {
  // Generate a unique Request ID (e.g. REQ-20260709-abcdef)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const shortHash = crypto.randomBytes(3).toString('hex');
  const reqId = `REQ-${dateStr}-${shortHash}`;

  const store = { reqId };

  asyncLocalStorage.run(store, () => {
    const start = Date.now();
    
    // Log incoming request gracefully
    logger.info('Express', `Incoming ${req.method} ${req.originalUrl} - IP: ${req.ip || 'Unknown'}`);

    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      
      let level = 'info';
      if (status >= 400 && status < 500) level = 'warn';
      if (status >= 500) level = 'error';

      logger[level]('Express', `Completed ${req.method} ${req.originalUrl} - Status: ${status}`, duration);
    });

    next();
  });
};
