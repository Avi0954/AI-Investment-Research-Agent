import axios from 'axios';
import { getInvestmentPrompt } from '../prompts/investmentPrompt.js';
import { logger } from '../utils/logger.js';
import { recordMetric } from '../utils/metrics.js';
import { withRetry } from '../utils/retry.js';
import { withCache, CACHE_TTL } from '../utils/cache.js';

export const executeGeminiAnalysis = async (researchData) => {
  const companySymbol = researchData.company?.symbol || researchData.companyName || 'UNKNOWN';
  
  const fetcher = async () => {
    const prompt = getInvestmentPrompt(researchData);
    const start = Date.now();
    
    // Check if API key is provided
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not set in environment variables");
    }
    
    try {
      console.log("GEMINI START");
      const response = await withRetry(async () => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`;
        
        const payload = {
          systemInstruction: {
            parts: [{ text: 'You are an elite AI Investment Research Agent outputting JSON only.' }]
          },
          contents: [
            { parts: [{ text: prompt }] }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        };

        const res = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30 seconds
        });
        
        return res.data;
      }, 'Gemini');

      console.log("GEMINI END");
      const duration = Date.now() - start;
      recordMetric('Gemini', 'SUCCESS', duration);
      
      const usage = response.usageMetadata || {};
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: 'models.generateContent',
        model: 'gemini-1.5-flash',
        tokens: usage.totalTokenCount || 0,
        statusCode: 200,
        errorMessage: null
      }));

      if (!response.candidates || response.candidates.length === 0) {
         throw new Error("Empty response received from Gemini");
      }
      
      const content = response.candidates[0].content?.parts?.[0]?.text;
      if (!content) {
         throw new Error("Empty text in Gemini response");
      }
      
      return JSON.parse(content);
    } catch (error) {
      console.log("GEMINI END");
      const duration = Date.now() - start;
      
      const isTimeout = error.message && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'));
      recordMetric('Gemini', 'FAIL', duration, isTimeout);
      
      const statusCode = error.response?.status || error.status || 500;
      
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: 'models.generateContent',
        model: 'gemini-1.5-flash',
        tokens: null,
        statusCode: statusCode,
        errorMessage: error.message
      }));
      
      logger.error('Gemini', `LLM Analysis Failed: ${error.message}`);
      
      if (statusCode === 429 || (error.message && error.message.includes('429')) || (error.message && error.message.includes('quota'))) {
        throw new Error('Gemini 429: Rate limit or quota exceeded');
      }

      if (isTimeout || (error.message && error.message.includes('time'))) {
        throw new Error('Gemini Timeout: AI request timed out');
      }

      throw error;
    }
  };

  return withCache('Gemini', companySymbol, CACHE_TTL.GEMINI, fetcher);
};
