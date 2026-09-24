import { createId } from '../domain/id';
import type { Asset } from '../domain/project';
export const IMAGE_LIMITS = { bytes: 12 * 1024 * 1024, pixels: 16_000_000, dimension: 8192 };
export type ImageResult = { asset: Asset; width: number; height: number };
export type Crop = { x: number; y: number; width: number; height: number };
export interface ImageAdapter {
  decode(file: File, signal: AbortSignal): Promise<ImageResult>;
  edit(image: ImageResult, crop: Crop, width: number, height: number, signal: AbortSignal): Promise<ImageResult>;
}
export const backgroundRemoval = { status: 'pending' as const, message: '외부 AI 연동 확정 대기' };
function dimensions(width: number, height: number) {
  if (![width, height].every(n => Number.isInteger(n) && n > 0 && n <= IMAGE_LIMITS.dimension) || width * height > IMAGE_LIMITS.pixels) throw new Error('이미지 크기는 최대 8192px, 1600만 픽셀입니다.');
}
async function load(source: string, signal: AbortSignal): Promise<HTMLImageElement> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = () => { image.onload = null; image.onerror = null; signal.removeEventListener('abort', abort); };
    const abort = () => { cleanup(); image.src = ''; reject(new DOMException('취소됨', 'AbortError')); };
    image.onload = () => { cleanup(); resolve(image); }; image.onerror = () => { cleanup(); reject(new Error('이미지를 디코딩할 수 없습니다.')); };
    signal.addEventListener('abort', abort, { once: true }); image.src = source;
  });
}
function read(file: File, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const reader = new FileReader();
    const abort = () => reader.abort();
    const cleanup = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, { once: true });
    reader.onload = () => { cleanup(); resolve(String(reader.result)); };
    reader.onerror = () => { cleanup(); reject(new Error('이미지 파일을 읽을 수 없습니다.')); };
    reader.onabort = () => { cleanup(); reject(new DOMException('취소됨', 'AbortError')); };
    reader.readAsDataURL(file);
  });
}
export const browserImageAdapter: ImageAdapter = {
  async decode(file, signal) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('PNG, JPEG, WebP 이미지만 지원합니다.');
    if (file.size > IMAGE_LIMITS.bytes) throw new Error('이미지는 최대 12MB입니다.');
    const source = await read(file, signal), image = await load(source, signal);
    signal.throwIfAborted(); dimensions(image.naturalWidth, image.naturalHeight);
    return { asset: { id: createId(), name: file.name, mimeType: file.type, source }, width: image.naturalWidth, height: image.naturalHeight };
  },
  async edit(result, crop, width, height, signal) {
    signal.throwIfAborted(); dimensions(width, height);
    if (![crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) || crop.x < 0 || crop.y < 0 || crop.width <= 0 || crop.height <= 0 || crop.x + crop.width > result.width || crop.y + crop.height > result.height) throw new Error('자르기 영역이 이미지 범위를 벗어났습니다.');
    const image = await load(result.asset.source, signal);
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d'); if (!context) throw new Error('이미지 편집을 지원하지 않는 브라우저입니다.');
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    const source = canvas.toDataURL('image/png'); signal.throwIfAborted();
    return { asset: { id: createId(), name: `${result.asset.name} (편집)`, mimeType: 'image/png', source }, width, height };
  },
};
