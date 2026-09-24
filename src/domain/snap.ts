import { localToDocument } from "./coordinates";
import { snapPoint } from "./editor";
import type { Point, Sheet, SnapMode, WireEndpoint } from "./project";

export type SnapCandidate = { id: string; point: Point; kind: "terminal" | "junction" | "anchor" | "grid"; endpoint?: WireEndpoint };
export type SnapResult = { point: Point; candidate: SnapCandidate | null };
/** Visible connectable terminals only; imported hidden connections remain valid. */
export function snapCandidates(sheet: Sheet, excludeId?: string): SnapCandidate[] {
  return [
    ...sheet.junctions.map(j => ({ id: j.id, point: { x: j.x, y: j.y }, kind: "junction" as const, endpoint: { kind: "junction" as const, junctionId: j.id } })),
    ...sheet.components.filter(c => c.id !== excludeId).flatMap(c => [
      ...c.terminals.filter(t => t.visible && t.connectable).map(t => ({ id: t.id, point: localToDocument(t, c), kind: "terminal" as const, endpoint: { kind: "terminal" as const, componentId: c.id, terminalId: t.id } })),
      { id: c.id, point: { x: c.x, y: c.y }, kind: "anchor" as const },
    ]),
    ...sheet.objects.filter(o => o.id !== excludeId).map(o => ({ id: o.id, point: { x: o.transform.x, y: o.transform.y }, kind: "anchor" as const })),
  ];
}
const priority = { terminal: 0, junction: 1, anchor: 2, grid: 3 };
export function nearestCandidate(point: Point, candidates: SnapCandidate[], pixelsPerMm: number): SnapCandidate | null {
  const distance = (c: SnapCandidate) => Math.hypot(c.point.x - point.x, c.point.y - point.y) * pixelsPerMm;
  return candidates.filter(c => distance(c) <= 10).sort((a, b) => distance(a) - distance(b) || priority[a.kind] - priority[b.kind] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0] ?? null;
}
export function resolveSnap(point: Point, mode: SnapMode, gridSize: number, candidates: SnapCandidate[], pixelsPerMm: number): SnapResult {
  if (mode === "off") return { point, candidate: null };
  if (mode === "grid") {
    const snapped = snapPoint(point, gridSize, true);
    return { point: snapped, candidate: { id: "grid", point: snapped, kind: "grid" } };
  }
  const candidate = nearestCandidate(point, candidates, pixelsPerMm);
  return { point: candidate?.point ?? point, candidate };
}
/** Endpoint eligibility never depends on positional Snap mode (including Off). */
export function connectionCandidate(point: Point, sheet: Sheet, pixelsPerMm: number) {
  return nearestCandidate(point, snapCandidates(sheet).filter(c => c.endpoint), pixelsPerMm);
}
