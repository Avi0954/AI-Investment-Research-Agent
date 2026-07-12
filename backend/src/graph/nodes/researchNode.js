import { gatherResearch } from '../../services/researchService.js';
import { logger } from '../../utils/logger.js';

export const researchNode = async (state) => {
  const { company } = state;
  const start = Date.now();
  
  logger.info('LangGraph', `[researchNode] Started for: ${company}`);

  try {
    const researchData = await gatherResearch(company);
    const duration = Date.now() - start;
    logger.info('LangGraph', `[researchNode] Completed`, duration);
    
    return {
      ...state,
      research: researchData,
      status: "Research Completed"
    };
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('LangGraph', `[researchNode] Failed: ${error.message}`, duration);
    throw error;
  }
};
