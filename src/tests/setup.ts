import '@testing-library/jest-dom';

// Mock ResizeObserver for jsdom environment (required by React Flow)
if (typeof window !== 'undefined') {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = window.ResizeObserver || MockResizeObserver;
  // @ts-expect-error Mocking global ResizeObserver
  global.ResizeObserver = global.ResizeObserver || MockResizeObserver;
}

