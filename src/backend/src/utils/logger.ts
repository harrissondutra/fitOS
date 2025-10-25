// Log levels enum
enum LogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Get current log level from environment
const getLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  const isDebug = process.env.DEBUG === 'true';
  
  // Override with DEBUG if DEBUG=true
  if (isDebug) return LogLevel.DEBUG;
  
  // Map environment variables to log levels
  switch (envLevel) {
    case 'SILENT': return LogLevel.SILENT;
    case 'ERROR': return LogLevel.ERROR;
    case 'WARN': return LogLevel.WARN;
    case 'INFO': return LogLevel.INFO;
    case 'DEBUG': return LogLevel.DEBUG;
    default: 
      // Default: WARN in dev, ERROR in prod
      return process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.WARN;
  }
};

// Format timestamp
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().substring(11, 23); // HH:mm:ss.SSS
};

// Format log message with colors and timestamp
const formatMessage = (level: string, message: string, color: string): string => {
  const timestamp = process.env.LOG_TIMESTAMPS === 'true' ? `[${getTimestamp()}] ` : '';
  return `${color}[${level}]${colors.reset} ${timestamp}${message}`;
};

// Current log level
const currentLogLevel = getLogLevel();

export const logger = {
  error: (message: string, meta?: any) => {
    if (currentLogLevel >= LogLevel.ERROR) {
      const formatted = formatMessage('ERROR', message, colors.red);
      console.error(formatted, meta || '');
    }
  },
  
  warn: (message: string, meta?: any) => {
    if (currentLogLevel >= LogLevel.WARN) {
      const formatted = formatMessage('WARN', message, colors.yellow);
      console.warn(formatted, meta || '');
    }
  },
  
  info: (message: string, meta?: any) => {
    if (currentLogLevel >= LogLevel.INFO) {
      const formatted = formatMessage('INFO', message, colors.blue);
      console.log(formatted, meta || '');
    }
  },
  
  debug: (message: string, meta?: any) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      const formatted = formatMessage('DEBUG', message, colors.gray);
      console.debug(formatted, meta || '');
    }
  },
  
  // Performance logging
  perf: (operation: string, startTime: number, meta?: any) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      const duration = Date.now() - startTime;
      const formatted = formatMessage('PERF', `${operation} took ${duration}ms`, colors.cyan);
      console.debug(formatted, meta || '');
    }
  },
  
  // Query logging (only when DEBUG_QUERIES=true)
  query: (query: string, params: any, duration: number) => {
    if (process.env.DEBUG_QUERIES === 'true' && currentLogLevel >= LogLevel.DEBUG) {
      const formatted = formatMessage('QUERY', `${query} (${duration}ms)`, colors.green);
      console.debug(formatted, { params });
    }
  },
  
  // Get current log level for debugging
  getCurrentLevel: () => LogLevel[currentLogLevel],
  
  // Check if a level is enabled
  isLevelEnabled: (level: keyof typeof LogLevel) => currentLogLevel >= LogLevel[level]
};