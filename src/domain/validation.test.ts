import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createEmptyProject } from "./project";
import { assertProject } from "./validation";
import { parseProjectFile, serializeProject } from "./project-file";
const sample = () => parseProjectFile(readFileSync("public/foundation-sample.wireproj","utf8"));
describe("document boundary",()=>{
 it("defaults to A4 white object snap EZ-001",()=>{const p=createEmptyProject();expect(p.canvas).toMatchObject({width:297,height:210,background:"#ffffff",snapMode:"object"});expect(p.sheets[0].name).toBe("EZ-001");assertProject(p);});
 it("preserves every object, group, asset, part and connection in sample",()=>{const p=sample();expect(parseProjectFile(serializeProject(p))).toEqual(p);});
 it.each(["duplicate","endpoint","cross-page","size","nan","free-bend","cycle","ownership","asset","part","nested","unknown","four-pages"])("rejects %s without modifying source",kind=>{
 const p=sample(); const s=p.sheets[0];
 if(kind==="duplicate")s.objects[0].id=s.components[0].id;
 if(kind==="endpoint")s.wires[0].to={kind:"junction",junctionId:"absent"};
 if(kind==="cross-page"){const other=structuredClone(s);other.id="other";other.name="custom";other.objects=[];other.groups=[];other.components=[];other.wires=[];s.junctions=[];p.sheets.push(other);}
 if(kind==="size")p.canvas.width+=1;
 if(kind==="nan")s.components[0].x=NaN;
 if(kind==="free-bend")s.wires[0].bends=[{x:1,y:1}];
 if(kind==="cycle")s.groups[0].childIds=["group","text"];
 if(kind==="ownership")s.groups.push({id:"g2",childIds:["image","point"]});
 if(kind==="asset")p.assets=[];
 if(kind==="part")p.parts=[];
 if(kind==="nested")Object.assign(s,{wires:{}});
 if(kind==="unknown")Object.assign(p,{futurePayload:{important:true}});
 if(kind==="four-pages")p.sheets=[s,s,s,s];
 const before=structuredClone(p);expect(()=>assertProject(p)).toThrow();expect(p).toEqual(before);
 });
 it("allows several wires on a hidden but connectable terminal",()=>{const p=sample(),s=p.sheets[0];s.components[0].terminals[0].visible=false;s.wires.push({...structuredClone(s.wires[0]),id:"another"});assertProject(p);s.components[0].terminals[0].connectable=false;expect(()=>assertProject(p)).toThrow();});
});
