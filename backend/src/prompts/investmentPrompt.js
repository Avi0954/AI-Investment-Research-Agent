export const getInvestmentPrompt = (researchData) => {
  return `
You are a Senior Financial Analyst and AI Investment Research Agent.
Analyze the provided company research data and generate a structured investment report.

MERGED RESEARCH DATA:
${JSON.stringify(researchData.company, null, 2)}

INVESTMENT SCORE:
${JSON.stringify(researchData.investmentScore, null, 2)}

RECENT NEWS (Tavily):
${JSON.stringify(researchData.news, null, 2)}

SEC FILINGS:
${JSON.stringify(researchData.filings, null, 2)}

SOURCES:
${JSON.stringify(researchData.metadata?.sources, null, 2)}

INSTRUCTIONS:
1. Generate a Summary based on the Business Overview, SEC Findings, and Recent News.
2. Identify Strengths and Weaknesses based on the Financial Summary and Score.
3. Identify Risks based on SEC Findings and News.
4. Recommendation MUST be "INVEST" or "PASS".
5. Provide a Confidence score between 0 and 100 based on the Investment Score and data.
6. Provide reasoning bullet points.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching the exact structure below. No markdown formatting.

{
  "summary": "2-3 sentence overview.",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "risks": ["risk 1", "risk 2"],
  "recommendation": "INVEST",
  "confidence": 85,
  "reasoning": ["reason 1", "reason 2"]
}
`;
};
