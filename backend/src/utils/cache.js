import { logger } from './logger.js';
import { recordMetric } from './metrics.js';

const cacheStore = new Map();

export const CACHE_TTL = {
  YAHOO: 10 * 60 * 1000,
  TAVILY: 15 * 60 * 1000,
  SEC: 24 * 60 * 60 * 1000,
  GROQ: 10 * 60 * 1000,
  MERGED: 10 * 60 * 1000
};

const normalizeKey = (provider, company) => {
  const normalized = (company || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return `${provider}:${normalized}`;
};

export const withCache = async (provider, company, ttl, fetcher, isCacheable = (data) => true) => {
  const key = normalizeKey(provider, company);
  const now = Date.now();

  const cached = cacheStore.get(key);
  if (cached) {
    if (cached.expires > now && cached.status === 'resolved') {
      logger.info('Cache', `Cache HIT for ${key}`);
      recordMetric('Cache', 'HIT');
      return cached.data;
    }
    
    // Deduplication (Simultaneous Requests)
    if (cached.status === 'pending') {
      logger.info('Cache', `Deduplication WAIT for ${key}`);
      return await cached.promise;
    }
  }

  logger.info('Cache', `Cache MISS for ${key}`);
  recordMetric('Cache', 'MISS');

  const promise = fetcher().then((data) => {
    if (!isCacheable(data)) {
      logger.info('Cache', `Cache BYPASSED for ${key} (Validation Failed)`);
      cacheStore.delete(key);
      return data;
    }

    cacheStore.set(key, {
      status: 'resolved',
      data,
      expires: Date.now() + ttl
    });
    logger.info('Cache', `Cache STORED for ${key}`);
    recordMetric('Cache', 'STORED');
    return data;
  }).catch((error) => {
    cacheStore.delete(key);
    throw error;
  });

  cacheStore.set(key, {
    status: 'pending',
    promise,
    expires: Date.now() + ttl
  });

  return await promise;
};

// Memory Management: Cleanup expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cacheStore.entries()) {
    if (value.expires < now && value.status === 'resolved') {
      cacheStore.delete(key);
      logger.debug('Cache', `Cache EXPIRED and removed for ${key}`);
    }
  }
}, 5 * 60 * 1000).unref();
