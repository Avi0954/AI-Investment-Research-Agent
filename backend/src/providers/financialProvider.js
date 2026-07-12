import axios from 'axios';

/**
 * SEC EDGAR Provider
 * Collects latest 10-K, 10-Q, 8-K filings via SEC EFTS Search API.
 */
export const getFinancialHighlights = async (companyName) => {
  try {
    const response = await axios.post('https://efts.sec.gov/LATEST/search-index', {
      q: companyName,
      dateRange: "1y",
      category: "custom",
      forms: ["10-K", "10-Q", "8-K"]
    }, {
      headers: {
        'User-Agent': 'AIInvestmentResearchAgent avinash1317k@gmail.com'
      },
      timeout: 5000 // Ensure we don't hang the parallel execution
    });

    if (response.data && response.data.hits && response.data.hits.hits) {
      return response.data.hits.hits.slice(0, 5).map(hit => ({
        form: hit._source.form,
        date: hit._source.file_date,
        title: hit._source.display_names?.[0] || 'Unknown Company Filing'
      }));
    }
    return [];
  } catch (error) {
    console.error("[SEC EDGAR] Error:", error.message);
    throw error;
  }
};
