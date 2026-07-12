export const providerMetrics = {
  Yahoo: { success: 0, fail: 0, timeouts: 0, durations: [] },
  Tavily: { success: 0, fail: 0, timeouts: 0, durations: [] },
  SEC: { success: 0, fail: 0, timeouts: 0, durations: [] },
  Gemini: { success: 0, fail: 0, timeouts: 0, durations: [] },
  Merge: { success: 0, fail: 0, timeouts: 0, durations: [] },
  Cache: { hits: 0, misses: 0, stored: 0 }
};

export const recordMetric = (provider, status, duration = 0, isTimeout = false) => {
  if (!providerMetrics[provider]) return;
  
  if (provider === 'Cache') {
    if (status === 'HIT') providerMetrics.Cache.hits++;
    if (status === 'MISS') providerMetrics.Cache.misses++;
    if (status === 'STORED') providerMetrics.Cache.stored++;
    return;
  }

  if (status === 'SUCCESS') {
    providerMetrics[provider].success++;
    if (duration) providerMetrics[provider].durations.push(duration);
  } else {
    providerMetrics[provider].fail++;
    if (isTimeout) providerMetrics[provider].timeouts++;
  }
};

export const getMetricsSummary = () => {
  const summary = {};
  for (const [provider, stats] of Object.entries(providerMetrics)) {
    if (provider === 'Cache') {
      summary[provider] = {
        Hits: stats.hits,
        Misses: stats.misses,
        Stored: stats.stored
      };
      continue;
    }

    const avg = stats.durations.length ? Math.round(stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length) : 0;
    summary[provider] = {
      Success: stats.success,
      Failed: stats.fail,
      Timeouts: stats.timeouts,
      AvgDuration: `${avg}ms`
    };
  }
  return summary;
};
