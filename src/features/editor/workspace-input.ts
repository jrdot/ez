import { panBy, zoomAt, type Viewport } from "../../domain/coordinates";
import type { Point } from "../../domain/project";

export function isProtectedTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('input, textarea, select, button, [contenteditable="true"], dialog, [role="dialog"]');
}
export function wheelViewport(view: Viewport, anchor: Point, event: Pick<WheelEvent, "deltaX" | "deltaY" | "deltaMode" | "ctrlKey" | "altKey" | "shiftKey">, height: number) {
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
  const x = event.deltaX * unit, y = event.deltaY * unit;
  if (event.ctrlKey || event.altKey) return zoomAt(view, anchor, view.zoom * Math.exp(-y * 0.002));
  return panBy(view, event.shiftKey ? { x: -(y || x), y: 0 } : { x: -x, y: -y });
}
/** Actual SVG CTM handles client offset and any ancestor scale. */
export function clientToViewport(svg: SVGSVGElement, point: Point): Point | null {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const p = new DOMPoint(point.x, point.y).matrixTransform(matrix.inverse());
  return { x: p.x, y: p.y };
}
