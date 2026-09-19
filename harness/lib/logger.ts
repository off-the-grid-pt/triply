// logger.ts — structured harness logging via Pino.
//
// Usage:
//   import { createHarnessLogger } from '../lib/logger';
//   const logger = createHarnessLogger();
//   logger.info({ module: '01-auth-onboarding', stage: 'frontend' }, 'starting run');
//
// Environment variables:
//   HARNESS_LOG_PRETTY=1   — enable colorized human-readable output
//   HARNESS_LOG_LEVEL=info — set log level (default: silent)

import pino, { type Logger } from 'pino';

export interface HarnessLoggerOptions {
  pretty?: boolean;
  level?: string;
}

export function createHarnessLogger({
  pretty = process.env['HARNESS_LOG_PRETTY'] === '1',
  level = process.env['HARNESS_LOG_LEVEL'] ?? 'silent',
}: HarnessLoggerOptions = {}): Logger {
  return pino(
    pretty
      ? {
          level,
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' },
          },
        }
      : { level }
  );
}
