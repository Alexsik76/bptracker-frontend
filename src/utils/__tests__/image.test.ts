import { describe, it, expect, vi } from 'vitest';
import { preprocessImage } from '../image';

describe('preprocessImage', () => {
  it('should resize image and return jpeg blob', async () => {
    // Mock createImageBitmap and HTMLCanvasElement.toBlob
    
    // Create a tiny mock File
    const file = new File([''], 'test.png', { type: 'image/png' });

    // Mock createImageBitmap
    const mockBitmap = {
      width: 2000,
      height: 1000,
      close: vi.fn(),
    };
    (window as any).createImageBitmap = vi.fn().mockResolvedValue(mockBitmap);

    // Mock canvas toBlob
    const mockBlob = new Blob([''], { type: 'image/jpeg' });
    const mockToBlob = vi.fn((callback) => callback(mockBlob));
    
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return {
          getContext: () => ({
            drawImage: vi.fn(),
          }),
          width: 0,
          height: 0,
          toBlob: mockToBlob,
        } as any;
      }
      return document.createElement(tagName);
    });

    const result = await preprocessImage(file);

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('image/jpeg');
    expect((window as any).createImageBitmap).toHaveBeenCalledWith(file, { imageOrientation: 'from-image' });
  });
});
