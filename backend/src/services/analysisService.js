import { investmentGraph } from '../graph/index.js';

/**
 * runInvestmentGraph
 * Executes the LangGraph workflow and maps the resulting state to the API response format.
 */
export const runInvestmentGraph = async (company) => {
  if (!company || company.trim() === '') {
    throw new Error("Missing Company name for analysis.");
  }

  console.log(`\n[Graph Execution]: Started for company: ${company}`);
  const startTime = Date.now();
  
  try {
    const initialState = { company: company.trim(), status: "Started" };
    
    // Execute the LangGraph workflow with a strict recursion limit
    const finalState = await investmentGraph.invoke(initialState, { recursionLimit: 10 });
    console.log("GRAPH END");
    
    const duration = Date.now() - startTime;
    console.log(`[Graph Execution]: Completed in ${duration}ms`);
    console.log(`[Graph Execution]: Final Status -> ${finalState.status}\n`);
    
    // Map LangGraph unified report state to frontend API expected format
    const report = typeof finalState.recommendation === 'object' ? finalState.recommendation : {};
    const companyObj = report.company || {};
    const recObj = report.recommendation || {};

    const companyLabel = companyObj.name 
      ? `${companyObj.name} (${companyObj.symbol || 'N/A'})` 
      : finalState.company;

    const finHighlights = report.financialHighlights 
      ? Object.entries(report.financialHighlights).map(([k,v]) => `${k.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${v}`) 
      : ["No financial data available"];

    const newsArr = Array.isArray(report.newsHighlights)
      ? report.newsHighlights.map(n => n.title) 
      : ["No recent news available"];

    const sources = Array.isArray(report.sources)
      ? report.sources.map(s => `Source: ${s.name} (${s.status})`)
      : [];

    return {
      company: companyLabel,
      companyDetails: companyObj,
      summary: report.summary || "No summary available.",
      financialHighlights: finHighlights,
      recentNews: newsArr,
      strengths: report.strengths || [],
      weaknesses: report.weaknesses || [],
      risks: report.risks || [],
      opportunities: report.opportunities || [],
      secHighlights: report.secHighlights || {},
      recommendation: recObj.decision || "PASS",
      confidence: recObj.confidence || 0,
      reasoning: [report.reasoning || "No reasoning provided.", ...sources],
      executionTime: duration
    };
  } catch (error) {
    console.error(`[Graph Execution Error]: ${error.message}`);
    throw new Error(`Graph Execution Failed: ${error.message}`);
  }
};
