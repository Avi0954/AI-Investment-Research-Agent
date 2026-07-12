import YahooFinance from 'yahoo-finance2';
import { TimeoutError, ProviderError } from '../utils/errors.js';
import { withRetry } from '../utils/retry.js';
import { logger } from '../utils/logger.js';
import { recordMetric } from '../utils/metrics.js';
import { withCache, CACHE_TTL } from '../utils/cache.js';

const yahooFinance = new YahooFinance();

const fetchYahooData = async (companyName) => {
  const timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);
  
  const searchPromise = yahooFinance.search(companyName);
  let searchTimeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    searchTimeoutId = setTimeout(() => reject(new TimeoutError("Yahoo Finance")), timeout);
  });
  
  let searchRes;
  try {
    searchRes = await Promise.race([searchPromise, timeoutPromise]);
    clearTimeout(searchTimeoutId);
  } catch (err) {
    clearTimeout(searchTimeoutId);
    throw err;
  }

  const quote = searchRes.quotes.find(q => q.quoteType === 'EQUITY');
  
  if (!quote || !quote.symbol) {
    throw new ProviderError("Ticker not found", "Yahoo Finance", "warning", false);
  }

  const summaryPromise = yahooFinance.quoteSummary(quote.symbol, {
    modules: ['assetProfile', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'price']
  });
  
  let summaryTimeoutId;
  const summaryTimeout = new Promise((_, reject) => {
    summaryTimeoutId = setTimeout(() => reject(new TimeoutError("Yahoo Finance Quote Summary")), timeout);
  });
  
  let summary;
  try {
    summary = await Promise.race([summaryPromise, summaryTimeout]);
    clearTimeout(summaryTimeoutId);
  } catch (err) {
    clearTimeout(summaryTimeoutId);
    throw err;
  }
  
  return {
    companyName: quote.longname || quote.shortname || companyName,
    symbol: quote.symbol,
    sector: summary.assetProfile?.sector || "N/A",
    industry: summary.assetProfile?.industry || "N/A",
    currentStockPrice: summary.price?.regularMarketPrice ?? summary.financialData?.currentPrice ?? summary.summaryDetail?.currentPrice ?? "N/A",
    marketCap: typeof summary.summaryDetail?.marketCap === 'number' ? summary.summaryDetail.marketCap : "N/A",
    peRatio: typeof summary.summaryDetail?.trailingPE === 'number' ? summary.summaryDetail.trailingPE : "N/A",
    revenue: summary.financialData?.totalRevenue ?? summary.defaultKeyStatistics?.totalRevenue ?? summary.summaryDetail?.totalRevenue ?? "N/A",
    fiftyTwoWeekHigh: typeof summary.summaryDetail?.fiftyTwoWeekHigh === 'number' ? summary.summaryDetail.fiftyTwoWeekHigh : "N/A",
    fiftyTwoWeekLow: typeof summary.summaryDetail?.fiftyTwoWeekLow === 'number' ? summary.summaryDetail.fiftyTwoWeekLow : "N/A",
    businessSummary: summary.assetProfile?.longBusinessSummary || "N/A",
    priceChangePercent: summary.price?.regularMarketChangePercent ?? "N/A",
    revenueGrowthRate: summary.financialData?.revenueGrowth ?? "N/A",
    targetPrice: summary.financialData?.targetMeanPrice ?? "N/A"
  };
};

export const getYahooFinanceData = async (companyName) => {
  if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
    throw new ProviderError("Invalid company name provided", "Yahoo Finance", "warning", false);
  }
  
  const normalizedName = companyName.trim();
  
  return await withCache('Yahoo', normalizedName, CACHE_TTL.YAHOO, async () => {
    const startTime = Date.now();
    logger.info("Yahoo Finance", `Started data extraction for: ${normalizedName}`);
    
    try {
      const data = await withRetry(() => fetchYahooData(normalizedName), "Yahoo Finance");
      const duration = Date.now() - startTime;
      logger.info("Yahoo Finance", `Extraction SUCCESS for ${normalizedName}`, duration);
      recordMetric("Yahoo", "SUCCESS", duration);
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Yahoo Finance", `Extraction FAILED: ${error.message}`, duration);
      recordMetric("Yahoo", "FAILED", duration, error.name === 'TimeoutError');
      throw error;
    }
  });
};
