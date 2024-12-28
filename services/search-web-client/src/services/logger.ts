// src/services/logger.ts

export const logger = {
    info: (message: string) => {
      console.info(`[INFO]: ${message}`);
    },
    warn: (message: string) => {
      console.warn(`[WARN]: ${message}`);
    },
    error: (message: string) => {
      console.error(`[ERROR]: ${message}`);
    },
  };
  