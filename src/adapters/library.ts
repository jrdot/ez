import { DEFAULT_PART } from '../domain/editor';
import type { PartDefinition } from '../domain/project';
export type PublicPartsResult = { status: 'sample' | 'connected' | 'unavailable'; parts: PartDefinition[]; message: string };
export interface PublicPartsAdapter { list(signal?: AbortSignal): Promise<PublicPartsResult> }
export const samplePublicParts: PublicPartsAdapter = {
  async list(signal) {
    signal?.throwIfAborted();
    return { status: 'sample', parts: [structuredClone(DEFAULT_PART)], message: '샘플 목록 · 공용 서비스 미연동' };
  },
};
