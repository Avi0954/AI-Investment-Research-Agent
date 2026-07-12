import axios from 'axios';

/**
 * api.js
 * 
 * Centralized API Service for connecting the React frontend to the Express backend.
 * Responsibilities:
 * - Configure Axios instance with timeouts and base URL.
 * - Map the exact backend JSON into frontend-ready properties securely.
 * - Standardize error handling and HTTP status parsing.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // The LLM workflow might take 5-15 seconds. Give it generous timeout.
  timeout: 60000, 
});

export const analyzeCompanyApi = async (companyName, abortSignal) => {
  try {
    // Pass the AbortController signal to allow request cancellation
    const response = await apiClient.post('/api/v1/analyze', { company: companyName }, { signal: abortSignal });
    
    // Normalize data strictly to prevent UI crashes if backend returns nulls
    const { data } = response.data;
    
    // Parse financial strings back into an object
    const rawFinancials = Array.isArray(data.financialHighlights) ? data.financialHighlights : [];
    const parsedFinancials = {};
    rawFinancials.forEach(item => {
      if (item.startsWith("MARKET CAP:")) parsedFinancials.marketCap = item.split(":")[1]?.trim();
      if (item.startsWith("CURRENT PRICE:")) parsedFinancials.currentPrice = item.split(":")[1]?.trim();
      if (item.startsWith("PE RATIO:")) parsedFinancials.peRatio = item.split(":")[1]?.trim();
      if (item.startsWith("REVENUE:")) parsedFinancials.revenue = item.split(":")[1]?.trim();
      
      // Parse new trend strings
      if (item.startsWith("PRICE TREND:")) parsedFinancials.priceTrend = item.replace("PRICE TREND:", "").trim();
      if (item.startsWith("MARKET CAP TREND:")) parsedFinancials.marketCapTrend = item.replace("MARKET CAP TREND:", "").trim();
      if (item.startsWith("REVENUE GROWTH:")) parsedFinancials.revenueGrowth = item.replace("REVENUE GROWTH:", "").trim();
      if (item.startsWith("PE TREND:")) parsedFinancials.peTrend = item.replace("PE TREND:", "").trim();
      if (item.startsWith("TARGET PRICE:")) parsedFinancials.targetPrice = item.replace("TARGET PRICE:", "").trim();
    });

    // Parse news strings back into objects
    const rawNews = Array.isArray(data.recentNews) ? data.recentNews : [];
    const parsedNews = rawNews.map(newsStr => {
      const parts = newsStr.split(" - ");
      return {
        title: parts.slice(0, -1).join(" - ") || newsStr,
        summary: parts.length > 1 ? `Source: ${parts[parts.length - 1]}` : "",
        url: "#",
        publishedAt: null
      };
    });

    // Extract sources from reasoning
    const rawReasoning = Array.isArray(data.reasoning) ? data.reasoning : [];
    const pureReasoning = [];
    const completedSources = [];
    const failedSources = [];
    
    rawReasoning.forEach(r => {
      if (r.startsWith("Source: ")) {
        if (r.includes("(Success)")) completedSources.push(r.replace("Source: ", "").replace(" (Success)", "").trim());
        else if (r.includes("(Failed)")) failedSources.push(r.replace("Source: ", "").replace(" (Failed)", "").trim());
      } else {
        pureReasoning.push(r);
      }
    });

    // Extract company symbol if present in string "Apple Inc. (AAPL)"
    let compName = data.company || companyName;
    let compSymbol = "N/A";
    if (typeof compName === 'string' && compName.includes("(") && compName.includes(")")) {
      const match = compName.match(/(.+)\s+\((.+)\)/);
      if (match) {
        compName = match[1].trim();
        compSymbol = match[2].trim();
      }
    }

    return {
      company: {
        name: data.companyDetails?.name || compName,
        symbol: data.companyDetails?.symbol || compSymbol,
        sector: data.companyDetails?.sector || "Not Available",
        industry: data.companyDetails?.industry || "Not Available"
      },
      summary: data.analysis?.summary || data.summary || "No summary provided.",
      financials: parsedFinancials,
      news: parsedNews,
      filings: data.secHighlights || {}, 
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
      risks: Array.isArray(data.risks) ? data.risks : [],
      opportunities: Array.isArray(data.opportunities) ? data.opportunities : [],
      recommendation: data.recommendation || "PASS",
      confidence: typeof data.confidence === 'number' ? data.confidence : 0,
      reasoning: pureReasoning,
      metadata: { completedSources, failedSources },
      executionTime: data.executionTime || null
    };
  } catch (error) {
    // 1. Handle Request Cancellation silently
    if (axios.isCancel(error)) {
      throw new Error("RequestCancelled");
    }
    
    // 2. Handle HTTP Errors returned by backend (e.g. 400, 404, 500)
    if (error.response) {
      const status = error.response.status;
      const serverMessage = error.response.data?.error?.message || error.response.data?.error;
      
      if (status === 400) throw new Error(serverMessage || "Invalid company name provided.");
      if (status === 404) throw new Error(serverMessage || "Company not found. Please try another name.");
      if (status === 429) throw new Error("Too many requests. Please slow down and try again later.");
      if (status === 504) throw new Error("The analysis timed out. The request took too long.");
      if (status === 500) throw new Error(serverMessage || "The AI analysis failed. Please try again.");
      
      throw new Error(serverMessage || "An unexpected server error occurred.");
    } 
    // 3. Handle Network / Timeout Errors
    else if (error.request) {
      throw new Error("Network timeout or backend server is unavailable. Please check your connection.");
    } 
    // 4. Handle unexpected client setup errors
    else {
      throw new Error("Failed to send the request. Please try again.");
    }
  }
};
