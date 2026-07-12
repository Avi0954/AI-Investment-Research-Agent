import yahooFinance from 'yahoo-finance2';

/**
 * Yahoo Finance Provider
 * Collects Company Profile, Sector, Industry, Market Cap, etc.
 */
export const getCompanyProfile = async (companyName) => {
  try {
    // Search for ticker
    const searchRes = await yahooFinance.search(companyName);
    const quote = searchRes.quotes.find(q => q.isYahooFinance);
    if (!quote || !quote.symbol) return null;

    // Get Quote Summary (Profile & Financials)
    const summary = await yahooFinance.quoteSummary(quote.symbol, {
      modules: ['assetProfile', 'summaryDetail', 'defaultKeyStatistics']
    });

    return {
      symbol: quote.symbol,
      profile: summary.assetProfile || {},
      summaryDetail: summary.summaryDetail || {},
      keyStats: summary.defaultKeyStatistics || {}
    };
  } catch (error) {
    console.error("[YahooFinance] Error:", error.message);
    throw error;
  }
};
