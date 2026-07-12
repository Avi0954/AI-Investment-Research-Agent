import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/index.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { logger } from './utils/logger.js';

// Step 7: Environment Validation
const requiredEnvVars = ['GOOGLE_API_KEY', 'TAVILY_API_KEY', 'SEC_USER_AGENT', 'REQUEST_TIMEOUT'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  console.error(`[Startup Error]: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Process-level exception handling
process.on('uncaughtException', (err) => {
  logger.error('Process', `Uncaught Exception: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Process', `Unhandled Promise Rejection: ${reason}`);
});

const app = express();

// Step 1: HTTP Security Headers
app.use(helmet());

// Step 2: CORS Hardening
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173', 'https://ai-investment-research-agent-frtnd.vercel.app'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('Security', `Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Step 6: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes" },
  handler: (req, res, next, options) => {
    logger.warn('Security', `Rate limit violation from IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  }
});
app.use('/api', limiter);

// Step 3: Request Size Limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(requestLogger);

// Step 12: Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'AI Investment Research API running'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

// Handle 404
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
