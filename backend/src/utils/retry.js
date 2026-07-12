import { ProviderError } from './errors.js';

const isTransientError = (error) => {
  if (error.name === 'TimeoutError') return true;
  if (!error.status && !error.response) return true; // Network errors
  const status = error.status || error.response?.status;
  // Include 429 again to respect the user's retry strategy
  return [429, 500, 502, 503, 504].includes(status);
};

export const withRetry = async (fn, providerName, maxRetries = 3) => {
  let attempt = 0;
  
  // Custom delays: 2s, 5s, 10s
  const getDelay = (attempt) => {
    if (attempt === 1) return 2000;
    if (attempt === 2) return 5000;
    return 10000;
  };

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      const status = error.status || error.response?.status;
      
      if (attempt === maxRetries || !isTransientError(error)) {
        console.error(`[${providerName}] Failed after ${attempt} attempts: ${error.message}`);
        throw error instanceof ProviderError ? error : new ProviderError(error.message, providerName, "error", false);
      }
      
      attempt++;
      
      let delay = getDelay(attempt);
      
      // If the provider gives a retry-after, respect it BUT never wait more than 10 seconds.
      if (error.response && error.response.headers && error.response.headers['retry-after']) {
        const retryAfter = parseInt(error.response.headers['retry-after'], 10);
        if (!isNaN(retryAfter)) {
          const requestedDelay = retryAfter * 1000;
          delay = Math.min(requestedDelay, 10000); // Cap at 10 seconds max
        }
      }
      
      console.log(`[${providerName}] Retry attempt ${attempt}/${maxRetries} in ${delay}ms... (Reason: ${error.message})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};
