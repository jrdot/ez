"use client";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { activeSheet, type Command, type EditorState, type Preview } from "@/domain/editor";
import { documentToScreen, panBy, screenToDocument, type Viewport } from "@/domain/coordinates";
import { connectionCandidate, resolveSnap, snapCandidates, type SnapCandidate } from "@/domain/snap";
import { expandSelection, rootId, rotationAngle, selectionCenter, transformCommand, transformOf, transformSelection, type SelectionTransform } from "@/domain/objects";
import { ObjectShape } from "./object-shape";
import type { ComponentInstance, DrawingObject, Point } from "@/domain/project";
import { clientToViewport, isProtectedTarget, wheelViewport } from "./workspace-input";

type Props = { state: EditorState; view: Viewport; grid: boolean; onView: (view: Viewport) => void; onSelectComponent: (id: string | null, toggle?: boolean) => void; onPreview: (preview: Preview) => void; onCommand: (command: Command) => void; onDropPart: (point: Point, partId?: string) => void };
type Gesture = { kind: "move" | "rotate"; id: string; baseRotation: number; ids: string[]; start: Point; anchor: Point; change: SelectionTransform } | { kind: "pan"; last: Point };
export function EditorCanvas({ state, view, grid, onView, onSelectComponent, onPreview, onCommand, onDropPart }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const active = useRef<Gesture | null>(null);
  const space = useRef(false);
  const [change, setChange] = useState<{ ids: string[]; value: SelectionTransform } | null>(null);
  const [candidate, setCandidate] = useState<SnapCandidate | null>(null);
  const { width, height, gridSize, background, snapMode } = state.document.canvas;
  const originalSheet = activeSheet(state);
  const sheet = change ? structuredClone(originalSheet) : originalSheet;
  if (change) transformSelection(sheet, change.ids, change.value);
  const selected = expandSelection(sheet, state.selection);
  const center = selectionCenter(sheet, state.selection);
  const scale = view.pixelsPerMm * view.zoom;
  const origin = documentToScreen({ x: 0, y: 0 }, view);
  const cancel = () => { active.current = null; setChange(null); setCandidate(null); onPreview(null); };
  const cancelEvent = useEffectEvent(cancel);
  const wheel = useEffectEvent((e: WheelEvent) => {
    if (isProtectedTarget(e.target)) return;
    const svg = svgRef.current;
    const anchor = svg && clientToViewport(svg, { x: e.clientX, y: e.clientY });
    if (!svg || !anchor) return;
    e.preventDefault();
    // Navigation cancels object preview so an old pointer offset cannot jump.
    if (active.current) cancelEvent();
    setCandidate(null);
    onView(wheelViewport(view, anchor, e, svg.clientHeight));
  });
  useEffect(() => {
    const svg = svgRef.current!;
    const listener = (e: WheelEvent) => wheel(e);
    const blur = () => { space.current = false; cancelEvent(); };
    svg.addEventListener("wheel", listener, { passive: false });
    window.addEventListener("blur", blur);
    return () => { svg.removeEventListener("wheel", listener); window.removeEventListener("blur", blur); };
  }, []);
  const viewportAt = (event: { clientX: number; clientY: number }) => svgRef.current && clientToViewport(svgRef.current, { x: event.clientX, y: event.clientY });
  const pointAt = (event: { clientX: number; clientY: number }) => { const p = viewportAt(event); return p ? screenToDocument(p, view) : null; };
  const snap = (point: Point, excludeId?: string) => resolveSnap(point, snapMode, gridSize, snapCandidates(sheet, excludeId), scale);
  const begin = (event: React.PointerEvent<SVGElement>, entity: ComponentInstance | DrawingObject, rotate = false) => {
    if (space.current || event.button === 1 || state.mode !== "mouse" || event.button !== 0) return;
    event.stopPropagation(); const p = pointAt(event); if (!p) return;
    svgRef.current?.focus();
    const id = rootId(sheet, entity.id);
    if (!rotate && (event.ctrlKey || event.shiftKey)) { onSelectComponent(id, true); return; }
    const ids = state.selection.includes(id) ? state.selection : [id];
    if (!state.selection.includes(id)) onSelectComponent(id);
    svgRef.current?.setPointerCapture(event.pointerId);
    active.current = { kind: rotate ? "rotate" : "move", id, baseRotation: ids.length === 1 && id === entity.id ? transformOf(entity).rotation : 0, ids, start: p, anchor: { ...transformOf(entity) }, change: { delta: { x: 0, y: 0 }, angle: 0, center: selectionCenter(sheet, ids) } };
  };
  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    const p = pointAt(event), drag = active.current; if (!p) return;
    if (drag?.kind === "pan") {
      const next = viewportAt(event)!;
      onView(panBy(view, { x: next.x - drag.last.x, y: next.y - drag.last.y })); drag.last = next; return;
    }
    if (drag) {
      if (drag.kind === "rotate") {
        const c = drag.change.center;
        const angle = (Math.atan2(p.y - c.y, p.x - c.x) - Math.atan2(drag.start.y - c.y, drag.start.x - c.x)) * 180 / Math.PI;
        drag.change.angle = rotationAngle(drag.baseRotation + angle, event.shiftKey) - drag.baseRotation;
      } else {
        const excluded = expandSelection(originalSheet, drag.ids);
        const candidates = snapCandidates(originalSheet).filter(c => !excluded.has(c.id) && !(c.endpoint?.kind === "terminal" && excluded.has(c.endpoint.componentId)));
        const result = resolveSnap({ x: drag.anchor.x + p.x - drag.start.x, y: drag.anchor.y + p.y - drag.start.y }, snapMode, gridSize, candidates, scale);
        drag.change.delta = { x: result.point.x - drag.anchor.x, y: result.point.y - drag.anchor.y }; setCandidate(result.candidate);
      }
      setChange({ ids: drag.ids, value: structuredClone(drag.change) });
    } else if (state.mode === "wire") setCandidate(connectionCandidate(p, sheet, scale));
    else setCandidate(snap(p).candidate);
  };
  const finish = () => { const drag = active.current; active.current = null; setChange(null); setCandidate(null); if (drag && drag.kind !== "pan" && (drag.change.angle || drag.change.delta.x || drag.change.delta.y)) onCommand(transformCommand(sheet.id, drag.ids, drag.change)); else if (drag?.kind === "move") onSelectComponent(drag.id); };
  return <div className="canvas-frame" data-testid="canvas-frame">
    <svg ref={svgRef} className="drawing-canvas" tabIndex={0} role="img" aria-label="배선도 캔버스"
      onKeyDown={e => { if (isProtectedTarget(e.target)) return; if (e.code === "Space") { e.preventDefault(); space.current = true; } if (e.key === "Escape" && active.current) { e.stopPropagation(); cancel(); } }}
      onKeyUp={e => { if (e.code === "Space") { e.preventDefault(); space.current = false; } }}
      onBlur={() => { space.current = false; cancel(); }}
      onPointerDown={e => {
        svgRef.current?.focus();
        if (e.button === 1 || (e.button === 0 && space.current)) {
          e.preventDefault(); cancel(); const p = viewportAt(e); if (!p) return;
          e.currentTarget.setPointerCapture(e.pointerId); active.current = { kind: "pan", last: p };
        } else if (e.button === 0 && state.mode === "mouse") onSelectComponent(null);
      }}
      onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel}
      onPointerLeave={() => { if (!active.current) setCandidate(null); }}
      onDragOver={e => { if (state.mode !== "mouse" || !e.dataTransfer.types.includes("application/x-ezwire-part")) return; e.preventDefault(); const p = pointAt(e); if (p) setCandidate(snap(p).candidate); }}
      onDragLeave={() => setCandidate(null)}
      onDrop={e => { if (state.mode !== "mouse" || !e.dataTransfer.getData("application/x-ezwire-part")) return; e.preventDefault(); const p = pointAt(e); if (p) onDropPart(snap(p).point, e.dataTransfer.getData("application/x-ezwire-part")); setCandidate(null); }}>
      <g data-testid="document-layer" transform={`translate(${origin.x} ${origin.y}) scale(${scale})`}>
        <defs><pattern id="small-grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse"><path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#cddbd6" strokeWidth="0.15" /></pattern></defs>
        <rect data-testid="paper" width={width} height={height} fill={background} stroke="#bbc9c3" strokeWidth="0.3" />
        {grid && <rect data-testid="grid" width={width} height={height} fill="url(#small-grid)" pointerEvents="none" />}
        {sheet.components.map(c => { const p = c; return <g key={c.id} className={`canvas-component ${selected.has(c.id) ? "selected" : ""}`} transform={`translate(${p.x} ${p.y}) rotate(${c.rotation}) scale(${c.scale})`} onPointerDown={e => begin(e, c)} aria-label={`${c.label ?? c.partId} 부품`} role="button">
          <rect width={c.width} height={c.height} rx="2" style={{ fill: c.objects.length ? "transparent" : undefined }} />{c.objects.map(o => <ObjectShape key={o.id} object={o} assets={state.document.assets} />)}<text x={c.width / 2} y="7" textAnchor="middle" style={{ fontSize: 3 }}>{c.label ?? c.partId}</text>
          {c.terminals.filter(t => t.visible).map(t => <g key={t.id}><circle data-terminal-id={t.id} className={`canvas-terminal ${t.connectable ? "terminal-blue" : "terminal-disabled"}`} cx={t.x} cy={t.y} r="1.5" /><text x={t.x - 3} y={t.y + 1} textAnchor="end" style={{ fontSize: 3 }}>{t.name}</text></g>)}
        </g>; })}
        {sheet.objects.map(o => <g key={o.id} role="button" aria-label={`${o.type} 객체`} className={selected.has(o.id) ? "drawing-object selected" : "drawing-object"} onPointerDown={e => begin(e, o)}><ObjectShape object={o} assets={state.document.assets} /></g>)}
        {!!state.selection.length && state.mode === "mouse" && <g data-testid="rotation-handle" transform={`translate(${center.x} ${center.y})`}>
          <path d="M 0 0 V -12" stroke="#0c7668" strokeWidth={1 / scale} pointerEvents="none" />
          <circle role="button" aria-label="회전 핸들" cy={-12} r={5 / scale} fill="white" stroke="#0c7668" strokeWidth={2 / scale} onPointerDown={e => { const entity = [...sheet.components, ...sheet.objects].find(o => selected.has(o.id)); if (entity) begin(e, entity, true); }} />
        </g>}
        {candidate && <g data-testid="snap-preview" pointerEvents="none" transform={`translate(${candidate.point.x} ${candidate.point.y})`}><circle r={7 / scale} fill="#0c766833" stroke="#0c7668" strokeWidth={1.5 / scale} /><path d={`M ${-11 / scale} 0 H ${11 / scale} M 0 ${-11 / scale} V ${11 / scale}`} stroke="#0c7668" strokeWidth={1 / scale} /></g>}
      </g>
    </svg>
    {!sheet.components.length && !sheet.objects.length && <div className="canvas-empty-state"><strong>아직 배치된 부품이 없습니다</strong><span>라이브러리에서 부품을 추가하거나 도면으로 끌어 놓으세요.</span></div>}
    {state.mode !== "mouse" && <p className="canvas-mode-note">{state.mode === "wire" ? "연결 대상 미리보기 · 배선 생성은 준비 중" : "이미지 업로드 또는 부품 선택 후 이미지 편집"}</p>}
  </div>;
}
