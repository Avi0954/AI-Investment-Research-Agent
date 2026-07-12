import { executeGroqAnalysis } from '../../services/groqService.js';
import { calculateInvestmentScore } from '../../services/scoringService.js';
import { logger } from '../../utils/logger.js';

export const analysisNode = async (state) => {
  const { research } = state;
  const start = Date.now();
  
  logger.info('LangGraph', `[analysisNode] Started`);

  try {
    // 1. Calculate deterministic investment score
    const deterministicScore = calculateInvestmentScore(research);
    
    // 2. Attach the deterministic score to the research data payload for the LLM
    const enrichedResearch = {
      ...research,
      scoring: deterministicScore
    };

    // 3. Hand off the enriched object exclusively to the Groq service
    const llmAnalysis = await executeGroqAnalysis(enrichedResearch);
    
    const duration = Date.now() - start;
    logger.info('LangGraph', `[analysisNode] Completed`, duration);
    
    return {
      ...state,
      research: enrichedResearch, // Update state with the scored research
      analysis: llmAnalysis, 
      status: "Analysis Completed"
    };
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('LangGraph', `[analysisNode] Failed: ${error.message}`, duration);
    throw error;
  }
};
