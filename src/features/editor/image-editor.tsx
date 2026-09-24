import { useEffect, useRef, useState } from 'react';
import { browserImageAdapter, backgroundRemoval, type ImageResult } from '@/adapters/image';
import { editPartGeometry } from '@/domain/image-edit';
import type { Asset, PartDefinition } from '@/domain/project';
import { TerminalFields } from './entity-properties';
export type ImageDraft = { part: PartDefinition; image: ImageResult; assets: Asset[]; instanceId?: string };
export function ImageEditor({ initial, onSave, onCancel }: { initial: ImageDraft; onSave: (draft: ImageDraft) => boolean; onCancel: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: initial.image.width, height: initial.image.height });
  const [size, setSize] = useState({ width: initial.image.width, height: initial.image.height });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const task = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); return () => task.current?.abort(); }, []);
  async function apply() {
    const controller = new AbortController(); task.current?.abort(); task.current = controller;
    setError(''); setBusy(true);
    try {
      const mx = draft.part.width / draft.image.width, my = draft.part.height / draft.image.height;
      const part = editPartGeometry(draft.part, { x: crop.x * mx, y: crop.y * my, width: crop.width * mx, height: crop.height * my }, size.width * mx, size.height * my);
      const image = await browserImageAdapter.edit(draft.image, crop, size.width, size.height, controller.signal);
      controller.signal.throwIfAborted();
      const object = part.objects[0]; if (object.type === 'image') object.assetId = image.asset.id;
      // Keep original and each applied result; cancel never writes them into the project.
      setDraft({ ...draft, part, image, assets: [...draft.assets, image.asset] });
      setCrop({ x: 0, y: 0, width: image.width, height: image.height });
    } catch (e) { if (!controller.signal.aborted) setError((e as Error).message); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return <dialog ref={dialog} className="image-dialog" aria-label="이미지 부품 편집" onCancel={e => { e.preventDefault(); task.current?.abort(); onCancel(); }}>
    <h2>이미지 부품 편집</h2><p>원본 보존 · Crop 바깥 단자 거부 · Resize 단자 비례 이동</p>
    {error && <p role="alert">{error}</p>}
    <svg className="part-preview" viewBox={`0 0 ${draft.part.width} ${draft.part.height}`}><image href={draft.image.asset.source} width={draft.part.width} height={draft.part.height} />{draft.part.terminals.filter(t => t.visible).map(t => <circle key={t.id} cx={t.x} cy={t.y} r={Math.max(draft.part.width / 100, .5)} fill={t.connectable ? '#00a080' : '#777'} />)}</svg>
    <fieldset disabled={busy}><label>부품 이름<input aria-label="이미지 부품 이름" value={draft.part.name} onChange={e => setDraft({ ...draft, part: { ...draft.part, name: e.target.value } })} /></label>
      <fieldset><legend>Crop (px)</legend>{(['x', 'y', 'width', 'height'] as const).map(key => <label key={key}>{key}<input aria-label={`Crop ${key}`} type="number" value={crop[key]} onChange={e => setCrop({ ...crop, [key]: Number(e.target.value) })} /></label>)}</fieldset>
      <fieldset><legend>Resize (px)</legend>{(['width', 'height'] as const).map(key => <label key={key}>{key}<input aria-label={`Resize ${key}`} type="number" value={size[key]} onChange={e => setSize({ ...size, [key]: Number(e.target.value) })} /></label>)}</fieldset>
      <button type="button" onClick={apply}>Crop / Resize 적용</button><button type="button" disabled>배경 제거 · {backgroundRemoval.message}</button>
      <TerminalFields terminals={draft.part.terminals} onChange={terminals => setDraft({ ...draft, part: { ...draft.part, terminals } })} />
      <button type="button" onClick={() => { if (!onSave(draft)) setError("저장할 수 없습니다. 연결된 단자와 입력값을 확인하세요."); }}>{initial.instanceId ? '이미지 변경 저장' : '이미지 부품 등록'}</button>
    </fieldset><button type="button" onClick={() => { task.current?.abort(); onCancel(); }}>취소</button>{busy && <p role="status">이미지 처리 중…</p>}
  </dialog>;
}
