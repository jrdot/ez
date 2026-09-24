import { describe, expect, it } from "vitest";
import { addSheet, deleteActiveSheet, duplicateActiveSheet, cancelPreview, createComponentInstance, createEditor, DEFAULT_PART, execute, groupObjects, moveComponent, redo, snapPoint, switchSheet, undo } from "./editor";
import { createEmptyProject } from "./project";
function fixture() { const p = createEmptyProject(); p.parts.push(structuredClone(DEFAULT_PART)); p.sheets[0].components.push(createComponentInstance("c1", { x: 10, y: 10 }), createComponentInstance("c2", { x: 80, y: 10 })); const [a,b] = p.sheets[0].components; p.sheets[0].junctions.push({ id: "j", x: 60, y: 20 }); p.sheets[0].wires.push({ id: "w", type: "free", from: { kind: "terminal", componentId: a.id, terminalId: a.terminals[0].id }, to: { kind: "terminal", componentId: b.id, terminalId: b.terminals[0].id }, bends: [], color: "red", width: 0.5 }); return p; }
describe("editor contracts", () => {
  it("snaps only in grid mode", () => { expect(snapPoint({x:29,y:51},20,true)).toEqual({x:20,y:60}); expect(snapPoint({x:29,y:51},20,false)).toEqual({x:29,y:51}); });
  it("executes one gesture and restores exact content and connections with monotonic revisions", () => { const s = createEditor(fixture()); const moved = execute(s, moveComponent(s.activeSheetId,"c1",{x:30,y:40})); const back = undo(moved); const forward = redo(back); expect(back.document.sheets).toEqual(s.document.sheets); expect(forward.document.sheets).toEqual(moved.document.sheets); expect([moved.document.revision,back.document.revision,forward.document.revision]).toEqual([1,2,3]); expect(moved.past).toHaveLength(1); expect(s.document.sheets[0].components[0].x).toBe(10); });
  it("isolates active pages, clears preview, rejects wrong target and limits pages", () => { let s = createEditor(fixture()); s = execute(s,addSheet(s.activeSheetId)); const second = s.document.sheets[1].id; s = switchSheet({...s, preview: {componentId:"c1",point:{x:1,y:1}}},second); expect(s.preview).toBeNull(); expect(() => execute(s,moveComponent(s.document.sheets[0].id,"c1",{x:0,y:0}))).toThrow(); s = execute(s,addSheet(second)); expect(() => execute(s,addSheet(second))).toThrow("3페이지"); expect(s.document.sheets.map(x=>x.name)).toEqual(["EZ-001","EZ-002","EZ-003"]); });
  it("preview cancellation and no-op do not change document or history", () => { const s = createEditor(fixture()); expect(cancelPreview({...s, preview:{componentId:"c1",point:{x:9,y:9}}}).document).toBe(s.document); expect(execute(s,moveComponent(s.activeSheetId,"c1",{x:10,y:10})).past).toHaveLength(0); });
  it("discards redo after new command and preserves grouped child IDs", () => { const s = createEditor(fixture()); const grouped = execute(s,groupObjects(s.activeSheetId,["c1","c2"])); expect(grouped.document.sheets[0].groups[0].childIds).toEqual(["c1","c2"]); expect(grouped.document.sheets[0].groups[0].id).not.toBe("c1"); expect(execute(undo(grouped),moveComponent(s.activeSheetId,"c1",{x:30,y:20})).future).toEqual([]); });
  it("rejects dangling deletion atomically", () => { const s=createEditor(fixture()); expect(()=>execute(s,{label:"delete",sheetId:s.activeSheetId,apply:sheet=>{sheet.components=[];}})).toThrow("endpoint"); expect(s.document.sheets[0].components).toHaveLength(2); });
  it("allocates fresh internal IDs for each instance", () => { const a=createComponentInstance("a",{x:0,y:0}),b=createComponentInstance("b",{x:0,y:0}); expect(a.terminals[0].id).not.toBe(b.terminals[0].id); expect(a.terminals[0].id).not.toBe(DEFAULT_PART.terminals[0].id); });
});

it("does not reuse deleted page numbers and remaps copied graph references", () => {
 let s=createEditor(fixture()); s=execute(s,duplicateActiveSheet(s.activeSheetId));
 const copy=s.document.sheets[1]; expect(copy.components[0].id).not.toBe("c1");
 expect(copy.wires[0].from).toEqual({kind:"terminal",componentId:copy.components[0].id,terminalId:copy.components[0].terminals[0].id});
 s=switchSheet(s,copy.id); s=execute(s,deleteActiveSheet(copy.id));
 s=execute(s,addSheet(s.activeSheetId)); expect(s.document.sheets[1].name).toBe("EZ-003");
});
it("rejects mutations of inactive pages even through custom commands",()=>{
 let s=createEditor(fixture());s=execute(s,addSheet(s.activeSheetId));
 expect(()=>execute(s,{label:"bad",sheetId:s.activeSheetId,apply:(_,p)=>{p.sheets[1].name="changed";}})).toThrow("비활성");
});
