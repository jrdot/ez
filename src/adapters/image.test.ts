import { expect, it } from 'vitest';
import { browserImageAdapter, IMAGE_LIMITS, backgroundRemoval } from './image';
it('rejects unsupported MIME and over-limit files before decoding', async () => {
  const signal = new AbortController().signal;
  await expect(browserImageAdapter.decode(new File(['svg'], 'a.svg', { type: 'image/svg+xml' }), signal)).rejects.toThrow('PNG');
  const file = new File(['x'], 'huge.png', { type: 'image/png' }); Object.defineProperty(file, 'size', { value: IMAGE_LIMITS.bytes + 1 });
  await expect(browserImageAdapter.decode(file, signal)).rejects.toThrow('12MB');
});
it('aborted reads never return an asset and invalid raster dimensions fail', async () => {
  const controller = new AbortController(); controller.abort();
  await expect(browserImageAdapter.decode(new File(['x'], 'a.png', { type: 'image/png' }), controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  await expect(browserImageAdapter.edit({ asset: { id: 'a', name: 'a', mimeType: 'image/png', source: 'data:image/png;base64,eA==' }, width: 10, height: 10 }, { x: 0, y: 0, width: 10, height: 10 }, 0, 10, new AbortController().signal)).rejects.toThrow('크기');
  expect(backgroundRemoval.status).toBe('pending');
});
