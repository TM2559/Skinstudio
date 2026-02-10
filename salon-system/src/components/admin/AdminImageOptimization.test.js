import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createOptimizedImageFile } from './AdminTransformationsSubTab';

// Helper to mock canvas and Image for resize logic
function setupDomMocks({ width = 4000, height = 2000 } = {}) {
  const originalImage = global.Image;
  const originalCreateElement = document.createElement;

  let createdCanvas = null;

  class FakeImage {
    constructor() {
      this.onload = null;
      this.onerror = null;
    }
    set src(_val) {
      // Simulate successful load with given dimensions
      this.width = width;
      this.height = height;
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  }

  document.createElement = (tag) => {
    if (tag === 'canvas') {
      createdCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
        })),
        toBlob: (cb) => {
          // Simulate JPEG blob
          cb(new Blob(['x'], { type: 'image/jpeg' }));
        },
      };
      return createdCanvas;
    }
    return originalCreateElement.call(document, tag);
  };

  global.Image = FakeImage;

  return {
    restore: () => {
      global.Image = originalImage;
      document.createElement = originalCreateElement;
    },
    getCanvas: () => createdCanvas,
  };
}

describe('createOptimizedImageFile', () => {
  let dom;

  beforeEach(() => {
    dom = setupDomMocks({ width: 4000, height: 2000 }); // landscape 2:1
  });

  afterEach(() => {
    dom.restore();
  });

  it('downscales large images so the longer side is maxSize and keeps aspect ratio', async () => {
    const original = new File([new Uint8Array([1, 2, 3])], 'photo-large.png', {
      type: 'image/png',
    });

    const optimized = await createOptimizedImageFile(original, 1600, 0.85);

    // Should return a File instance
    expect(optimized).toBeInstanceOf(File);
    // Extension should be converted to .jpg
    expect(optimized.name.endsWith('.jpg')).toBe(true);

    // Check canvas dimensions used for resize
    const canvas = dom.getCanvas();
    expect(canvas).not.toBeNull();
    expect(canvas.width).toBe(1600); // longer side clamped to maxSize
    expect(canvas.height).toBe(800); // 4000x2000 -> 1600x800 keeps 2:1 ratio
  });

  it('returns original file when getContext("2d") is null (no canvas context)', async () => {
    // Keep Image mock so onload fires; only make canvas return no context
    const originalCreateElement = document.createElement;
    document.createElement = (tag) => {
      if (tag === 'canvas') {
        return { width: 0, height: 0, getContext: () => null };
      }
      return originalCreateElement.call(document, tag);
    };

    const original = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const result = await createOptimizedImageFile(original, 1600, 0.85);
    expect(result).toBe(original);
  });
});

