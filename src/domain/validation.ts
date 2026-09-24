import { paperSize } from "./coordinates";
import type { Project, Sheet, WireEndpoint } from "./project";
type Check = (value: unknown, path: string) => void;
function fail(path: string): never { throw new Error(`프로젝트 데이터가 올바르지 않습니다: ${path}`); }
const string: Check = (v, p) => { if (typeof v !== "string") fail(p); };
const id: Check = (v, p) => { string(v, p); if (!v) fail(p); };
const number: Check = (v, p) => { if (typeof v !== "number" || !Number.isFinite(v)) fail(p); };
const positive: Check = (v, p) => { number(v, p); if ((v as number) <= 0) fail(p); };
const integer: Check = (v, p) => { number(v, p); if (!Number.isSafeInteger(v) || (v as number) < 0) fail(p); };
const bool: Check = (v, p) => { if (typeof v !== "boolean") fail(p); };
const one = (...values: unknown[]): Check => (v, p) => { if (!values.includes(v)) fail(p); };
const array = (check: Check): Check => (v, p) => { if (!Array.isArray(v)) fail(p); v.forEach((item, i) => check(item, `${p}[${i}]`)); };
const optional = (check: Check): Check => (v, p) => { if (v !== undefined) check(v, p); };
const shape = (fields: Record<string, Check>): Check => (v, p) => {
  if (!v || typeof v !== "object" || Array.isArray(v)) fail(p);
  const record = v as Record<string, unknown>;
  for (const key of Object.keys(record)) if (!Object.hasOwn(fields, key)) fail(`${p}.${key} (지원하지 않는 필드; 원본 보존)`);
  for (const [key, check] of Object.entries(fields)) check(record[key], `${p}.${key}`);
};
const point = { x: number, y: number };
const transform = shape({ ...point, rotation: number, scale: positive });
const object: Check = (v, p) => {
  const type = (v as { type?: string } | null)?.type;
  const base = { id, transform, type: one(type) };
  if (type === "point") shape(base)(v, p);
  else if (type === "image") shape({ ...base, assetId: id, width: positive, height: positive })(v, p);
  else if (type === "line") shape({ ...base, end: shape(point), color: id, width: positive })(v, p);
  else if (type === "text") shape({ ...base, text: string, fontSize: positive })(v, p);
  else fail(p);
};
const terminal = shape({ ...point, id, type: one("point"), role: one("terminal"), name: string, visible: bool, connectable: bool });
const properties: Check = (v, p) => { if (!v || typeof v !== "object" || Array.isArray(v)) fail(p); Object.values(v).forEach(x => string(x, p)); };
const component = shape({ ...point, rotation: number, scale: positive, id, partId: id, width: positive, height: positive, refdes: optional(string), label: optional(string), properties, objects: array(object), terminals: array(terminal) });
const endpoint: Check = (v, p) => {
  if ((v as { kind?: string } | null)?.kind === "terminal") shape({ kind: one("terminal"), componentId: id, terminalId: id })(v, p);
  else shape({ kind: one("junction"), junctionId: id })(v, p);
};
const schema = shape({ id, revision: integer, ownerId: optional(id), name: string, formatVersion: one(2),
  canvas: shape({ paper: one("A4-landscape", "A4-portrait", "A3-landscape", "A3-portrait"), width: positive, height: positive, background: id, gridSize: positive, snapMode: one("object", "grid", "off") }),
  sheets: array(shape({ id, name: string, note: optional(string), components: array(component), objects: array(object), groups: array(shape({ id, childIds: array(id) })), junctions: array(shape({ id, ...point })), wires: array(shape({ id, type: one("orthogonal", "diagonal45", "free"), from: endpoint, to: endpoint, bends: array(shape(point)), color: id, width: positive, label: optional(string) })) })),
  nextSheetNumber: integer, palette: array(shape({ id, name: string, color: id })), bom: shape({ manualItems: array(shape({ id, name: string, quantity: positive, specification: optional(string) })) }),
  parts: array(shape({ id, name: string, width: positive, height: positive, objects: array(object), terminals: array(terminal) })),
  assets: array(shape({ id, name: string, mimeType: id, source: id })), createdAt: id, updatedAt: id });
export function resolveEndpoint(sheet: Sheet, endpoint: WireEndpoint) {
  if (endpoint.kind === "junction") return sheet.junctions.find(x => x.id === endpoint.junctionId);
  return sheet.components.find(x => x.id === endpoint.componentId)?.terminals.find(x => x.id === endpoint.terminalId && x.connectable);
}
export function assertProject(value: unknown): asserts value is Project {
  schema(value, "project");
  const p = value as Project;
  if (p.sheets.length < 1 || p.sheets.length > 3 || p.nextSheetNumber < 2) fail("sheets / nextSheetNumber");
  if (![p.createdAt, p.updatedAt].every(x => Number.isFinite(Date.parse(x)))) fail("timestamps");
  const size = paperSize(p.canvas.paper);
  if (size.width !== p.canvas.width || size.height !== p.canvas.height) fail("canvas.paper size");
  const ids = new Set<string>();
  function register(entity: { id: string }) { if (ids.has(entity.id)) fail(`duplicate ID ${entity.id}`); ids.add(entity.id); }
  register(p);
  [...p.assets, ...p.palette, ...p.bom.manualItems].forEach(register);
  function objects(items: Project["sheets"][number]["objects"]) { items.forEach(o => { register(o); if (o.type === "image" && !p.assets.some(a => a.id === o.assetId)) fail(`asset ${o.assetId}`); }); }
  p.parts.forEach(part => { register(part); objects(part.objects); part.terminals.forEach(register); });
  for (const s of p.sheets) {
    register(s); objects(s.objects);
    s.components.forEach(c => { register(c); if (!p.parts.some(part => part.id === c.partId)) fail(`part ${c.partId}`); objects(c.objects); c.terminals.forEach(register); });
    s.groups.forEach(register); s.junctions.forEach(register); s.wires.forEach(register);
    const children = new Set([...s.objects, ...s.components, ...s.groups].map(x => x.id));
    const owners = new Map<string, string>();
    for (const g of s.groups) {
      if (g.childIds.length < 2) fail(`group ${g.id} needs multiple children`);
      for (const child of g.childIds) { if (!children.has(child) || owners.has(child)) fail(`group ownership ${child}`); owners.set(child, g.id); }
    }
    for (const child of owners.keys()) { const seen = new Set<string>(); let current: string | undefined = child; while (current) { if (seen.has(current)) fail("group cycle"); seen.add(current); current = owners.get(current); } }
    for (const w of s.wires) {
      if (!resolveEndpoint(s, w.from) || !resolveEndpoint(s, w.to)) fail(`wire endpoint ${w.id}`);
      if (w.type === "free" && w.bends.length) fail(`free wire bends ${w.id}`);
    }
    const match = /^EZ-(\d+)$/.exec(s.name);
    if (match && Number(match[1]) >= p.nextSheetNumber) fail("nextSheetNumber");
  }
}
