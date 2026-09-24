import { createId } from "./id";
import { paperSize, type Paper } from "./coordinates";
export const PROJECT_FORMAT = "ezwire-project" as const;
export const PROJECT_FORMAT_VERSION = 2 as const;
export const MAX_SHEETS = 3;
export type Point = { x: number; y: number };
export type Transform = Point & { rotation: number; scale: number };
export type SnapMode = "object" | "grid" | "off";
export type CanvasConfig = { paper: Paper; width: number; height: number; background: string; gridSize: number; snapMode: SnapMode };
type ObjectBase = { id: string; transform: Transform };
export type DrawingObject = ObjectBase & (
  | { type: "image"; assetId: string; width: number; height: number }
  | { type: "line"; end: Point; color: string; width: number }
  | { type: "point" }
  | { type: "text"; text: string; fontSize: number }
);
export type Terminal = Point & { id: string; type: "point"; role: "terminal"; name: string; visible: boolean; connectable: boolean };
export type ComponentInstance = Transform & { id: string; partId: string; width: number; height: number; refdes?: string; label?: string; properties: Record<string, string>; objects: DrawingObject[]; terminals: Terminal[] };
export type PartDefinition = { id: string; name: string; width: number; height: number; objects: DrawingObject[]; terminals: Terminal[] };
export type Group = { id: string; childIds: string[] };
export type WireEndpoint = { kind: "terminal"; componentId: string; terminalId: string } | { kind: "junction"; junctionId: string };
export type Junction = Point & { id: string };
export type Wire = { id: string; type: "orthogonal" | "diagonal45" | "free"; from: WireEndpoint; to: WireEndpoint; bends: Point[]; color: string; width: number; label?: string };
export type Sheet = { id: string; name: string; note?: string; components: ComponentInstance[]; objects: DrawingObject[]; groups: Group[]; wires: Wire[]; junctions: Junction[] };
export type Asset = { id: string; name: string; mimeType: string; source: string };
export type Project = { id: string; revision: number; ownerId?: string; name: string; formatVersion: typeof PROJECT_FORMAT_VERSION; canvas: CanvasConfig; sheets: Sheet[]; nextSheetNumber: number; palette: { id: string; name: string; color: string }[]; bom: { manualItems: { id: string; name: string; quantity: number; specification?: string }[] }; parts: PartDefinition[]; assets: Asset[]; createdAt: string; updatedAt: string };
export type ProjectFile = { format: typeof PROJECT_FORMAT; version: typeof PROJECT_FORMAT_VERSION; project: Project };
export function createSheet(number: number): Sheet {
  return { id: createId(), name: `EZ-${String(number).padStart(3, "0")}`, components: [], objects: [], groups: [], wires: [], junctions: [] };
}
export function createEmptyProject(now = new Date()): Project {
  return { id: createId(), revision: 0, name: "제목 없는 프로젝트", formatVersion: PROJECT_FORMAT_VERSION,
    canvas: { paper: "A4-landscape", ...paperSize("A4-landscape"), background: "#ffffff", gridSize: 5, snapMode: "object" },
    sheets: [createSheet(1)], nextSheetNumber: 2, palette: [], bom: { manualItems: [] }, parts: [], assets: [], createdAt: now.toISOString(), updatedAt: now.toISOString() };
}
