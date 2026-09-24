import { useEffect, useRef, useState } from 'react';
import { createId } from '@/domain/id';
import { newObject } from '@/domain/objects';
import type { Asset, PartDefinition } from '@/domain/project';
import { TerminalFields, ObjectFields } from './entity-properties';
import { ObjectShape } from './object-shape';
export function PartEditor({ initial, assets, onSave, onCancel }: { initial?: PartDefinition; assets: Asset[]; onSave: (part: PartDefinition) => boolean; onCancel: () => void }) {
  const [part, setPart] = useState<PartDefinition>(() => initial ? structuredClone(initial) : { id: createId(), name: '새 부품', width: 45, height: 28, objects: [], terminals: [] });
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="part-dialog" aria-label="부품 편집" onCancel={e => { e.preventDefault(); onCancel(); }}><form onSubmit={e => { e.preventDefault(); if (!onSave(part)) setError("저장할 수 없습니다. 단자, 객체 수치와 참조를 확인하세요."); }}>
    <h2>개인 라이브러리 부품</h2>{error && <p role="alert">{error}</p>}<p>수정은 이후 배치에 적용됩니다. 기존 배치는 유지됩니다.</p>
    <label>라이브러리 이름<input required aria-label="라이브러리 이름" value={part.name} onChange={e => setPart({ ...part, name: e.target.value })} autoFocus /></label>
    {(['width', 'height'] as const).map(key => <label key={key}>{key} (mm)<input aria-label={`부품 정의 ${key}`} type="number" min="0.1" step="any" value={part[key]} onChange={e => setPart({ ...part, [key]: Number(e.target.value) })} /></label>)}
    <svg className="part-preview" viewBox={`-5 -5 ${part.width + 10} ${part.height + 10}`}><rect width={part.width} height={part.height} fill="#e1eee7" />{part.objects.map(o => <ObjectShape key={o.id} object={o} assets={assets} />)}{part.terminals.filter(t => t.visible).map(t => <circle key={t.id} cx={t.x} cy={t.y} r="1" fill={t.connectable ? '#0c7668' : '#888'} />)}</svg>
    <div>{(['line', 'point', 'text'] as const).map(type => <button key={type} type="button" onClick={() => setPart({ ...part, objects: [...part.objects, newObject(type, { x: 5, y: 5 })] })}>{type} 추가</button>)}</div>
    {part.objects.map(o => <div key={o.id}><ObjectFields object={o} onChange={next => setPart({ ...part, objects: part.objects.map(v => v.id === o.id ? next : v) })} /><button type="button" onClick={() => setPart({ ...part, objects: part.objects.filter(v => v.id !== o.id) })}>객체 제거</button></div>)}
    <TerminalFields terminals={part.terminals} onChange={terminals => setPart({ ...part, terminals })} />
    <button type="submit">라이브러리 저장</button><button type="button" onClick={onCancel}>취소</button>
  </form></dialog>;
}
