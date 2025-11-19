/**
 * Smart logger that sends to both console and LogBridge (production only)
 * Non-blocking - won't slow down your app if LogBridge is unreachable
 */

const LOGBRIDGE_URL = "https://replit-log-link-jack741.replit.app/api/logs";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogOptions {
  level?: LogLevel;
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * Send log to LogBridge (async, non-blocking)
 */
async function sendToLogBridge(
  level: LogLevel,
  message: string,
  source: string,
  metadata?: Record<string, any>
) {
  // Only send to LogBridge in production
  if (!IS_PRODUCTION) return;

  try {
    // Fire-and-forget - don't await, don't slow down the app
    fetch(LOGBRIDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level,
        message,
        source,
        app: "gabai-prod",
        metadata,
      }),
    }).catch(() => {
      // Silently ignore LogBridge errors - don't spam console
    });
  } catch (error) {
    // Ignore errors - logging should never break the app
  }
}

/**
 * Main logger function - always logs to console, sends to LogBridge in production
 */
export function log(message: string, options: LogOptions = {}) {
  const { level = "info", source = "gabai-backend", metadata } = options;

  // Always log to console
  const emoji = {
    error: "🔥",
    warn: "⚠️",
    info: "ℹ️",
    debug: "🔍",
  }[level];

  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${timestamp} [${source}] ${emoji} ${message}`);

  // Send to LogBridge in production (non-blocking)
  sendToLogBridge(level, message, source, metadata);
}

/**
 * Convenience methods for different log levels
 */
export const logger = {
  error: (message: string, source = "gabai-backend", metadata?: Record<string, any>) =>
    log(message, { level: "error", source, metadata }),

  warn: (message: string, source = "gabai-backend", metadata?: Record<string, any>) =>
    log(message, { level: "warn", source, metadata }),

  info: (message: string, source = "gabai-backend", metadata?: Record<string, any>) =>
    log(message, { level: "info", source, metadata }),

  debug: (message: string, source = "gabai-backend", metadata?: Record<string, any>) =>
    log(message, { level: "debug", source, metadata }),
};
