import { tavily } from '@tavily/core';

/**
 * Tavily Search Provider
 * Collects Recent News, Developments, Updates.
 */
export const getRecentNews = async (companyName) => {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      console.warn("[Tavily] TAVILY_API_KEY missing. Returning empty array.");
      return [];
    }

    const client = tavily({ apiKey });
    const response = await client.search(`Latest business news and developments for ${companyName}`, {
      searchDepth: "advanced",
      topic: "news",
      maxResults: 5
    });

    return response.results.map(r => ({
      title: r.title,
      content: r.content,
      url: r.url
    }));
  } catch (error) {
    console.error("[Tavily] Error:", error.message);
    throw error;
  }
};
