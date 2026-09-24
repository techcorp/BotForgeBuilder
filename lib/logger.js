const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || "INFO"];

function timestamp() {
  return new Date().toISOString();
}

function format(level, message, data = {}) {
  return JSON.stringify({
    timestamp: timestamp(),
    level,
    message,
    ...data,
  });
}

export const logger = {
  debug: (message, data) => {
    if (LOG_LEVELS.DEBUG >= currentLevel) {
      console.log(format("DEBUG", message, data));
    }
  },
  info: (message, data) => {
    if (LOG_LEVELS.INFO >= currentLevel) {
      console.log(format("INFO", message, data));
    }
  },
  warn: (message, data) => {
    if (LOG_LEVELS.WARN >= currentLevel) {
      console.warn(format("WARN", message, data));
    }
  },
  error: (message, data) => {
    if (LOG_LEVELS.ERROR >= currentLevel) {
      console.error(format("ERROR", message, data));
    }
  },
};
