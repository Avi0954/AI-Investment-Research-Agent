import axios from 'axios';
import { getInvestmentPrompt } from '../prompts/investmentPrompt.js';
import { logger } from '../utils/logger.js';
import { recordMetric } from '../utils/metrics.js';
import { withRetry } from '../utils/retry.js';
import { withCache, CACHE_TTL } from '../utils/cache.js';

export const executeGroqAnalysis = async (researchData) => {
  const companySymbol = researchData.company?.symbol || researchData.companyName || 'UNKNOWN';
  
  const fetcher = async () => {
    const prompt = getInvestmentPrompt(researchData);
    const start = Date.now();
    try {
      const response = await withRetry(async () => {
        return await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are an elite AI Investment Research Agent outputting JSON only.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 2048
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000
          }
        );
      }, 'Groq');

      const duration = Date.now() - start;
      recordMetric('Groq', 'SUCCESS', duration);
      
      const usage = response.data.usage || {};
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/chat/completions',
        model: 'llama-3.3-70b-versatile',
        tokens: usage.total_tokens || 0,
        statusCode: response.status,
        errorMessage: null
      }));

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      const duration = Date.now() - start;
      const isTimeout = error.code === 'ECONNABORTED' || error.name === 'TimeoutError';
      recordMetric('Groq', 'FAIL', duration, isTimeout);
      
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/chat/completions',
        model: 'llama-3.3-70b-versatile',
        tokens: null,
        statusCode: error.response?.status || 500,
        errorMessage: error.message
      }));
      
      logger.error('Groq', `LLM Analysis Failed: ${error.message}`);
      throw error;
    }
  };

  return withCache('Groq', companySymbol, CACHE_TTL.GROQ, fetcher);
};
