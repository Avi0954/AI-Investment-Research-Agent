export class ProviderError extends Error {
  constructor(message, provider, severity = "error", recoverable = true) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.timestamp = new Date().toISOString();
    this.severity = severity;
    this.recoverable = recoverable;
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.timestamp = new Date().toISOString();
    this.severity = "warning";
    this.recoverable = false;
  }
}

export class TimeoutError extends ProviderError {
  constructor(provider) {
    super(`${provider} request timed out`, provider, "warning", true);
    this.name = "TimeoutError";
  }
}
