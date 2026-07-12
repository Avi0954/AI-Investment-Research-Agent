/**
 * Mock Service to simulate AI Investment Research
 * This will be replaced by the LangGraph workflow in Phase 5.
 */
export const getMockAnalysis = async (companyName) => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    company: companyName,
    summary: `${companyName} is a mock company generated for the purpose of testing the AI Investment Research Agent architecture.`,
    financialHighlights: [
      "Revenue increased by 20% in the last fiscal year.",
      "Operating margins remain stable at 15%.",
      "Strong cash flow generation covering all capital expenditures."
    ],
    recentNews: [
      `${companyName} announces strategic partnership with leading tech firms.`,
      "Quarterly earnings exceed analyst expectations.",
      "New product line slated for release in Q3."
    ],
    analysis: {
      strengths: [
        "Robust balance sheet with low debt.",
        "Market leadership in core segments.",
        "High customer retention rate."
      ],
      weaknesses: [
        "Heavy reliance on a few key suppliers.",
        "Slower growth in international markets."
      ],
      risks: [
        "Potential regulatory changes impacting the industry.",
        "Increasing competition from emerging startups."
      ]
    },
    recommendation: "INVEST",
    confidence: 85,
    reasoning: [
      "Strong financial health mitigates short-term market volatility.",
      "Recent strategic moves position the company well for future growth.",
      "Valuation remains attractive relative to peers."
    ]
  };
};
