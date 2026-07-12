import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage();

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const getLogLevel = () => {
  const envLevel = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO')).toUpperCase();
  return LOG_LEVELS[envLevel] !== undefined ? LOG_LEVELS[envLevel] : LOG_LEVELS.INFO;
};

const maskSensitiveData = (str) => {
  if (typeof str !== 'string') return str;
  // Mask generic secrets if they ever get dumped in text
  return str.replace(/(eyJ[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,})|([a-zA-Z0-9]{32,})/g, '***MASKED***');
};

const formatLog = (level, component, message, duration = null) => {
  const context = asyncLocalStorage.getStore() || {};
  const reqId = context.reqId || 'SYSTEM';
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  let log = `[${timestamp}] [${reqId}] [${level}] [${component}] ${maskSensitiveData(message)}`;
  if (duration !== null) log += ` - ${duration}ms`;
  
  return log;
};

export const logger = {
  debug: (component, message, duration = null) => {
    if (getLogLevel() <= LOG_LEVELS.DEBUG) console.log(formatLog('DEBUG', component, message, duration));
  },
  info: (component, message, duration = null) => {
    if (getLogLevel() <= LOG_LEVELS.INFO) console.log(formatLog('INFO', component, message, duration));
  },
  warn: (component, message, duration = null) => {
    if (getLogLevel() <= LOG_LEVELS.WARN) console.warn(formatLog('WARN', component, message, duration));
  },
  error: (component, message, duration = null) => {
    if (getLogLevel() <= LOG_LEVELS.ERROR) console.error(formatLog('ERROR', component, message, duration));
  }
};
