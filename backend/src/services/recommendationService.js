import { logger } from '../utils/logger.js';

export const buildFinalRecommendation = (state) => {
  logger.info('Recommendation Builder', 'Started building final report');

  const { research = {}, analysis = {} } = state;
  const scoring = research.scoring || {};

  if (Object.keys(research).length === 0) {
    logger.warn('Recommendation Builder', 'No research data available');
    return "No research data available.";
  }

  if (Object.keys(analysis).length === 0) {
    logger.warn('Recommendation Builder', 'Analysis unavailable');
    return {
      decision: "Unable to Analyze",
      reason: "Analysis unavailable."
    };
  }

  const { company = {}, financials = {}, news = [], filings = {}, metadata = {} } = research;

  const getSourceStatus = (sourceName) => {
    if (metadata.completedSources?.includes(sourceName)) return "Success";
    if (metadata.failedSources?.includes(sourceName)) return "Failed";
    return "Unavailable";
  };

  // Compile final report with strict safe defaults to preserve frozen schema
  const finalReport = {
    company: {
      name: company.name || "Unknown",
      symbol: company.symbol || "Unknown",
      sector: company.sector || "Unknown"
    },
    recommendation: {
      decision: analysis.recommendation || "PASS",
      confidence: analysis.confidence || 0,
      grade: scoring.investmentGrade || "D",
      investmentScore: scoring.overallScore || 0,
      riskLevel: scoring.riskAdjustment < 0 ? "High" : "Low"
    },
    summary: analysis.summary || "Insufficient information.",
    reasoning: Array.isArray(analysis.reasoning) ? analysis.reasoning.join(" ") : (analysis.reasoning || "No reasoning provided."),
    strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
    weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
    opportunities: Array.isArray(analysis.opportunities) ? analysis.opportunities : [],
    risks: Array.isArray(analysis.risks) ? analysis.risks : [],
    financialHighlights: {
      marketCap: financials.marketCap || "N/A",
      currentPrice: financials.currentPrice || "N/A",
      peRatio: financials.peRatio || "N/A",
      revenue: financials.revenue || "N/A",
      priceTrend: financials.priceChangePercent !== "N/A" 
        ? `${financials.priceChangePercent > 0 ? '+' : ''}${(financials.priceChangePercent * 100).toFixed(2)}% (24H)` 
        : "N/A",
      marketCapTrend: financials.marketCap !== "N/A" 
        ? (financials.marketCap > 200e9 ? "MEGA-CAP TECH" : financials.marketCap > 10e9 ? "LARGE-CAP" : financials.marketCap > 2e9 ? "MID-CAP" : "SMALL-CAP") 
        : "N/A",
      revenueGrowth: financials.revenueGrowthRate !== "N/A" 
        ? `YOY: ${financials.revenueGrowthRate > 0 ? '+' : ''}${(financials.revenueGrowthRate * 100).toFixed(1)}%` 
        : "N/A",
      peTrend: "N/A",
      targetPrice: financials.targetPrice !== "N/A" ? `$${financials.targetPrice.toFixed(2)}` : "N/A"
    },
    newsHighlights: news.map(n => ({
      title: n.title || "No Title",
      summary: n.summary || "No Summary",
      url: n.url || "#"
    })),
    secHighlights: {
      latest10K: !!filings.latest10K && Object.keys(filings.latest10K).length > 0,
      latest10Q: !!filings.latest10Q && Object.keys(filings.latest10Q).length > 0,
      latest8K: !!filings.latest8K && Object.keys(filings.latest8K).length > 0,
      businessOverview: filings.businessOverview || "N/A",
      riskFactors: Array.isArray(filings.riskFactors) ? filings.riskFactors : []
    },
    scoreBreakdown: {
      // Bridging new deterministic fields to frozen API schema fields
      financialHealth: scoring.financialScore || 0,
      growth: scoring.secScore || 0,
      news: scoring.newsScore || 0,
      risk: scoring.riskAdjustment || 0,
      marketPosition: scoring.overallScore || 0
    },
    sources: [
      { name: "Yahoo Finance", status: getSourceStatus("Yahoo Finance") },
      { name: "Tavily", status: getSourceStatus("Tavily Search") },
      { name: "SEC EDGAR", status: getSourceStatus("SEC EDGAR") }
    ],
    generatedAt: new Date().toISOString()
  };

  logger.info('Recommendation Builder', 'Completed final report formatting');
  return finalReport;
};
