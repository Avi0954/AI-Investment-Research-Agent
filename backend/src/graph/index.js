import { StateGraph, START, END } from '@langchain/langgraph';
import { GraphState } from './state.js';
import { researchNode } from './nodes/researchNode.js';
import { scoringNode } from './nodes/scoringNode.js';
import { analysisNode } from './nodes/analysisNode.js';
import { recommendationNode } from './nodes/recommendationNode.js';

/**
 * Graph Builder
 * Connects the nodes in a strict linear sequence:
 * START -> research -> analysis -> recommendation -> END
 * 
 * This sequence is chosen because each step strictly depends on the output
 * of the previous step. We cannot analyze without research, and we cannot
 * recommend without analysis.
 */
const builder = new StateGraph(GraphState)
  .addNode("researchNode", researchNode, { retryPolicy: { maxRetries: 1 } })
  .addNode("scoringNode", scoringNode, { retryPolicy: { maxRetries: 1 } })
  .addNode("analysisNode", analysisNode, { retryPolicy: { maxRetries: 1 } })
  .addNode("recommendationNode", recommendationNode, { retryPolicy: { maxRetries: 1 } })
  .addEdge(START, "researchNode")
  .addEdge("researchNode", "scoringNode")
  .addEdge("scoringNode", "analysisNode")
  .addEdge("analysisNode", "recommendationNode")
  .addEdge("recommendationNode", END);

export const investmentGraph = builder.compile();
