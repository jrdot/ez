"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { CircuitIcon, CloseIcon, PlusIcon } from "@/components/icons";
import { activeSheet, addSheet, createEditor, createComponentInstance, DEFAULT_PART, execute, undo, redo, switchSheet, switchMode, groupObjects, connectedWires, type Command, type EditorState } from "@/domain/editor";
import { createId } from "@/domain/id";
import { paperSize, zoomAt, type Paper, type Viewport } from "@/domain/coordinates";
import type { PartDefinition, Point, Project, SnapMode } from "@/domain/project";
import { selectionCenter, transformCommand, copySelection, pasteSelection, deleteSelection, newObject, roots, selectedEntities, type ObjectClipboard } from "@/domain/objects";
import { EntityProperties } from './entity-properties';
import { browserImageAdapter } from "@/adapters/image";
import { ImageEditor, type ImageDraft } from "./image-editor";
import { PartEditor } from './part-editor';
import { isProtectedTarget } from './workspace-input';
import { samplePublicParts, type PublicPartsResult } from '@/adapters/library';
import { EditorCanvas } from "./editor-canvas";

type EditorShellProps = {
  project: Project;
  onProjectChange: (project: Project) => void;
  onClose: () => void;
};

export function EditorShell({ project, onProjectChange, onClose }: EditorShellProps) {
  const [state, setState] = useState(() => createEditor(project));
  const [error, setError] = useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [library, setLibrary] = useState("library");
  const [grid, setGrid] = useState(true);
  const [view, setView] = useState<Viewport>({ origin: { x: 24, y: 24 }, pan: { x: 0, y: 0 }, pixelsPerMm: 96 / 25.4, zoom: 0.55 });
  const [dialog, setDialog] = useState<"Help" | "System" | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const [partDraft, setPartDraft] = useState<PartDefinition | null | undefined>(undefined);
  const [publicParts, setPublicParts] = useState<PublicPartsResult>({ status: 'unavailable', parts: [], message: '목록 로딩 중' });
  const [imageDraft, setImageDraft] = useState<ImageDraft | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const imageTask = useRef<AbortController | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => imageTask.current?.abort(), []);
  const clipboard = useRef<ObjectClipboard | null>(null);
  useEffect(() => { const controller = new AbortController(); samplePublicParts.list(controller.signal).then(setPublicParts).catch(() => { if (!controller.signal.aborted) setPublicParts({ status: 'unavailable', parts: [], message: '공용 목록을 불러올 수 없습니다.' }); }); return () => controller.abort(); }, []);
  const sheet = activeSheet(state);
  const entities = selectedEntities(sheet, state.selection);
  const entity = state.selection.length === 1 && entities.length === 1 && !sheet.groups.some(g => g.id === state.selection[0]) ? entities[0] : undefined;
  const selectedComponentId = state.selection[0] ?? null;
  const selectedComponent = sheet.components.find(({ id }) => id === selectedComponentId);
  const setSelectedComponentId = (id: string | null, toggle = false) => setState(s => ({ ...s, selection: !id ? [] : toggle ? s.selection.includes(id) ? s.selection.filter(v => v !== id) : [...s.selection, id] : [id] }));
  function publish(next: EditorState) { imageTask.current?.abort(); setImageBusy(false); setState(next); onProjectChange(next.document); setError(null); }
  function run(command: Command) { try { const next = execute(state, command); const remaining = new Set([...activeSheet(next).objects, ...activeSheet(next).components, ...activeSheet(next).groups].map(o => o.id)); publish({ ...next, selection: state.selection.filter(id => remaining.has(id)) }); return true; } catch (e) { setError((e as Error).message); return false; } }
  function addComponent(point?: Point, partId = DEFAULT_PART.id) {
    const part = state.document.parts.find(p => p.id === partId) ?? publicParts.parts.find(p => p.id === partId) ?? (partId === DEFAULT_PART.id ? DEFAULT_PART : undefined);
    if (!part) { setError('없는 라이브러리 부품입니다.'); return; }
    const count = sheet.components.length;
    const component = createComponentInstance(createId(), point ?? { x: 20 + (count % 4) * 55, y: 20 + Math.floor(count / 4) * 40 }, part);
    try {
      const next = execute(state, { label: "부품 추가", sheetId: sheet.id, apply: (s, p) => {
        if (!p.parts.some(definition => definition.id === part.id)) p.parts.push(structuredClone(part));
        s.components.push(component);
      } });
      publish({ ...next, selection: [component.id] });
    } catch (e) { setError((e as Error).message); }
  }
  function groupSelected() {
    try {
      const next = execute(state, groupObjects(sheet.id, state.selection));
      publish({ ...next, selection: [activeSheet(next).groups.at(-1)!.id] });
    } catch (e) { setError((e as Error).message); }
  }
  function deleteSelectedComponent() { if (state.selection.length) run(deleteSelection(sheet.id, state.selection)); }
  function copy(cut = false) {
    if (!state.selection.length) return;
    const payload = copySelection(state.document, sheet, state.selection);
    if (cut && !run(deleteSelection(sheet.id, state.selection))) return;
    clipboard.current = payload;
  }
  function paste() {
    if (!clipboard.current) return;
    try {
      const previous = new Set(roots(sheet));
      const next = execute(state, pasteSelection(sheet.id, clipboard.current));
      publish({ ...next, selection: roots(activeSheet(next)).filter(id => !previous.has(id)) });
    } catch (e) { setError((e as Error).message); }
  }
  async function uploadImage(file: File) {
    imageTask.current?.abort(); const controller = new AbortController(); imageTask.current = controller;
    setImageBusy(true); setError(null);
    try {
      const image = await browserImageAdapter.decode(file, controller.signal); controller.signal.throwIfAborted();
      const width = 50, height = 50 * image.height / image.width;
      setImageDraft({ image, assets: [image.asset], part: { id: createId(), name: file.name, width, height, terminals: [], objects: [{ id: createId(), type: 'image', assetId: image.asset.id, width, height, transform: { x: 0, y: 0, scale: 1, rotation: 0 } }] } });
    } catch (e) { if (!controller.signal.aborted) setError((e as Error).message); }
    finally { if (!controller.signal.aborted) setImageBusy(false); }
  }
  const keyHandler = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape' && imageBusy) { imageTask.current?.abort(); setImageBusy(false); return; }
    if (isProtectedTarget(e.target) || partDraft !== undefined || imageDraft || imageBusy) return;
    const mod = e.ctrlKey || e.metaKey, key = e.key.toLowerCase();
    if (mod && ['z', 'y', 'a'].includes(key)) {
      e.preventDefault();
      if (key === 'z') publish(e.shiftKey ? redo(state) : undo(state));
      if (key === 'y') publish(redo(state));
      if (key === 'a') setState(s => ({ ...s, selection: roots(sheet) }));

    }
    if (key === 'delete') { e.preventDefault(); deleteSelectedComponent(); }
    if (key === 'escape') setState(s => ({ ...s, selection: [], preview: null }));
  });
  const copyHandler = useEffectEvent((e: ClipboardEvent) => {
    if (isProtectedTarget(e.target) || partDraft !== undefined || imageDraft || imageBusy || !state.selection.length) return;
    e.preventDefault(); copy(e.type === 'cut');
    if (clipboard.current) e.clipboardData?.setData('application/x-ezwire-objects', 'session');
  });
  const pasteHandler = useEffectEvent((e: ClipboardEvent) => {
    if (isProtectedTarget(e.target) || partDraft !== undefined || imageDraft || imageBusy) return;
    const file = Array.from(e.clipboardData?.files ?? []).find(f => f.type.startsWith('image/'));
    if (file) { e.preventDefault(); void uploadImage(file); return; }
    if (e.clipboardData?.getData('text/plain')) return;
    if (clipboard.current) { e.preventDefault(); paste(); }
  });
  useEffect(() => { const key = (e: KeyboardEvent) => keyHandler(e), paste = (e: ClipboardEvent) => pasteHandler(e), copy = (e: ClipboardEvent) => copyHandler(e); window.addEventListener('keydown', key); window.addEventListener('paste', paste); window.addEventListener('copy', copy); window.addEventListener('cut', copy); return () => { window.removeEventListener('keydown', key); window.removeEventListener('paste', paste); window.removeEventListener('copy', copy); window.removeEventListener('cut', copy); }; }, []);
  function addObject(type: 'line' | 'point' | 'text') {
    const object = newObject(type, { x: 40, y: 40 });
    run({ label: '객체 추가', sheetId: sheet.id, apply: s => { s.objects.push(object); } });
    setState(s => ({ ...s, selection: [object.id] }));
  }

  function editImage(definition?: PartDefinition) {
    const target = definition ?? selectedComponent;
    if (!target) return;
    const object = target.objects[0];
    if (target.objects.length !== 1 || object?.type !== 'image') { setError('단일 이미지 부품을 선택하세요. 복합 부품 내부 객체는 속성에서 편집할 수 있습니다.'); return; }
    const asset = state.document.assets.find(a => a.id === object.assetId)!;
    const controller = new AbortController(); imageTask.current?.abort(); imageTask.current = controller; setImageBusy(true);
    fetch(asset.source, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('이미지를 불러올 수 없습니다.'); return r.blob(); }).then(blob => browserImageAdapter.decode(new File([blob], asset.name, { type: blob.type }), controller.signal)).then(image => {
      controller.signal.throwIfAborted();
      setImageDraft({ instanceId: definition ? undefined : selectedComponent!.id, assets: [], image: { ...image, asset }, part: definition ? structuredClone(definition) : { id: selectedComponent!.partId, name: selectedComponent!.label ?? '', width: target.width, height: target.height, objects: structuredClone(target.objects), terminals: structuredClone(target.terminals) } });
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setImageBusy(false); });
  }
  function saveImage(draft: ImageDraft) {
    const result = run({ label: '이미지 부품 저장', sheetId: sheet.id, apply: (s, p) => {
      draft.assets.forEach(a => { if (!p.assets.some(v => v.id === a.id)) p.assets.push(a); });
      if (draft.instanceId) {
        const c = s.components.find(c => c.id === draft.instanceId); if (!c) throw new Error('선택한 부품이 없습니다.');
        Object.assign(c, { width: draft.part.width, height: draft.part.height, label: draft.part.name, objects: draft.part.objects, terminals: draft.part.terminals });
      } else { const index = p.parts.findIndex(part => part.id === draft.part.id); if (index < 0) p.parts.push(draft.part); else p.parts[index] = draft.part; }
    } });
    if (result) setImageDraft(null); return result;
  }
  function configure(patch: Partial<Project["canvas"]>) {
    run({ label: "도면 설정", sheetId: sheet.id, apply: (_, p) => { Object.assign(p.canvas, patch); } });
  }
  function changeZoom(multiplier: number) {
    const svg = shellRef.current?.querySelector("svg.drawing-canvas");
    if (svg) setView(v => zoomAt(v, { x: svg.clientWidth / 2, y: svg.clientHeight / 2 }, v.zoom * multiplier));
  }
  const summary = state.selection.length > 1 || sheet.groups.some(g => g.id === state.selection[0]) ? `선택: ${state.selection.length}항목 · ${entities.length} 객체 | 속성 혼합` : selectedComponent ? `선택: ${selectedComponent.label ?? selectedComponent.partId} | X:${selectedComponent.x.toFixed(1)} Y:${selectedComponent.y.toFixed(1)} mm | ${selectedComponent.width}×${selectedComponent.height} | 회전:${selectedComponent.rotation}°` : state.selection.length ? `선택: ${state.selection.length}개 · ${entities.length} 객체` : "선택 없음";
  const deferred = (labels: string[], stage: string) => labels.map(label => <button type="button" disabled title={`${stage}에서 구현 예정`} key={label}>{label} · 준비 중</button>);
  return (
    <main className="editor-shell" ref={shellRef}>
      <header className="editor-header">
        <Link className="brand brand-compact" href="/" aria-label="ezwire 홈"><span className="brand-mark"><CircuitIcon /></span><span>ezwire</span></Link>
        <div className="mode-selector" aria-label="작업 모드">
          {(["mouse", "wire", "image"] as const).map(mode => <button key={mode} type="button" aria-pressed={state.mode === mode} onClick={() => setState(s => switchMode(s, mode))}>{mode === "mouse" ? "Mouse" : mode === "wire" ? "Wire" : "Image"}</button>)}
        </div>
        <div className="mode-toolbox" role="toolbar" aria-label="모드 도구상자">
          {state.mode === "mouse" ? <><span>선택 · 이동</span><button type="button" onClick={() => copy()} disabled={!state.selection.length}>복사</button><button type="button" onClick={paste}>붙여넣기</button><button type="button" disabled={state.selection.length < 2} onClick={groupSelected}>그룹</button><span title="선택 후 원형 핸들을 드래그, Shift는 45°">회전 ↻</span><button type="button" disabled={!state.selection.length} onClick={deleteSelectedComponent}>삭제</button></> : state.mode === "wire" ? deferred(["90°", "45°", "Free", "색상", "두께"], "FE-04") : <><button type="button" onClick={() => editImage()} disabled={!selectedComponent || state.selection.length !== 1 || imageBusy}>Crop / Resize</button><button type="button" disabled title="외부 AI 연동 확정 대기">배경 제거 · 대기</button><button type="button" onClick={() => imageInput.current?.click()}>이미지 업로드</button></>}
        </div>
        <div className="header-actions">
          <button type="button" disabled={!state.past.length} onClick={() => publish(undo(state))}>실행 취소</button>
          <button type="button" disabled={!state.future.length} onClick={() => publish(redo(state))}>다시 실행</button>
          <button className="icon-button" type="button" onClick={onClose} aria-label="프로젝트 닫기"><CloseIcon /></button>
        </div>
      </header>
      {error && <p className="workspace-error" role="alert">{error}</p>}
      <div className={`editor-body ${leftOpen ? "" : "left-collapsed"} ${rightOpen ? "" : "right-collapsed"}`}>
        <aside className="library-sidebar" aria-label="부품 라이브러리">
          <button className="sidebar-toggle" type="button" aria-label={`좌측 Sidebar ${leftOpen ? "접기" : "펼치기"}`} aria-expanded={leftOpen} onClick={() => setLeftOpen(!leftOpen)}>{leftOpen ? "◀" : "▶"}</button>
          {leftOpen && <><div className="library-tabs" role="tablist" aria-label="부품 목록">
            {[ ["library", "라이브러리"], ["public", "공용부품"] ].map(([id, label]) => <button type="button" key={id} id={`${id}-tab`} role="tab" aria-selected={library === id} aria-controls="library-panel" onClick={() => setLibrary(id)}>{label}</button>)}
          </div><div id="library-panel" role="tabpanel" aria-labelledby={`${library}-tab`} className="library-content">
            {library === "library" ? <><strong>기본 부품</strong><button className="part-card" type="button" draggable={state.mode === "mouse"} disabled={state.mode !== "mouse"} onDragStart={e => e.dataTransfer.setData("application/x-ezwire-part", DEFAULT_PART.id)} onClick={() => addComponent()} aria-label="부품 추가"><CircuitIcon /><span>컨트롤러<small>클릭 또는 끌어서 배치</small></span><PlusIcon /></button><button type="button" onClick={() => setPartDraft(null)}>개인 부품 등록</button><button type="button" disabled={imageBusy} onClick={() => imageInput.current?.click()}>이미지로 부품 등록</button>{state.document.parts.filter(p => p.id !== DEFAULT_PART.id).map(p => <div key={p.id}><button type="button" draggable={state.mode === 'mouse'} onDragStart={e => e.dataTransfer.setData('application/x-ezwire-part', p.id)} onClick={() => addComponent(undefined, p.id)}>{p.name} 배치</button><button type="button" onClick={() => setPartDraft(p)}>{p.name} 수정</button>{p.objects.length === 1 && p.objects[0].type === 'image' && <><button type="button" onClick={() => editImage(p)}>{p.name} 이미지 수정</button><button type="button" onClick={() => { const object = { ...structuredClone(p.objects[0]), id: createId(), transform: { x: 40, y: 40, rotation: 0, scale: 1 } }; run({ label: '이미지 객체 추가', sheetId: sheet.id, apply: s => { s.objects.push(object); } }); }}>이미지 객체 추가 · {p.name}</button></>}</div>)}<div className="object-tools">{(['line', 'point', 'text'] as const).map(type => <button key={type} type="button" disabled={state.mode !== 'mouse'} onClick={() => addObject(type)}>{type} 객체 추가</button>)}</div></> : <><p>{publicParts.message}</p>{publicParts.parts.map(p => <button key={p.id} type="button" draggable={state.mode === 'mouse'} onDragStart={e => e.dataTransfer.setData('application/x-ezwire-part', p.id)} onClick={() => addComponent(undefined, p.id)}>{p.name} 샘플 배치</button>)}</>}
          </div></>}
        </aside>
        <section className="workspace" aria-label="작업영역">
          <div className="workspace-toolbar"><div className="project-heading"><strong>{state.document.name}</strong><span>로컬 문서 · 메모리에서 편집 중</span></div>
            <label>용지 <select aria-label="용지" value={state.document.canvas.paper} onChange={e => { const paper = e.target.value as Paper; configure({ paper, ...paperSize(paper) }); }}>
              <option value="A4-landscape">A4 가로</option><option value="A4-portrait">A4 세로</option><option value="A3-landscape">A3 가로</option><option value="A3-portrait">A3 세로</option>
            </select></label>
          </div>
          <div className="sheet-tabs" aria-label="작업 페이지">
            {state.document.sheets.map(s => <button key={s.id} type="button" className={`sheet-tab ${s.id === sheet.id ? "active" : ""}`} aria-pressed={s.id === sheet.id} onClick={() => setState(s0 => switchSheet(s0, s.id))}>{s.name}</button>)}
            <button type="button" className="sheet-add" disabled={state.document.sheets.length >= 3} onClick={() => run(addSheet(sheet.id))} aria-label="시트 추가"><PlusIcon /></button><span>{state.document.sheets.length}/3</span>
          </div>
          <div className="canvas-viewport">
            <EditorCanvas key={`${sheet.id}:${state.mode}:${state.document.revision}`} state={state} view={view} onView={setView} grid={grid} onPreview={preview => setState(s => ({ ...s, preview }))} onSelectComponent={setSelectedComponentId} onCommand={run} onDropPart={addComponent} />
          </div>
        </section>
        <aside className="inspector" aria-label="선택 속성">
          <button className="sidebar-toggle" type="button" aria-label={`우측 Sidebar ${rightOpen ? "접기" : "펼치기"}`} aria-expanded={rightOpen} onClick={() => setRightOpen(!rightOpen)}>{rightOpen ? "▶" : "◀"}</button>
          {rightOpen && <><div className="panel-heading"><span>속성</span><small>{state.selection.length > 1 ? "다중 선택" : entity ? "객체 선택됨" : state.selection.length ? "그룹 선택" : "선택 없음"}</small></div>
          {entity ? <><EntityProperties key={`${entity.id}:${state.document.revision}`} entity={entity} disabled={state.mode === 'wire'} onApply={next => run({ label: '속성 편집', sheetId: sheet.id, apply: s => { if ('transform' in next) s.objects = s.objects.map(o => o.id === next.id ? next : o); else s.components = s.components.map(c => c.id === next.id ? next : c); } })} />{selectedComponent && <p>연결 배선: {selectedComponent.terminals.reduce((n, t) => n + connectedWires(sheet, t.id).length, 0)}</p>}<button type="button" onClick={deleteSelectedComponent}>{selectedComponent ? '선택한 부품 삭제' : '선택 객체 삭제'}</button></> : state.selection.length ? <div className="inspector-selection"><strong>{state.selection.length === 1 ? '그룹 선택' : '다중 선택'}</strong><p>{entities.length} 객체 · 속성 혼합</p><p>함께 이동·회전·복사·삭제할 수 있습니다.</p><form className="property-form" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); run(transformCommand(sheet.id, state.selection, { delta: { x: Number(data.get('dx')), y: Number(data.get('dy')) }, angle: Number(data.get('angle')), scale: Number(data.get('scale')), center: selectionCenter(sheet, state.selection) })); }}><fieldset disabled={state.mode === 'wire'}><legend>선택 일괄 속성</legend><label>이동 X<input aria-label="일괄 이동 X" name="dx" type="number" step="any" defaultValue="0" /></label><label>이동 Y<input name="dy" type="number" step="any" defaultValue="0" /></label><label>회전 변화<input name="angle" type="number" step="any" defaultValue="0" /></label><label>크기 배수<input name="scale" type="number" min="0.001" step="any" defaultValue="1" /></label><button type="submit">일괄 적용</button></fieldset></form><button type="button" onClick={deleteSelectedComponent}>선택 삭제</button></div> : <div className="inspector-empty"><p>캔버스에서 항목을 선택하면<br />상세 속성을 확인할 수 있습니다.</p></div>}

          <div className="document-summary"><span>문서 정보</span><dl><div><dt>포맷</dt><dd>v{state.document.formatVersion}</dd></div><div><dt>리비전</dt><dd>{state.document.revision}</dd></div><div><dt>도면</dt><dd>{state.document.canvas.width} × {state.document.canvas.height} mm</dd></div><div><dt>부품</dt><dd>{sheet.components.length}</dd></div><div><dt>배선</dt><dd>{sheet.wires.length}</dd></div></dl><p>용지는 프로젝트 공통입니다. 크기 변경 시 경계 밖 객체도 보존됩니다.</p></div></>}
        </aside>
      </div>
      <footer className="workspace-bottom">
        <div className="bottom-main"><div className="selection-summary" title={summary}>{summary}</div><div className="bottom-tools">
          <div className="zoom-control" aria-label="확대 배율"><button type="button" aria-label="축소" onClick={() => changeZoom(1 / 1.2)}>−</button><span>{Math.round(view.zoom * 100)}%</span><button type="button" aria-label="확대" onClick={() => changeZoom(1.2)}>＋</button></div>
          {deferred(["BOM View", "Table View"], "FE-05")}
          <button type="button" aria-pressed={grid} onClick={() => setGrid(!grid)}>Grid</button>
          <label>Snap <select aria-label="Snap" value={state.document.canvas.snapMode} onChange={e => configure({ snapMode: e.target.value as SnapMode })}><option value="object">Object</option><option value="grid">Grid</option><option value="off">Off</option></select></label>
          <button type="button" onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await shellRef.current?.requestFullscreen(); } catch { setError("전체 화면을 사용할 수 없습니다."); } }}>Full Screen</button>
        </div></div>
        <div className="bottom-system"><span>Wheel 이동 · Ctrl/Alt+Wheel 줌 · 휠 버튼/Space+Drag Pan</span>{deferred(["Code Download", "PDF Download", "PNG Download"], "FE-05")}{(["Help", "System"] as const).map(name => <button key={name} type="button" onClick={() => { setDialog(name); dialogRef.current?.showModal(); }}>{name}</button>)}</div>
      </footer>
      <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="부품 이미지 업로드" hidden onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void uploadImage(file); }} />
      {imageBusy && <div role="status">이미지 읽는 중…<button type="button" onClick={() => { imageTask.current?.abort(); setImageBusy(false); }}>이미지 읽기 취소</button></div>}
      {imageDraft && <ImageEditor initial={imageDraft} onSave={saveImage} onCancel={() => setImageDraft(null)} />}
      {partDraft !== undefined && <PartEditor initial={partDraft ?? undefined} assets={state.document.assets} onCancel={() => setPartDraft(undefined)} onSave={part => { const saved = run({ label: '라이브러리 저장', sheetId: sheet.id, apply: (_, p) => { const index = p.parts.findIndex(v => v.id === part.id); if (index < 0) p.parts.push(part); else p.parts[index] = part; } }); if (saved) setPartDraft(undefined); return saved; }} />}
      <dialog ref={dialogRef} aria-labelledby="workspace-dialog-title" onClose={() => setDialog(null)}>
        <h2 id="workspace-dialog-title">{dialog}</h2>
        {dialog === "System" ? <label>Canvas 배경색 <input aria-label="Canvas 배경색" type="color" value={state.document.canvas.background} onChange={e => configure({ background: e.target.value })} /></label> : <p>Wheel: 세로 이동 / Shift+Wheel: 가로 이동<br />Ctrl 또는 Alt+Wheel: 포인터 중심 확대·축소<br />휠 버튼 또는 캔버스에 포커스한 후 Space+Drag: Pan<br />Ctrl+C/X/V: 복사/잘라내기/붙여넣기<br />Ctrl+A: 전체 선택 · Ctrl+Z/Y: Undo/Redo<br />Ctrl/Shift+Click: 선택 토글 · 원형 핸들 Drag: 회전 · Shift: 45°<br />Esc: 진행 작업 취소 / 선택 해제<br />편집 내용은 메모리에만 유지됩니다.</p>}
        <form method="dialog"><button type="submit">닫기</button></form>
      </dialog>
    </main>
  );
}
