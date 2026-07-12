import { getYahooFinanceData } from './yahooFinanceService.js';
import { getTavilyNews } from './tavilyService.js';
import { getSecFilings } from './secEdgarService.js';
import { mergeAndNormalizeResearch } from './mergeResearchService.js';
import { logger } from '../utils/logger.js';
import { recordMetric, getMetricsSummary } from '../utils/metrics.js';
import { withCache, CACHE_TTL } from '../utils/cache.js';

const executeResearchGathering = async (companyInput) => {
  logger.info('Research Orchestrator', `Started research orchestration for: ${companyInput}`);
  
  const startTime = Date.now();

  const [yahooRes, tavilyRes, secRes] = await Promise.allSettled([
    getYahooFinanceData(companyInput),
    getTavilyNews(companyInput),
    getSecFilings(companyInput)
  ]);

  const providerErrors = [];

  if (yahooRes.status === 'rejected') {
    logger.error('Research Orchestrator', `Provider failure - Yahoo Finance: ${yahooRes.reason.message}`);
    providerErrors.push({ provider: 'Yahoo Finance', message: yahooRes.reason.message });
  }
  if (tavilyRes.status === 'rejected') {
    logger.error('Research Orchestrator', `Provider failure - Tavily: ${tavilyRes.reason.message}`);
    providerErrors.push({ provider: 'Tavily', message: tavilyRes.reason.message });
  }
  if (secRes.status === 'rejected') {
    logger.error('Research Orchestrator', `Provider failure - SEC EDGAR: ${secRes.reason.message}`);
    providerErrors.push({ provider: 'SEC EDGAR', message: secRes.reason.message });
  }

  const yahooData = yahooRes.status === 'fulfilled' ? yahooRes.value : null;
  const tavilyData = tavilyRes.status === 'fulfilled' ? tavilyRes.value : [];
  const secData = secRes.status === 'fulfilled' ? secRes.value : [];

  const mergeStart = Date.now();
  const normalized = mergeAndNormalizeResearch(yahooData, tavilyData, secData);
  const mergeDuration = Date.now() - mergeStart;
  recordMetric("Merge", "SUCCESS", mergeDuration);
  
  if (providerErrors.length > 0) {
    normalized.metadata = normalized.metadata || {};
    normalized.metadata.providerErrors = providerErrors;
  }

  const totalDuration = Date.now() - startTime;
  logger.info('Research Orchestrator', `Completed research pipeline`, totalDuration);
  
  // Print Provider Summary
  const summary = getMetricsSummary();
  logger.info('Provider Summary', `\n---------------------------------------\nRequest Summary\n---------------------------------------\n` +
    `Yahoo: ${summary.Yahoo?.Success > 0 ? 'SUCCESS' : 'FAILED'} (${summary.Yahoo?.AvgDuration})\n` +
    `Tavily: ${summary.Tavily?.Success > 0 ? 'SUCCESS' : 'FAILED'} (${summary.Tavily?.AvgDuration})\n` +
    `SEC: ${summary.SEC?.Success > 0 ? 'SUCCESS' : 'FAILED'} (${summary.SEC?.AvgDuration})\n` +
    `Merge: SUCCESS (${summary.Merge?.AvgDuration})\n` +
    `Cache Hits: ${summary.Cache?.Hits || 0} | Misses: ${summary.Cache?.Misses || 0}\n` +
    `Total Pipeline: ${totalDuration}ms\n---------------------------------------`);

  return normalized;
};

export const gatherResearch = async (companyInput) => {
  return await withCache(
    'MergedResearch', 
    companyInput, 
    CACHE_TTL.MERGED, 
    () => executeResearchGathering(companyInput),
    (data) => !data.metadata?.providerErrors || data.metadata.providerErrors.length === 0 // isCacheable logic
  );
};
