const DEBUG = true;

export const log = {
  info: (...args: any[]) => {
    if (DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (DEBUG) {
      console.error('[ERROR]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (DEBUG) {
      console.warn('[WARN]', ...args);
    }
  },
  event: (eventName: string, details?: any) => {
    if (DEBUG) {
      console.log(`[EVENT] ${eventName}`, details || '');
    }
  }
};
