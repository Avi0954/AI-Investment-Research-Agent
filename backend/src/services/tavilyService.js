import { tavily } from '@tavily/core';
import { TimeoutError, ProviderError } from '../utils/errors.js';
import { withRetry } from '../utils/retry.js';
import { logger } from '../utils/logger.js';
import { recordMetric } from '../utils/metrics.js';
import { withCache, CACHE_TTL } from '../utils/cache.js';

const fetchTavilyNews = async (companyName) => {
  const apiKey = process.env.TAVILY_API_KEY;
  const timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);
  
  if (!apiKey) throw new ProviderError("Tavily API key missing", "Tavily", "error", false);

  const client = tavily({ apiKey });
  
  const searchPromise = client.search(`${companyName} latest company news`, {
    searchDepth: "advanced",
    topic: "news",
    maxResults: 5
  });

  let searchTimeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    searchTimeoutId = setTimeout(() => reject(new TimeoutError("Tavily")), timeout);
  });

  let response;
  try {
    response = await Promise.race([searchPromise, timeoutPromise]);
    clearTimeout(searchTimeoutId);
  } catch (err) {
    clearTimeout(searchTimeoutId);
    throw err;
  }

  if (!response || !Array.isArray(response.results)) {
    throw new ProviderError("Invalid response format from Tavily", "Tavily");
  }

  return response.results
    .filter(r => r.title && (r.content || r.url)) // Basic validation
    .map(r => ({
      title: r.title,
      summary: r.content || "No summary available",
      url: r.url || "#",
      publishedDate: r.publishedDate || new Date().toISOString()
    }));
};

export const getTavilyNews = async (companyName) => {
  if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
    throw new ProviderError("Invalid company name provided", "Tavily", "warning", false);
  }

  const normalizedName = companyName.trim();
  
  return await withCache('Tavily', normalizedName, CACHE_TTL.TAVILY, async () => {
    const startTime = Date.now();
    logger.info("Tavily", `Started news retrieval for: ${normalizedName}`);
    
    try {
      const data = await withRetry(() => fetchTavilyNews(normalizedName), "Tavily");
      const duration = Date.now() - startTime;
      logger.info("Tavily", `Retrieval SUCCESS for ${normalizedName}`, duration);
      recordMetric("Tavily", "SUCCESS", duration);
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Tavily", `Retrieval FAILED: ${error.message}`, duration);
      recordMetric("Tavily", "FAILED", duration, error.name === 'TimeoutError');
      throw error;
    }
  });
};
