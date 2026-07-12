import { ProviderError } from './errors.js';

const isTransientError = (error) => {
  if (error.name === 'TimeoutError') return true;
  if (!error.status && !error.response) return true; // Network errors
  const status = error.status || error.response?.status;
  return [429, 500, 502, 503, 504].includes(status);
};

export const withRetry = async (fn, providerName, maxRetries = 2) => {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isTransientError(error)) {
        console.error(`[${providerName}] Failed: ${error.message}`);
        throw error instanceof ProviderError ? error : new ProviderError(error.message, providerName, "error", false);
      }
      
      attempt++;
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[${providerName}] Retry attempt ${attempt}/${maxRetries} in ${delay}ms... (Reason: ${error.message})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};
