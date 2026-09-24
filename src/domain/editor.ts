import { createId } from "./id";
import { createSheet, MAX_SHEETS, type ComponentInstance, type Point, type Project, type Sheet, type PartDefinition } from "./project";
import { assertProject } from "./validation";
export const DEFAULT_PART: PartDefinition = { id: "generic-controller", name: "컨트롤러", width: 45, height: 28, objects: [], terminals: [ { id: "generic-d2", type: "point", role: "terminal", name: "D2", x: 45, y: 10, visible: true, connectable: true }, { id: "generic-5v", type: "point", role: "terminal", name: "5V", x: 45, y: 20, visible: true, connectable: true } ] };
export function snapPoint(point: Point, gridSize: number, enabled: boolean): Point { if (!enabled) return point; if (!(gridSize > 0)) throw new Error("Invalid grid"); return { x: Math.round(point.x / gridSize) * gridSize, y: Math.round(point.y / gridSize) * gridSize }; }
export function createComponentInstance(id: string, point: Point, part = DEFAULT_PART): ComponentInstance {
  return { id, partId: part.id, width: part.width, height: part.height, rotation: 0, scale: 1, label: part.name, properties: {}, ...point, objects: part.objects.map(o => ({ ...structuredClone(o), id: createId() })), terminals: part.terminals.map(t => ({ ...t, id: createId() })) };
}
export type Command = { label: string; sheetId: string; apply: (sheet: Sheet, project: Project) => void };
export type Preview = { componentId: string; point: Point } | null;
export type EditorState = { document: Project; activeSheetId: string; selection: string[]; mode: "mouse" | "wire" | "image"; preview: Preview; past: Project[]; future: Project[] };
export function createEditor(document: Project): EditorState { assertProject(document); return { document: structuredClone(document), activeSheetId: document.sheets[0].id, selection: [], mode: "mouse", preview: null, past: [], future: [] }; }
export function activeSheet(state: EditorState) { const sheet = state.document.sheets.find(s => s.id === state.activeSheetId); if (!sheet) throw new Error("활성 페이지가 없습니다."); return sheet; }
export function cancelPreview(state: EditorState): EditorState { return { ...state, preview: null }; }
export function switchSheet(state: EditorState, id: string): EditorState { if (!state.document.sheets.some(s => s.id === id)) throw new Error("없는 페이지입니다."); return { ...state, activeSheetId: id, selection: [], preview: null }; }
export function switchMode(state: EditorState, mode: EditorState["mode"]): EditorState { return { ...state, mode, preview: null }; }
export function execute(state: EditorState, command: Command, now = new Date()): EditorState {
  if (command.sheetId !== state.activeSheetId) throw new Error("활성 페이지에서만 편집할 수 있습니다.");
  const document = structuredClone(state.document);
  const sheet = document.sheets.find(s => s.id === command.sheetId)!;
  command.apply(sheet, document);
  for (const original of state.document.sheets) {
    if (original.id !== state.activeSheetId && JSON.stringify(document.sheets.find(s => s.id === original.id)) !== JSON.stringify(original)) throw new Error("비활성 페이지 변경은 허용되지 않습니다.");
  }
  if (document.id !== state.document.id || document.revision !== state.document.revision || document.createdAt !== state.document.createdAt || document.updatedAt !== state.document.updatedAt) throw new Error("문서 메타데이터는 명령 실행기가 관리합니다.");
  assertProject(document);
  if (JSON.stringify(document) === JSON.stringify(state.document)) return cancelPreview(state);
  document.revision = state.document.revision + 1; document.updatedAt = now.toISOString();
  return { ...state, document: structuredClone(document), preview: null, past: [...state.past, structuredClone(state.document)], future: [], selection: [], activeSheetId: document.sheets.some(s => s.id === state.activeSheetId) ? state.activeSheetId : document.sheets[0].id };
}
function restore(state: EditorState, undoing: boolean, now: Date): EditorState {
  const stack = undoing ? state.past : state.future; if (!stack.length) return cancelPreview(state);
  const document = structuredClone(stack[stack.length - 1]); document.revision = state.document.revision + 1; document.updatedAt = now.toISOString();
  return { ...state, document, preview: null, selection: [], activeSheetId: document.sheets.some(s => s.id === state.activeSheetId) ? state.activeSheetId : document.sheets[0].id,
    past: undoing ? state.past.slice(0, -1) : [...state.past, structuredClone(state.document)], future: undoing ? [...state.future, structuredClone(state.document)] : state.future.slice(0, -1) };
}
export const undo = (s: EditorState, now = new Date()) => restore(s, true, now);
export const redo = (s: EditorState, now = new Date()) => restore(s, false, now);
export function addSheet(sheetId: string): Command { return { label: "페이지 추가", sheetId, apply: (_, p) => { if (p.sheets.length >= MAX_SHEETS) throw new Error("최대 3페이지입니다."); p.sheets.push(createSheet(p.nextSheetNumber++)); } }; }
export function moveComponent(sheetId: string, id: string, point: Point): Command { return { label: "부품 이동", sheetId, apply: (s, p) => { const c = s.components.find(c => c.id === id); if (!c) throw new Error("없는 부품입니다."); Object.assign(c, snapPoint(point, p.canvas.gridSize, p.canvas.snapMode === "grid")); } }; }
export function groupObjects(sheetId: string, childIds: string[]): Command { return { label: "그룹", sheetId, apply: s => { s.groups.push({ id: createId(), childIds: [...childIds] }); } }; }
export function connectedWires(sheet: Sheet, terminalId: string) { return sheet.wires.filter(w => [w.from, w.to].some(e => e.kind === "terminal" && e.terminalId === terminalId)); }
export function deleteActiveSheet(sheetId: string): Command {
  return { label: "페이지 삭제", sheetId, apply: (_, p) => { if (p.sheets.length === 1) throw new Error("최소 1페이지가 필요합니다."); p.sheets = p.sheets.filter(s => s.id !== sheetId); } };
}
/** Copies a whole page graph, remapping every owned ID and internal reference. */
export function duplicateActiveSheet(sheetId: string): Command {
  return { label: "페이지 복제", sheetId, apply: (s, p) => {
    if (p.sheets.length >= MAX_SHEETS) throw new Error("최대 3페이지입니다.");
    const copy = structuredClone(s), ids = new Map<string, string>();
    const own = (entity: { id: string }) => { const next = createId(); ids.set(entity.id, next); entity.id = next; };
    own(copy); copy.objects.forEach(own); copy.groups.forEach(own); copy.junctions.forEach(own); copy.wires.forEach(own);
    copy.components.forEach(c => { own(c); c.objects.forEach(own); c.terminals.forEach(own); });
    copy.groups.forEach(g => { g.childIds = g.childIds.map(id => ids.get(id)!); });
    copy.wires.forEach(w => { for (const endpoint of [w.from, w.to]) {
      if (endpoint.kind === "junction") endpoint.junctionId = ids.get(endpoint.junctionId)!;
      else { endpoint.componentId = ids.get(endpoint.componentId)!; endpoint.terminalId = ids.get(endpoint.terminalId)!; }
    } });
    copy.name = `EZ-${String(p.nextSheetNumber++).padStart(3, "0")}`;
    p.sheets.push(copy);
  } };
}
