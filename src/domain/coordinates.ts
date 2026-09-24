import type { Point, Transform } from "./project";
export type Paper = "A4-landscape" | "A4-portrait" | "A3-landscape" | "A3-portrait";
const sizes = { "A4-landscape": [297, 210], "A4-portrait": [210, 297], "A3-landscape": [420, 297], "A3-portrait": [297, 420] } as const;
/** Document units are millimetres; origin top-left, positive y downward. */
export function paperSize(paper: Paper) { const [width, height] = sizes[paper]; return { width, height }; }
export type Viewport = { origin: Point; pan: Point; pixelsPerMm: number; zoom: number };
function factor(view: Viewport) { const n = view.pixelsPerMm * view.zoom; if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid viewport scale"); return n; }
export function documentToScreen(p: Point, v: Viewport): Point { const s = factor(v); return { x: v.origin.x + v.pan.x + p.x * s, y: v.origin.y + v.pan.y + p.y * s }; }
export function screenToDocument(p: Point, v: Viewport): Point { const s = factor(v); return { x: (p.x - v.origin.x - v.pan.x) / s, y: (p.y - v.origin.y - v.pan.y) / s }; }
/** Scale then clockwise rotation around local (0,0), then translate. */
export function localToDocument(p: Point, t: Transform): Point { const a = t.rotation * Math.PI / 180; return { x: t.x + t.scale * (p.x * Math.cos(a) - p.y * Math.sin(a)), y: t.y + t.scale * (p.x * Math.sin(a) + p.y * Math.cos(a)) }; }
export function documentToLocal(p: Point, t: Transform): Point { if (!(t.scale > 0)) throw new Error("Invalid scale"); const a = -t.rotation * Math.PI / 180, x = p.x - t.x, y = p.y - t.y; return { x: (x * Math.cos(a) - y * Math.sin(a)) / t.scale, y: (x * Math.sin(a) + y * Math.cos(a)) / t.scale }; }

/** Keep the document point under a viewport CSS-pixel anchor stationary. */
export function zoomAt(view: Viewport, anchor: Point, zoom: number): Viewport {
  const point = screenToDocument(anchor, view);
  const next = { ...view, zoom: Math.min(4, Math.max(0.2, zoom)) };
  const screen = documentToScreen(point, next);
  return { ...next, pan: { x: next.pan.x + anchor.x - screen.x, y: next.pan.y + anchor.y - screen.y } };
}
export function panBy(view: Viewport, delta: Point): Viewport {
  return { ...view, pan: { x: view.pan.x + delta.x, y: view.pan.y + delta.y } };
}
