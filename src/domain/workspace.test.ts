import { expect, it } from "vitest";
import { documentToScreen, screenToDocument, zoomAt, panBy } from "./coordinates";
import { connectionCandidate, resolveSnap, snapCandidates } from "./snap";
import { DEFAULT_PART, createComponentInstance, createEditor, execute, moveComponent } from "./editor";
import { createEmptyProject } from "./project";
import { isProtectedTarget, wheelViewport } from "../features/editor/workspace-input";

const view = { origin: { x: 24, y: 24 }, pan: { x: -50, y: 70 }, pixelsPerMm: 96 / 25.4, zoom: .55 };
it("keeps the zoom anchor fixed, clamps zoom and round-trips after pan", () => {
  const anchor = { x: 230, y: 130 }, point = screenToDocument(anchor, view);
  for (const zoom of [.01, 1.5, 100]) {
    const next = zoomAt(view, anchor, zoom);
    const actual = documentToScreen(point, next);
    expect(actual.x).toBeCloseTo(anchor.x); expect(actual.y).toBeCloseTo(anchor.y);
    expect(next.zoom).toBeGreaterThanOrEqual(.2); expect(next.zoom).toBeLessThanOrEqual(4);
  }
  const next = panBy(view, { x: 130, y: -60 });
  expect(screenToDocument(documentToScreen(point, next), next)).toEqual(point);
});
it("normalizes wheel units and gives zoom precedence over Shift", () => {
  const event = { deltaX: 0, deltaY: 2, deltaMode: 1, ctrlKey: false, altKey: false, shiftKey: false };
  expect(wheelViewport(view, { x: 0, y: 0 }, event, 500).pan.y).toBe(view.pan.y - 32);
  expect(wheelViewport(view, { x: 0, y: 0 }, { ...event, shiftKey: true }, 500).pan.x).toBe(view.pan.x - 32);
  for (const modifier of ["ctrlKey", "altKey"]) expect(wheelViewport(view, { x: 0, y: 0 }, { ...event, shiftKey: true, [modifier]: true }, 500).zoom).toBeLessThan(view.zoom);
});
it("snaps to transformed terminals within a CSS-pixel threshold, deterministically", () => {
  const sheet = createEmptyProject().sheets[0];
  const c = createComponentInstance("a", { x: 50, y: 50 }); c.rotation = 90; c.scale = 2; sheet.components.push(c);
  const candidates = snapCandidates(sheet);
  const terminal = candidates.find(c => c.kind === "terminal")!;
  expect(terminal.point.x).toBeCloseTo(30); expect(terminal.point.y).toBeCloseTo(140);
  expect(resolveSnap({ x: 32, y: 140 }, "object", 5, candidates, 4).candidate?.id).toBe(terminal.id);
  expect(resolveSnap({ x: 33, y: 140 }, "object", 5, candidates, 4).candidate).toBeNull();
  const tied = [{ id: "z", kind: "anchor" as const, point: { x: 0, y: 0 } }, { id: "a", kind: "anchor" as const, point: { x: 0, y: 0 } }];
  expect(resolveSnap({ x: 0, y: 0 }, "object", 5, tied, 1).candidate?.id).toBe("a");
  expect(snapCandidates(sheet, "a")).toHaveLength(0);
});
it("uses the same grid preview and committed point, and keeps Off endpoints constrained", () => {
  const project = createEmptyProject(), sheet = project.sheets[0];
  sheet.components.push(createComponentInstance("a", { x: 20, y: 20 }));
  project.parts.push(structuredClone(DEFAULT_PART));
  project.canvas.snapMode = "grid";
  const result = resolveSnap({ x: -7, y: 28 }, "grid", 5, [], 2);
  const state = execute(createEditor(project), moveComponent(sheet.id, "a", result.point));
  expect(state.document.sheets[0].components[0].x).toBe(result.point.x);
  expect(state.document.sheets[0].components[0].y).toBe(result.point.y);
  expect(resolveSnap({ x: 22, y: 23 }, "off", 5, snapCandidates(sheet), 2)).toEqual({ point: { x: 22, y: 23 }, candidate: null });
  expect(connectionCandidate({ x: 20, y: 20 }, sheet, 2)).toBeNull();
  expect(connectionCandidate({ x: 65, y: 30 }, sheet, 2)?.endpoint?.kind).toBe("terminal");
  expect(() => execute(createEditor(project), { label: "invalid wire", sheetId: sheet.id, apply: (s, p) => {
    p.canvas.snapMode = "off";
    s.wires.push({ id: "w", type: "free", from: { kind: "junction", junctionId: "missing" }, to: { kind: "junction", junctionId: "missing" }, bends: [], width: 1, color: "#000000" });
  } })).toThrow();
});

it("protects property controls, editable content and dialog descendants", () => {
  for (const html of ['<input />', '<textarea></textarea>', '<select></select>', '<div contenteditable="true"><span></span></div>', '<dialog><span></span></dialog>', '<div role="dialog"><span></span></div>']) {
    const container = document.createElement("div"); container.innerHTML = html;
    expect(isProtectedTarget(container.querySelector("span") ?? container.firstElementChild)).toBe(true);
  }
  expect(isProtectedTarget(document.createElementNS("http://www.w3.org/2000/svg", "svg"))).toBe(false);
});
