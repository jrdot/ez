import { PROJECT_FORMAT, PROJECT_FORMAT_VERSION, type Project, type ProjectFile } from "./project";
import { assertProject } from "./validation";
export class ProjectFileError extends Error { constructor(message: string) { super(message); this.name = "ProjectFileError"; } }
export function serializeProject(project: Project): string {
  assertProject(project);
  const file: ProjectFile = { format: PROJECT_FORMAT, version: PROJECT_FORMAT_VERSION, project };
  return JSON.stringify(file, null, 2);
}
export function parseProjectFile(source: string): Project {
  let input: unknown;
  try { input = JSON.parse(source); } catch { throw new ProjectFileError("유효한 JSON 파일이 아닙니다."); }
  if (!input || typeof input !== "object" || !("format" in input) || input.format !== PROJECT_FORMAT) throw new ProjectFileError("ezwire 프로젝트 파일이 아닙니다.");
  const file = input as Record<string, unknown>;
  if (file.version !== PROJECT_FORMAT_VERSION) throw new ProjectFileError(`지원하지 않는 파일 버전입니다: ${String(file.version)}. 현재 지원 버전은 ${PROJECT_FORMAT_VERSION}입니다.`);
  if (Object.keys(file).some(k => !["format", "version", "project"].includes(k))) throw new ProjectFileError("지원하지 않는 파일 필드입니다. 데이터 보존을 위해 열기를 중단합니다.");
  try { assertProject(file.project); } catch (e) { throw new ProjectFileError((e as Error).message); }
  return file.project;
}
