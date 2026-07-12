import { logger } from '../utils/logger.js';

/**
 * Deterministic Investment Scoring Engine
 * Performs all pure-logic scoring based strictly on available research data.
 * No AI or external APIs are used here.
 */
export const calculateInvestmentScore = (researchData) => {
  const start = Date.now();
  logger.info('Scoring Engine', 'Started deterministic investment scoring');

  let financialScore = 0; // Max 45
  let newsScore = 0; // Max 20
  let secScore = 0; // Max 15
  let riskAdjustment = 0; // Deductions
  const reasons = [];

  const { company, financials, news, filings } = researchData || {};

  // ----------------------------------------
  // 1. Evaluate Financials (Max 45)
  // ----------------------------------------
  if (financials) {
    if (financials.revenue > 1e9) {
      financialScore += 15;
      reasons.push("Strong revenue generation (>$1B).");
    } else if (financials.revenue > 0) {
      financialScore += 10;
      reasons.push("Positive revenue reported.");
    } else {
      riskAdjustment -= 10;
      reasons.push("Missing or zero revenue data.");
    }

    if (financials.peRatio > 0 && financials.peRatio <= 30) {
      financialScore += 15;
      reasons.push("Healthy P/E ratio (<30).");
    } else if (financials.peRatio > 30) {
      financialScore += 10;
      reasons.push("High P/E ratio, indicating potential overvaluation.");
    } else {
      riskAdjustment -= 5;
      reasons.push("Missing P/E ratio.");
    }

    if (financials.marketCap > 1e9) {
      financialScore += 15;
      reasons.push("Large-cap company (>$1B).");
    } else if (financials.marketCap > 0) {
      financialScore += 10;
      reasons.push("Positive market capitalization.");
    } else {
      riskAdjustment -= 5;
      reasons.push("Missing market cap data.");
    }
  } else {
    riskAdjustment -= 20;
    reasons.push("Complete lack of financial data.");
  }

  // ----------------------------------------
  // 2. Evaluate News (Max 20)
  // ----------------------------------------
  if (news && Array.isArray(news)) {
    if (news.length >= 4) {
      newsScore += 20;
      reasons.push("Extensive recent news coverage (4+ articles).");
    } else if (news.length >= 2) {
      newsScore += 10;
      reasons.push("Moderate recent news coverage.");
    } else if (news.length === 1) {
      newsScore += 5;
      reasons.push("Limited recent news coverage (1 article).");
    } else {
      riskAdjustment -= 5;
      reasons.push("No recent news articles found.");
    }
  }

  // ----------------------------------------
  // 3. Evaluate SEC Filings (Max 15)
  // ----------------------------------------
  let hasFilings = false;
  if (filings) {
    if (filings.latest10K && Object.keys(filings.latest10K).length > 0) {
      secScore += 10;
      hasFilings = true;
      reasons.push("Recent 10-K (Annual Report) available.");
    }
    if (filings.latest10Q && Object.keys(filings.latest10Q).length > 0) {
      secScore += 5;
      hasFilings = true;
      reasons.push("Recent 10-Q (Quarterly Report) available.");
    }
  }
  if (!hasFilings) {
    riskAdjustment -= 5;
    reasons.push("No recent SEC filings available.");
  }

  // ----------------------------------------
  // 4. Overall Company Risk
  // ----------------------------------------
  if (!company || !company.name || company.name.toLowerCase() === "unknown" || company.name === "Unknown") {
    riskAdjustment -= 30;
    reasons.push("Company name is completely unknown or invalid.");
  }

  // ----------------------------------------
  // Calculate Overall Score (Max 80 initially, scaling to 100 below)
  // ----------------------------------------
  // Wait, max is 45 + 20 + 15 = 80? I'll scale it so max is 100.
  let rawScore = financialScore + newsScore + secScore;
  let scaledScore = (rawScore / 80) * 100;
  
  let overallScore = Math.round(scaledScore + riskAdjustment);
  
  // Clamp between 0 and 100
  overallScore = Math.max(0, Math.min(100, overallScore));

  // ----------------------------------------
  // Determine Investment Grade
  // ----------------------------------------
  let investmentGrade = "Pass";
  if (overallScore >= 90) investmentGrade = "Strong Invest";
  else if (overallScore >= 75) investmentGrade = "Invest";
  else if (overallScore >= 60) investmentGrade = "Watch";
  else if (overallScore >= 40) investmentGrade = "Speculative";

  const duration = Date.now() - start;
  logger.info('Scoring Engine', `Completed scoring: ${overallScore}/100 (${investmentGrade})`, duration);
  
  logger.info('Scoring Engine', `Financial: ${financialScore} | News: ${newsScore} | SEC: ${secScore} | Risk: ${riskAdjustment}`);

  return {
    financialScore,
    newsScore,
    secScore,
    riskAdjustment,
    overallScore,
    investmentGrade,
    deterministicReasons: reasons
  };
};
