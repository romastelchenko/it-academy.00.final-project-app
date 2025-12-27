import '@testing-library/jest-dom/vitest';

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (message.includes('React Router Future Flag Warning')) {
    return;
  }
  originalWarn(...args);
};
