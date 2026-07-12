/**
 * Merge & Normalize Layer
 * Normalizes all provider outputs into one consistent, validated object.
 */
export const mergeAndNormalizeResearch = (yahooData, tavilyData, secData) => {
  console.log("[Logging]: Merge Started");
  
  if (yahooData) console.log("[Logging]: Yahoo Data Received");
  if (tavilyData) console.log("[Logging]: Tavily Data Received");
  if (secData) console.log("[Logging]: SEC Data Received");

  const completedSources = [];
  const failedSources = [];

  // Track sources
  if (yahooData && Object.keys(yahooData).length > 0) completedSources.push("Yahoo Finance");
  else failedSources.push("Yahoo Finance");

  if (tavilyData && tavilyData.length > 0) completedSources.push("Tavily Search");
  else failedSources.push("Tavily Search");

  if (secData && secData.length > 0) completedSources.push("SEC EDGAR");
  else failedSources.push("SEC EDGAR");

  // 1. Normalize Company Data
  const company = {
    name: (yahooData?.companyName || "").trim(),
    symbol: (yahooData?.symbol || "").trim(),
    sector: (yahooData?.sector || "").trim(),
    industry: (yahooData?.industry || "").trim(),
    description: (yahooData?.businessSummary || "").trim()
  };

  // 2. Normalize Financials
  // Ensure we fallback to 0 instead of NaN or undefined
  const financials = {
    currentPrice: Number(yahooData?.currentStockPrice) || 0,
    marketCap: Number(yahooData?.marketCap) || 0,
    peRatio: Number(yahooData?.peRatio) || 0,
    revenue: Number(yahooData?.revenue) || 0,
    fiftyTwoWeekHigh: Number(yahooData?.fiftyTwoWeekHigh) || 0,
    fiftyTwoWeekLow: Number(yahooData?.fiftyTwoWeekLow) || 0,
    priceChangePercent: yahooData?.priceChangePercent !== "N/A" ? Number(yahooData?.priceChangePercent) : "N/A",
    revenueGrowthRate: yahooData?.revenueGrowthRate !== "N/A" ? Number(yahooData?.revenueGrowthRate) : "N/A",
    targetPrice: yahooData?.targetPrice !== "N/A" ? Number(yahooData?.targetPrice) : "N/A"
  };

  // 3. Normalize News Data (Remove duplicates, format dates)
  const uniqueUrls = new Set();
  const normalizedNews = [];
  
  // Bug fix: If Yahoo Finance failed, the company is likely invalid. Discard hallucinated news.
  if (failedSources.includes("Yahoo Finance")) {
    console.log("[Logging]: Yahoo Finance failed. Discarding potentially hallucinated Tavily news.");
  } else {
    const safeTavilyData = Array.isArray(tavilyData) ? tavilyData : [];
    
    for (const item of safeTavilyData) {
      if (!item) continue;
      const url = (item.url || "").trim();
      if (url && !uniqueUrls.has(url)) {
        uniqueUrls.add(url);
        
        let publishedDate = new Date().toISOString();
        if (item.publishedDate || item.publishedAt) {
          try {
            publishedDate = new Date(item.publishedDate || item.publishedAt).toISOString();
          } catch (e) {
            // fallback
          }
        }

        normalizedNews.push({
          title: (item.title || "").trim(),
          summary: (item.summary || item.content || "").trim(),
          url: url,
          publishedAt: publishedDate
        });
      }
    }
  }

  // 4. Normalize SEC Filings
  const filings = {
    latest10K: {},
    latest10Q: {},
    latest8K: {},
    riskFactors: [],
    businessOverview: ""
  };

  const safeSecData = Array.isArray(secData) ? secData : [];
  const uniqueFilings = new Set();

  for (const filing of safeSecData) {
    if (!filing || !filing.form) continue;
    
    // De-duplicate filings by date + form
    const sig = `${filing.form}-${filing.date}`;
    if (uniqueFilings.has(sig)) continue;
    uniqueFilings.add(sig);
    
    let formattedDate = "";
    try {
      formattedDate = filing.date ? new Date(filing.date).toISOString() : "";
    } catch (e) {
      formattedDate = filing.date || "";
    }

    const formattedFiling = {
      date: formattedDate,
      title: (filing.title || filing.businessOverview || "").trim()
    };
    
    // Assign to the respective filing slots
    if (filing.form.includes("10-K") && Object.keys(filings.latest10K).length === 0) {
      filings.latest10K = formattedFiling;
      filings.businessOverview = formattedFiling.title;
      filings.riskFactors.push("Refer to Item 1A in the 10-K filing");
    } else if (filing.form.includes("10-Q") && Object.keys(filings.latest10Q).length === 0) {
      filings.latest10Q = formattedFiling;
    } else if (filing.form.includes("8-K") && Object.keys(filings.latest8K).length === 0) {
      filings.latest8K = formattedFiling;
    }
  }

  console.log("[Logging]: Normalization Complete");
  console.log("[Logging]: Merged Object Ready");

  // Output normalized object matching strict schema
  return {
    company,
    financials,
    news: normalizedNews,
    filings,
    metadata: {
      generatedAt: new Date().toISOString(),
      completedSources,
      failedSources,
      totalSources: 3
    }
  };
};
