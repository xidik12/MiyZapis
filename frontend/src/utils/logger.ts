// Simple logger utility for development and production environments
const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    console.info(...args);
  },

  warn: (...args: any[]) => {
    console.warn(...args);
  },

  error: (...args: any[]) => {
    console.error(...args);
  },

  log: (...args: any[]) => {
    console.log(...args);
  }
};
