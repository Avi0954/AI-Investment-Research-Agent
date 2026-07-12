import { ProviderError } from './errors.js';

const isTransientError = (error) => {
  if (error.name === 'TimeoutError') return true;
  if (!error.status && !error.response) return true; // Network errors
  const status = error.status || error.response?.status;
  return [429, 500, 502, 503, 504].includes(status);
};

export const withRetry = async (fn, providerName, maxRetries = 3) => {
  let attempt = 0;
  
  // Custom delays: 3s, 7s, 15s
  const getDelay = (attempt) => {
    if (attempt === 1) return 3000;
    if (attempt === 2) return 7000;
    return 15000;
  };

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isTransientError(error)) {
        console.error(`[${providerName}] Failed after ${attempt} attempts: ${error.message}`);
        throw error instanceof ProviderError ? error : new ProviderError(error.message, providerName, "error", false);
      }
      
      attempt++;
      
      // Read Groq retry information if available
      let delay = getDelay(attempt);
      if (error.response && error.response.headers && error.response.headers['retry-after']) {
        const retryAfter = parseInt(error.response.headers['retry-after'], 10);
        if (!isNaN(retryAfter)) {
          delay = retryAfter * 1000; // Convert seconds to ms
        }
      }
      
      console.log(`[${providerName}] Retry attempt ${attempt}/${maxRetries} in ${delay}ms... (Reason: ${error.message})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};
