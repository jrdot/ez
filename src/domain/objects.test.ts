import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createEmptyProject, type PartDefinition } from './project';
import { createEditor, execute, DEFAULT_PART, createComponentInstance, undo, redo, groupObjects } from './editor';
import { copySelection, pasteSelection, roots, transformCommand, selectionCenter, endpointPosition, deleteSelection, newObject, rootId } from './objects';
import { rotationAngle } from './objects';
import { localToDocument } from './coordinates';
import { editPartGeometry } from './image-edit';
import { parseProjectFile, serializeProject } from './project-file';
import { connectionCandidate } from './snap';
function setup() {
  const p = createEmptyProject(); p.parts.push(structuredClone(DEFAULT_PART));
  const s = p.sheets[0];
  s.components.push(createComponentInstance('a', { x: 20, y: 30 }), createComponentInstance('b', { x: 80, y: 30 }));
  s.objects.push(newObject('line', { x: 0, y: 0 }), newObject('point', { x: 10, y: 10 }), newObject('text', { x: 5, y: 5 }));
  return createEditor(p);
}
describe('FE-03 graph and transformations', () => {
  it('groups preserve child IDs and rotate all descendants around the same center, undo once', () => {
    let e = setup(), s = e.document.sheets[0]; const ids = s.components.map(c => c.id);
    e = execute(e, groupObjects(s.id, ids)); s = e.document.sheets[0];
    const group = s.groups[0]; expect(group.id).not.toBe(ids[0]); expect(group.childIds).toEqual(ids);
    expect(rootId(s, ids[0])).toBe(group.id);
    const before = structuredClone(s);
    e = execute(e, transformCommand(s.id, [group.id], { angle: 90, delta: { x: 0, y: 0 }, center: selectionCenter(s, [group.id]) }));
    expect(e.document.sheets[0].components[0].x).toBeCloseTo(50);
    expect(e.document.sheets[0].components[0].y).toBeCloseTo(0);
    expect(undo(e).document.sheets[0]).toEqual(before);
    expect(redo(undo(e)).document.sheets[0]).toEqual(e.document.sheets[0]);
  });
  it('copies internal wires and remaps component, terminal, group and object IDs together', () => {
    let e = setup(); const s = e.document.sheets[0];
    s.wires.push({ id: 'wire', type: 'free', from: { kind: 'terminal', componentId: 'a', terminalId: s.components[0].terminals[0].id }, to: { kind: 'terminal', componentId: 'b', terminalId: s.components[1].terminals[0].id }, bends: [], color: '#000', width: 1 });
    e = execute(e, groupObjects(s.id, ['a', 'b']));
    const payload = copySelection(e.document, e.document.sheets[0], roots(e.document.sheets[0]));
    const next = execute(e, pasteSelection(s.id, payload)); const result = next.document.sheets[0];
    expect(result.components).toHaveLength(4); expect(result.wires).toHaveLength(2);
    const wire = result.wires[1]; expect(wire.id).not.toBe('wire');
    expect(wire.from).toEqual({ kind: 'terminal', componentId: result.components[2].id, terminalId: result.components[2].terminals[0].id });
    expect(result.groups[1].childIds).toEqual(result.components.slice(2).map(c => c.id));
    expect(parseProjectFile(serializeProject(next.document))).toEqual(next.document);
  });
  it('boundary wires are excluded and deleting connected components is atomic', () => {
    const e = setup(), s = e.document.sheets[0];
    s.wires.push({ id: 'wire', type: 'free', from: { kind: 'terminal', componentId: 'a', terminalId: s.components[0].terminals[0].id }, to: { kind: 'terminal', componentId: 'b', terminalId: s.components[1].terminals[0].id }, bends: [], color: '#000', width: 1 });
    expect(copySelection(e.document, s, ['a']).sheet.wires).toHaveLength(0);
    const before = structuredClone(e); expect(() => execute(e, deleteSelection(s.id, ['a']))).toThrow('연결된 부품'); expect(e).toEqual(before);
  });
  it('multiple pasted instances have unique terminals and independent definitions', () => {
    const e = setup(), s = e.document.sheets[0], data = copySelection(e.document, s, ['a']);
    const next = execute(execute(e, pasteSelection(s.id, data)), pasteSelection(s.id, data));
    const terminals = next.document.sheets[0].components.flatMap(c => c.terminals.map(t => t.id));
    expect(new Set(terminals).size).toBe(terminals.length);
    next.document.parts[0].name = 'changed'; expect(next.document.sheets[0].components[0].label).toBe('컨트롤러');
  });
  it('transformed terminals use scale, rotation and translation; plain points never connect', () => {
    const e = setup(), s = e.document.sheets[0], c = s.components[0]; c.rotation = 37; c.scale = 2.5;
    const end = { kind: 'terminal' as const, componentId: c.id, terminalId: c.terminals[0].id };
    expect(endpointPosition(s, end)).toEqual(localToDocument(c.terminals[0], c));
    expect(connectionCandidate({ x: 10, y: 10 }, s, 4)).toBeNull();
    c.terminals[0].connectable = false; expect(endpointPosition(s, end)).toBeUndefined();
  });
  it('free angles retain precision and shift snaps to 45 degrees', () => { expect(rotationAngle(31.123, false)).toBe(31.123); expect(rotationAngle(31.123, true)).toBe(45); expect(rotationAngle(-71, true)).toBe(-90); });
  it('no-op gestures add no history and multiple changes create one history entry', () => {
    const e = setup(), s = e.document.sheets[0];
    const same = execute(e, transformCommand(s.id, ['a', 'b'], { delta: { x: 0, y: 0 }, angle: 0, center: { x: 0, y: 0 } })); expect(same.past).toHaveLength(0);
    const moved = execute(e, transformCommand(s.id, ['a', 'b'], { delta: { x: 5, y: 10 }, angle: 0, center: { x: 0, y: 0 } })); expect(moved.past).toHaveLength(1); expect(undo(moved).document.sheets).toEqual(e.document.sheets);
  });
});
const imagePart = (): PartDefinition => ({ id: 'part', name: 'image', width: 100, height: 80, objects: [{ id: 'image', type: 'image', assetId: 'asset', width: 100, height: 80, transform: { x: 0, y: 0, scale: 1, rotation: 0 } }], terminals: [{ id: 't', type: 'point', role: 'terminal', name: 'T', x: 30, y: 40, visible: true, connectable: true }] });
describe('image geometry preservation', () => {
  it('resize scales local terminals and preserves IDs', () => { const p = imagePart(), result = editPartGeometry(p, { x: 0, y: 0, width: 100, height: 80 }, 200, 40); expect(result.terminals[0]).toMatchObject({ id: 't', x: 60, y: 20 }); expect(p.terminals[0].x).toBe(30); });
  it('crop translates terminals and rejects lost visible or hidden terminals', () => { const p = imagePart(); expect(editPartGeometry(p, { x: 20, y: 10, width: 80, height: 70 }, 80, 70).terminals[0]).toMatchObject({ x: 10, y: 30 }); p.terminals[0].visible = false; expect(() => editPartGeometry(p, { x: 40, y: 0, width: 60, height: 80 }, 60, 80)).toThrow('단자'); });
  it('rejects unsupported composite edits and invalid dimensions without mutation', () => { const p = imagePart(); p.objects.push(newObject('point', { x: 0, y: 0 })); expect(() => editPartGeometry(p, { x: 0, y: 0, width: 100, height: 80 }, 50, 40)).toThrow('단일 이미지'); expect(() => editPartGeometry(imagePart(), { x: -1, y: 0, width: 100, height: 80 }, 50, 40)).toThrow(); });
  it('image clipboard imports independent assets and remaps nested image references', () => {
    const p = parseProjectFile(readFileSync('public/objects-images-fixture.wireproj', 'utf8'));
    const e = createEditor(p), sheet = e.document.sheets[0], clip = copySelection(p, sheet, roots(sheet));
    const next = execute(e, pasteSelection(sheet.id, clip));
    const pasted = next.document.sheets[0].components.slice(sheet.components.length);
    const image = pasted[0].objects.find(o => o.type === 'image')!;
    if (image.type !== 'image') throw new Error('missing image');
    expect(image.assetId).not.toBe(p.assets[0].id);
    expect(next.document.assets.find(a => a.id === image.assetId)?.source).toBe(p.assets[0].source);
    expect(undo(next).document.assets).toEqual(p.assets);
  });
  it('FE-04 fixture roundtrips with image assets and eligible/ineligible terminals', () => { const p = parseProjectFile(readFileSync('public/objects-images-fixture.wireproj', 'utf8')); expect(parseProjectFile(serializeProject(p))).toEqual(p); expect(p.assets[0].source).toMatch(/^data:image\/png/); expect(p.sheets[0].components[0].terminals.some(t => !t.connectable)).toBe(true); });
});
