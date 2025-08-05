import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test defaults
process.env.NODE_ENV = 'test';
process.env.TRADING_ENABLED = 'false';
process.env.LOG_LEVEL = 'error';

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};