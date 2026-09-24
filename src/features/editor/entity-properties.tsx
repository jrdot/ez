import { useState } from 'react';
import type { ComponentInstance, DrawingObject, Terminal } from '@/domain/project';
import { createId } from '@/domain/id';
import { transformOf } from '@/domain/objects';
export function TerminalFields({ terminals, onChange }: { terminals: Terminal[]; onChange: (ts: Terminal[]) => void }) {
  return <fieldset><legend>단자 · 부품 로컬 mm</legend>{terminals.map((t, i) => <fieldset key={t.id}><legend>단자 {i + 1}</legend><small>ID: {t.id}</small>
    {(['name', 'x', 'y'] as const).map(key => <label key={key}>{key}<input aria-label={`단자 ${i + 1} ${key}`} type={key === 'name' ? 'text' : 'number'} step="any" value={t[key]} onChange={e => onChange(terminals.map(v => v.id === t.id ? { ...v, [key]: key === 'name' ? e.target.value : Number(e.target.value) } : v))} /></label>)}
    {(['visible', 'connectable'] as const).map(key => <label key={key}><input type="checkbox" checked={t[key]} onChange={e => onChange(terminals.map(v => v.id === t.id ? { ...v, [key]: e.target.checked } : v))} />{key === 'visible' ? '표시' : '연결 가능'}</label>)}
    <button type="button" onClick={() => onChange(terminals.filter(v => v.id !== t.id))}>단자 {i + 1} 삭제</button>
  </fieldset>)}<button type="button" onClick={() => onChange([...terminals, { id: createId(), type: 'point', role: 'terminal', name: `T${terminals.length + 1}`, x: 0, y: 0, visible: true, connectable: true }])}>단자 추가</button></fieldset>;
}
export function ObjectFields({ object: o, onChange }: { object: DrawingObject; onChange: (o: DrawingObject) => void }) {
  return <fieldset><legend>{o.type}</legend>{(['x', 'y', 'rotation', 'scale'] as const).map(key => <label key={key}>{key}<input aria-label={`객체 ${key}`} type="number" step="any" min={key === 'scale' ? 0.001 : undefined} value={o.transform[key]} onChange={e => onChange({ ...o, transform: { ...o.transform, [key]: Number(e.target.value) } })} /></label>)}
    {o.type === 'text' && <><label>텍스트<input aria-label="텍스트 내용" value={o.text} onChange={e => onChange({ ...o, text: e.target.value })} /></label><label>글자 크기<input type="number" min="0.1" step="any" value={o.fontSize} onChange={e => onChange({ ...o, fontSize: Number(e.target.value) })} /></label></>}
    {o.type === 'line' && <><label>선 색상<input type="color" value={o.color} onChange={e => onChange({ ...o, color: e.target.value })} /></label><label>선 두께<input type="number" min="0.01" step="any" value={o.width} onChange={e => onChange({ ...o, width: Number(e.target.value) })} /></label>{(['x', 'y'] as const).map(key => <label key={key}>끝 {key}<input type="number" step="any" value={o.end[key]} onChange={e => onChange({ ...o, end: { ...o.end, [key]: Number(e.target.value) } })} /></label>)}</>}
    {o.type === 'image' && <p>크기는 배율 또는 이미지 편집에서 변경합니다.</p>}
  </fieldset>;
}
export function EntityProperties({ entity, onApply, disabled }: { entity: ComponentInstance | DrawingObject; onApply: (e: ComponentInstance | DrawingObject) => void; disabled: boolean }) {
  const [draft, setDraft] = useState(() => structuredClone(entity));
  return <form className="property-form" onSubmit={e => { e.preventDefault(); onApply(draft); }}><fieldset disabled={disabled}>
    <small>ID: {draft.id}</small>
    {'transform' in draft ? <ObjectFields object={draft} onChange={setDraft} /> : <>
      <label>부품 이름<input aria-label="부품 이름" value={draft.label ?? ''} onChange={e => setDraft({ ...draft, label: e.target.value })} /></label>
      <label>참조 번호<input value={draft.refdes ?? ''} onChange={e => setDraft({ ...draft, refdes: e.target.value })} /></label>
      {(['x', 'y', 'rotation', 'scale'] as const).map(key => <label key={key}>{key}<input aria-label={`부품 ${key}`} type="number" step="any" min={key === 'scale' ? 0.001 : undefined} value={transformOf(draft)[key]} onChange={e => setDraft({ ...draft, [key]: Number(e.target.value) })} /></label>)}
      <p>{draft.width} × {draft.height} mm · 크기 변경은 배율로 적용</p>
      <TerminalFields terminals={draft.terminals} onChange={terminals => setDraft({ ...draft, terminals })} />
      {draft.objects.map((o, i) => <ObjectFields key={o.id} object={o} onChange={next => setDraft({ ...draft, objects: draft.objects.map((v, j) => i === j ? next : v) })} />)}
    </>}
    <button type="submit">속성 적용</button><button type="button" onClick={() => setDraft(structuredClone(entity))}>변경 취소</button>
  </fieldset></form>;
}
