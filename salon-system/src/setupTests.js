import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom does not implement window.scrollTo (used in Layout and elsewhere)
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
}