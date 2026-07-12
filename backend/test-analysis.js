import { executeGeminiAnalysis } from './src/services/geminiService.js';
import dotenv from 'dotenv';
dotenv.config();

const mockData = {
  company: { symbol: 'MSFT', name: 'Microsoft' },
  yahoo: { price: 400, eps: 10 },
  sec: { latestFiling: '10-K ...' },
  tavily: { news: 'Microsoft does AI' }
};

executeGeminiAnalysis(mockData)
  .then(res => console.log("Success:", res))
  .catch(err => {
    console.error("Error:", err.message);
  });
