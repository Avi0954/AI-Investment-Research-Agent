import axios from 'axios';
import https from 'https';
import { TimeoutError, ProviderError } from '../utils/errors.js';
import { withRetry } from '../utils/retry.js';
import { logger } from '../utils/logger.js';
import { recordMetric } from '../utils/metrics.js';
import { withCache, CACHE_TTL } from '../utils/cache.js';

const fetchSecFilings = async (companyName) => {
  const userAgent = process.env.SEC_USER_AGENT;
  const timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);

  if (!userAgent) {
    throw new ProviderError("SEC_USER_AGENT is required for EDGAR compliance.", "SEC EDGAR", "error", false);
  }

  const agent = new https.Agent({ rejectUnauthorized: false });

  try {
    const response = await axios.get('https://efts.sec.gov/LATEST/search-index', {
      params: {
        q: companyName,
        dateRange: "1y",
        category: "custom",
        forms: "10-K,10-Q,8-K"
      },
      headers: {
        'User-Agent': userAgent
      },
      timeout: timeout,
      httpsAgent: agent
    });

    if (response.data?.hits?.hits && Array.isArray(response.data.hits.hits)) {
      return response.data.hits.hits.slice(0, 5).map(hit => ({
        form: hit._source?.form || "Unknown",
        date: hit._source?.file_date || "Unknown",
        businessOverview: hit._source?.display_names?.[0] || 'Unknown',
        riskFactors: "Refer to full text of SEC filing"
      }));
    }
    
    return [];
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError("SEC EDGAR");
    }
    throw error;
  }
};

export const getSecFilings = async (companyName) => {
  if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
    throw new ProviderError("Invalid company name provided", "SEC EDGAR", "warning", false);
  }

  const normalizedName = companyName.trim();

  return await withCache('SEC', normalizedName, CACHE_TTL.SEC, async () => {
    const startTime = Date.now();
    logger.info("SEC EDGAR", `Started filing extraction for: ${normalizedName}`);
  
    try {
      const data = await withRetry(() => fetchSecFilings(normalizedName), "SEC EDGAR");
      const duration = Date.now() - startTime;
      logger.info("SEC EDGAR", `Extraction SUCCESS for ${normalizedName}`, duration);
      recordMetric("SEC", "SUCCESS", duration);
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("SEC EDGAR", `Extraction FAILED: ${error.message}`, duration);
      recordMetric("SEC", "FAILED", duration, error.name === 'TimeoutError');
      throw error;
    }
  });
};
