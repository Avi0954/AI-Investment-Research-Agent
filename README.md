# AI Investment Research Agent

## Overview

The AI Investment Research Agent is a full-stack web application designed to analyze publicly traded companies using AI. The project solves the problem of manual, time-consuming financial research by aggregating disparate data sources into a unified, actionable report. The primary objective is to streamline the investment research process by providing an automated Buy, Hold, or Sell recommendation alongside a detailed explanation.

The workflow leverages a Node.js and Express.js backend where a LangGraph pipeline coordinates the data collection. It fetches financial metrics from Yahoo Finance, market news from Tavily Search, and official SEC filings from SEC EDGAR. This raw data is cached using Node Cache and processed through a deterministic investment scoring engine. Finally, the Google Gemini API synthesizes the information into a comprehensive report. The results are securely delivered via Axios to a React.js frontend, bundled with Vite and styled with Tailwind CSS, where users can interact with the insights in a clean, minimalist interface. The application is secured using Helmet, CORS, and Express Rate Limiter, and uses Winston Logger for reliable monitoring.

---

# 🚀 Live Deployment

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://ai-investment-research-agent-frtnd.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Avi0954/AI-Investment-Research-Agent)

### 🌐 Live Application

**Frontend:**  
https://ai-investment-research-agent-frtnd.vercel.app

### 💻 Source Code

**GitHub Repository:**  
https://github.com/Avi0954/AI-Investment-Research-Agent

> **Note**
>
> The application is deployed on **Vercel** and connected to the backend services. AI-powered features require valid API keys and may be subject to provider rate limits.

---

## How to Run It

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Git

### Repository Cloning
```bash
git clone https://github.com/<your-username>/AI-Investment-Research-Agent.git
cd AI-Investment-Research-Agent
```

### Environment Variables
You must configure your API keys before running the backend. In the `backend` directory, create a `.env` file and define the following variables:

**Example `.env`:**
```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here
GOOGLE_API_KEY=your_google_gemini_api_key_here
TAVILY_API_KEY=your_tavily_search_api_key_here
```

### Backend Installation and Startup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Installation and Startup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## How It Works

The application operates on a sequential, agentic workflow:

1. **User Input:** The user enters a company name or ticker symbol into the React frontend.
2. **Request Dispatch:** The frontend sends a POST request to the Express backend.
3. **Workflow Initialization:** The backend receives the request and triggers the LangGraph execution pipeline.
4. **Data Collection (Research Node):** The LangGraph workflow simultaneously fetches:
   - Financial data from Yahoo Finance.
   - Real-time market news from Tavily Search.
   - Official filings from the SEC EDGAR API.
5. **Data Aggregation:** The collected research from all providers is merged into a unified state.
6. **Deterministic Scoring:** The system calculates a baseline numerical investment score using hard financial metrics to ground the analysis.
7. **AI Analysis:** The Google Gemini API processes the aggregated data and deterministic score to generate a comprehensive, qualitative explanation and a Buy, Hold, or Sell recommendation.
8. **Final Response:** The complete report is returned to the frontend and displayed to the user.

```text
+---------------------+       +-------------------------+
|    React Frontend   |       |     Express Backend     |
|   (User Input)      |------>|   (Receives Request)    |
+---------------------+       +-------------------------+
                                          |
                                          v
                              +-------------------------+
                              |   LangGraph Execution   |
                              +-------------------------+
                                          |
                   +----------------------+----------------------+
                   |                      |                      |
                   v                      v                      v
          +-----------------+    +-----------------+    +-----------------+
          |  Yahoo Finance  |    |  Tavily Search  |    |    SEC EDGAR    |
          |     (Data)      |    |      (News)     |    |    (Filings)    |
          +-----------------+    +-----------------+    +-----------------+
                   |                      |                      |
                   +----------------------+----------------------+
                                          |
                                          v
                              +-------------------------+
                              |      Merged State       |
                              +-------------------------+
                                          |
                                          v
                              +-------------------------+
                              |  Deterministic Scoring  |
                              +-------------------------+
                                          |
                                          v
                              +-------------------------+
                              |  Google Gemini Analysis |
                              +-------------------------+
                                          |
                                          v
+---------------------+       +-------------------------+
|    React Frontend   |<------|     Final Response      |
|  (Displays Report)  |       |  (Score & Explanation)  |
+---------------------+       +-------------------------+
```

## Key Decisions & Trade-offs

- **Why React:** Chosen for its component-based architecture, which allows for a highly interactive and state-driven dashboard to present complex financial data smoothly.
- **Why Express:** A minimal and flexible Node.js framework that efficiently handles the REST API, middleware integration, and orchestrates the backend logic without unnecessary bloat.
- **Why LangGraph:** Preferred over raw LLM calls or basic LangChain because it provides robust state management, cyclic execution paths, and distinct nodes for data fetching, preventing the LLM from hallucinating data it doesn't possess.
- **Why Google Gemini:** Selected for its large context window and strong reasoning capabilities, which are essential for synthesizing dense financial texts, news, and SEC filings.
- **Why deterministic scoring:** AI models can struggle with raw mathematical calculations. By evaluating financial metrics deterministically first, the LLM is anchored to objective reality, improving the reliability of its final recommendation.
- **Why multiple data providers:** Relying on a single source is insufficient for investment research. Yahoo provides quantitative metrics, Tavily provides qualitative sentiment, and SEC provides regulatory truth.

