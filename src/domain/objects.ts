import { createId } from './id';
import { localToDocument } from './coordinates';
import type { Command } from './editor';
import type { ComponentInstance, DrawingObject, Point, Project, Sheet, Transform, WireEndpoint } from './project';

export function rootId(sheet: Sheet, id: string): string {
  const parent = sheet.groups.find(g => g.childIds.includes(id));
  return parent ? rootId(sheet, parent.id) : id;
}
export function roots(sheet: Sheet) { return [...sheet.objects, ...sheet.components, ...sheet.groups].map(o => o.id).filter(id => rootId(sheet, id) === id); }
export function expandSelection(sheet: Sheet, ids: string[]): Set<string> {
  const result = new Set<string>();
  const visit = (id: string) => { if (result.has(id)) return; result.add(id); sheet.groups.find(g => g.id === id)?.childIds.forEach(visit); };
  ids.forEach(visit); return result;
}
export function selectedEntities(sheet: Sheet, ids: string[]) {
  const all = expandSelection(sheet, ids);
  return [...sheet.components, ...sheet.objects].filter(o => all.has(o.id));
}
export function transformOf(o: ComponentInstance | DrawingObject): Transform { return 'transform' in o ? o.transform : o; }
export function selectionCenter(sheet: Sheet, ids: string[]): Point {
  const points = selectedEntities(sheet, ids).map(transformOf);
  if (!points.length) return { x: 0, y: 0 };
  return { x: (Math.min(...points.map(p => p.x)) + Math.max(...points.map(p => p.x))) / 2, y: (Math.min(...points.map(p => p.y)) + Math.max(...points.map(p => p.y))) / 2 };
}
export function rotationAngle(angle: number, shift: boolean) { return shift ? Math.round(angle / 45) * 45 : angle; }
export type SelectionTransform = { delta: Point; angle: number; center: Point; scale?: number };
export function transformSelection(sheet: Sheet, ids: string[], change: SelectionTransform) {
  selectedEntities(sheet, ids).forEach(o => {
    const t = transformOf(o);
    const p = localToDocument({ x: t.x - change.center.x, y: t.y - change.center.y }, { ...change.center, scale: change.scale ?? 1, rotation: change.angle });
    t.x = p.x + change.delta.x; t.y = p.y + change.delta.y; t.rotation += change.angle; t.scale *= change.scale ?? 1;
  });
}
export function transformCommand(sheetId: string, ids: string[], change: SelectionTransform): Command {
  return { label: '선택 변환', sheetId, apply: s => transformSelection(s, ids, change) };
}
export function deleteSelection(sheetId: string, ids: string[]): Command {
  return { label: '선택 삭제', sheetId, apply: s => {
    const all = expandSelection(s, ids);
    if (s.wires.some(w => [w.from, w.to].some(e => e.kind === 'terminal' && all.has(e.componentId)))) throw new Error('연결된 부품은 삭제할 수 없습니다. 먼저 배선을 정리하세요.');
    s.components = s.components.filter(c => !all.has(c.id)); s.objects = s.objects.filter(c => !all.has(c.id));
    s.groups = s.groups.filter(g => !all.has(g.id));
  } };
}
export function newObject(type: 'line' | 'point' | 'text', point: Point): DrawingObject {
  const base = { id: createId(), transform: { ...point, rotation: 0, scale: 1 } };
  if (type === 'line') return { ...base, type, end: { x: 30, y: 0 }, color: '#304c43', width: 0.6 };
  if (type === 'text') return { ...base, type, text: '텍스트', fontSize: 5 };
  return { ...base, type };
}
export function endpointPosition(sheet: Sheet, endpoint: WireEndpoint): Point | undefined {
  if (endpoint.kind === 'junction') return sheet.junctions.find(j => j.id === endpoint.junctionId);
  const c = sheet.components.find(c => c.id === endpoint.componentId);
  const t = c?.terminals.find(t => t.id === endpoint.terminalId && t.connectable);
  return c && t ? localToDocument(t, c) : undefined;
}
/** Clipboard contains owned graph + immutable definition/asset dependencies. Boundary wires are omitted. */
export type ObjectClipboard = { sheet: Sheet; parts: Project['parts']; assets: Project['assets'] };
export function copySelection(project: Project, sheet: Sheet, ids: string[]): ObjectClipboard {
  const all = expandSelection(sheet, ids);
  const components = sheet.components.filter(c => all.has(c.id));
  const copy: Sheet = { ...sheet, objects: sheet.objects.filter(o => all.has(o.id)), components, groups: sheet.groups.filter(g => all.has(g.id)), junctions: [], wires: [] };
  // Junction graphs are deferred to FE-04. Direct internal terminal wires can be copied safely.
  copy.wires = sheet.wires.filter(w => [w.from, w.to].every(e => e.kind === 'terminal' && all.has(e.componentId)));
  const parts = project.parts.filter(p => components.some(c => c.partId === p.id));
  const assetIds = new Set([...copy.objects, ...components.flatMap(c => c.objects), ...parts.flatMap(p => p.objects)].flatMap(o => o.type === 'image' ? [o.assetId] : []));
  return structuredClone({ sheet: copy, parts, assets: project.assets.filter(a => assetIds.has(a.id)) });
}
export function pasteSelection(sheetId: string, clipboard: ObjectClipboard, offset: Point = { x: 10, y: 10 }): Command {
  return { label: '붙여넣기', sheetId, apply: (s, p) => {
    const data = structuredClone(clipboard), ids = new Map<string, string>();
    const own = (o: { id: string }) => { const old = o.id; o.id = createId(); ids.set(old, o.id); };
    // Always import private copies of dependencies: also works after undoing original registration.
    data.assets.forEach(own); data.parts.forEach(part => { own(part); part.objects.forEach(own); part.terminals.forEach(own); });
    data.sheet.objects.forEach(own); data.sheet.groups.forEach(own); data.sheet.wires.forEach(own);
    data.sheet.components.forEach(c => { own(c); c.objects.forEach(own); c.terminals.forEach(own); c.partId = ids.get(c.partId)!; });
    [...data.parts.flatMap(p => p.objects), ...data.sheet.objects, ...data.sheet.components.flatMap(c => c.objects)].forEach(o => { if (o.type === 'image') o.assetId = ids.get(o.assetId)!; });
    data.sheet.groups.forEach(g => { g.childIds = g.childIds.map(id => ids.get(id)!); });
    data.sheet.wires.forEach(w => { w.bends = w.bends.map(b => ({ x: b.x + offset.x, y: b.y + offset.y })); for (const e of [w.from, w.to]) if (e.kind === 'terminal') { e.componentId = ids.get(e.componentId)!; e.terminalId = ids.get(e.terminalId)!; } });
    transformSelection(data.sheet, roots(data.sheet), { delta: offset, angle: 0, center: { x: 0, y: 0 } });
    p.parts.push(...data.parts); p.assets.push(...data.assets); s.objects.push(...data.sheet.objects); s.components.push(...data.sheet.components); s.groups.push(...data.sheet.groups); s.wires.push(...data.sheet.wires);
  } };
}
