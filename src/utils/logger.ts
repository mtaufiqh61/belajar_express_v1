import pino from "pino";

const LOG_LEVEL = {
    development: 'debug',
    test: 'silent',
    production: 'info'
}

const level = LOG_LEVEL[(process.env.NODE_ENV ?? 'production') as keyof typeof LOG_LEVEL] ?? 'info';

export const logger = pino({
  level,
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    : undefined
});