### Intentional Omissions and Trade-offs

- **Authentication:** Left out to prioritize the core AI pipeline and keep the MVP focused on the research engine rather than user management.
- **Portfolio Management & Database:** Omitted to avoid the overhead of state persistence. The current system is completely stateless, acting as an on-demand analysis tool rather than a historical ledger.
- **Historical Tracking:** Not implemented in order to keep the API payload small and focus solely on point-in-time analysis.
- **Real-time Streaming:** The LangGraph pipeline returns a single unified JSON response. Streaming was omitted because deterministic scoring requires the entire dataset to be compiled before the LLM can finalize its recommendation.

## Example Runs

### Microsoft
- **Company Name:** Microsoft Corporation
- **Investment Score:** 88/100
- **Recommendation:** BUY
- **Key Strengths:** Strong cloud computing revenue growth, successful AI integrations across enterprise products, and a highly robust balance sheet.
- **Potential Risks:** High premium valuation limits short-term upside, and intense competition in the AI and cloud infrastructure markets.
- **Summary:** Microsoft exhibits exceptional financial health and market dominance. While the valuation is high, its continued revenue expansion in Azure and enterprise software justifies a strong buy recommendation for long-term growth.

### Apple
- **Company Name:** Apple Inc.
- **Investment Score:** 76/100
- **Recommendation:** HOLD
- **Key Strengths:** Unmatched free cash flow, incredible brand loyalty, and a highly profitable services ecosystem.
- **Potential Risks:** Slowing hardware upgrade cycles, regulatory pressures in key markets, and reliance on iPhone sales.
- **Summary:** Apple remains a defensive powerhouse with strong capital returns. However, due to hardware stagnation and regulatory headwinds, it presents limited immediate upside, making it a solid hold.

### Tesla
- **Company Name:** Tesla Inc.
- **Investment Score:** 54/100
- **Recommendation:** HOLD
- **Key Strengths:** Leading market share in EVs, strong energy storage growth, and significant advancements in autonomous driving narratives.
- **Potential Risks:** Severe automotive margin compression, price wars, and highly volatile stock performance driven by sentiment.
- **Summary:** Tesla is a highly volatile asset. While its long-term potential in energy and autonomy is significant, the current margin compression and intensifying competition in the EV sector warrant a cautious approach.

### Tata Motors
- **Company Name:** Tata Motors Limited
- **Investment Score:** 72/100
- **Recommendation:** BUY
- **Key Strengths:** Strong profitability turnaround at Jaguar Land Rover, dominance in the Indian EV market, and successful debt reduction.
- **Potential Risks:** Vulnerability to global macroeconomic slowdowns and supply chain disruptions affecting vehicle production.
- **Summary:** Tata Motors has demonstrated a strong operational turnaround. With JLR margins improving and a firm grip on the domestic EV market, the company is well-positioned for continued growth.

## What You Would Improve With More Time

- **User Authentication:** Add secure login and user accounts for a personalized experience.
- **Portfolio Tracking:** Allow users to save companies and track their investment portfolios.
- **Database Integration:** Store user data, analysis history, and reports using PostgreSQL or MongoDB.
- **Historical Charts:** Display stock price history and financial trends to help users make better investment decisions.
- **Redis Caching:** Improve application performance by using Redis for faster data retrieval.
- **Docker Support:** Containerize the application to simplify deployment and maintain consistent environments.
- **CI/CD Pipeline:** Automate testing and deployment using GitHub Actions.
- **Automated Testing:** Add unit and integration tests to improve reliability and maintainability.
- **PDF Report Export:** Allow users to download AI-generated investment reports as PDF files.
- **Real-Time Updates:** Show live stock prices and analysis progress using WebSockets.

Implementing these enhancements would significantly improve the scalability, usability, and overall robustness of the application.

## LLM Development Logs

This project was developed with the assistance of AI. ChatGPT, Google gemini pro 3.1 was utilized throughout the software development lifecycle to accelerate building the application. 

Specifically, the AI assistant helped during:
- **Project planning:** Scoping the requirements and outlining the necessary steps to build a full-stack AI agent.
- **Architecture design:** Deciding on the microservices structure and how the Express backend would communicate with the React frontend.
- **LangGraph workflow:** Structuring the parallel execution nodes to fetch from Yahoo, Tavily, and SEC simultaneously before aggregating the state.
- **Prompt engineering:** Iteratively refining the instructions sent to the Google Gemini API to ensure a strict JSON output format and grounded reasoning.
- **Backend development:** Scaffolding the Express server, setting up Axios requests, and configuring middleware like Helmet and rate limiters.
- **Frontend development:** Creating responsive UI components in React and rapidly styling them using Tailwind CSS.
- **Debugging:** Troubleshooting complex asynchronous errors in Node.js and resolving CORS configuration issues between Vite and Express.
- **Deployment:** Assisting with environment variable configurations and preparing the application for hosting.
- **Documentation:** Helping structure and write clear, concise code comments and README files.

The chat session transcripts have been included in the submission (within the `llm-transcripts/` directory) to demonstrate the complete AI-assisted development and thought process.
