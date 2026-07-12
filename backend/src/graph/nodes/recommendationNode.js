import { buildFinalRecommendation } from '../../services/recommendationService.js';
import { logger } from '../../utils/logger.js';

export const recommendationNode = async (state) => {
  const start = Date.now();
  logger.info('LangGraph', `[recommendationNode] Started`);
  
  try {
    const finalReport = buildFinalRecommendation(state);
    const duration = Date.now() - start;
    logger.info('LangGraph', `[recommendationNode] Completed`, duration);

    return {
      recommendation: finalReport,
      status: "Recommendation Generated"
    };
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('LangGraph', `[recommendationNode] Failed: ${error.message}`, duration);
    throw error;
  }
};
