import { calculateInvestmentScore } from '../../services/scoringService.js';

/**
 * Scoring Node
 * Responsibility: Receive the merged research output, run a deterministic logic
 * calculation to grade the company, and inject it into the research payload 
 * BEFORE it gets evaluated by the Analysis Node.
 */
export const scoringNode = async (state) => {
  const { research } = state;
  console.log(`\n[Node Execution]: scoringNode | Calculating investment score...`);
  
  // Calculate deterministic score based on the normalized research
  const scoreData = calculateInvestmentScore(research);
  
  // Return the updated research state so the GraphState shape remains untouched
  // while satisfying the requirement to pass this to the Analysis Node.
  return {
    research: {
      ...research,
      investmentScore: scoreData
    },
    status: "Scoring Completed"
  };
};
