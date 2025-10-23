import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { vi } from "vitest";

// Setup DOM for testing
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();
