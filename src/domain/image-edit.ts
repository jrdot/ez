import type { Crop } from '../adapters/image';
import type { PartDefinition } from './project';
/** Full-part image editing keeps all local geometry aligned and rejects any lost terminal. */
export function editPartGeometry(part: PartDefinition, crop: Crop, width: number, height: number): PartDefinition {
  if (![crop.x, crop.y, crop.width, crop.height, width, height].every(Number.isFinite) || width <= 0 || height <= 0 || crop.width <= 0 || crop.height <= 0 || crop.x < 0 || crop.y < 0 || crop.x + crop.width > part.width || crop.y + crop.height > part.height) throw new Error('올바른 자르기 영역과 크기를 입력하세요.');
  if (part.terminals.some(t => t.x < crop.x || t.y < crop.y || t.x > crop.x + crop.width || t.y > crop.y + crop.height)) throw new Error('자르기 영역 밖에 단자가 있습니다. 먼저 단자를 재배치하세요.');
  const sx = width / crop.width, sy = height / crop.height;
  const result = structuredClone(part);
  // Image draft is a single, full-size image. Composite/non-uniform transforms require explicit editing.
  if (result.objects.length !== 1 || result.objects[0].type !== 'image') throw new Error('이미지 편집은 단일 이미지 부품에서 지원합니다.');
  const image = result.objects[0];
  if (image.transform.x || image.transform.y || image.transform.rotation || image.transform.scale !== 1 || image.width !== part.width || image.height !== part.height) throw new Error('변환된 내부 이미지는 원래 위치로 복원한 뒤 편집하세요.');
  result.width = width; result.height = height; image.width = width; image.height = height;
  result.terminals = result.terminals.map(t => ({ ...t, x: (t.x - crop.x) * sx, y: (t.y - crop.y) * sy }));
  return result;
}
