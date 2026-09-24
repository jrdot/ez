import { describe, expect, it } from "vitest";
import { createEmptyProject, PROJECT_FORMAT_VERSION } from "./project";
import { parseProjectFile, ProjectFileError, serializeProject } from "./project-file";

describe("project file", () => {
  it("creates a versioned project with one empty sheet", () => {
    const project = createEmptyProject(new Date("2026-09-22T00:00:00.000Z"));

    expect(project.formatVersion).toBe(PROJECT_FORMAT_VERSION);
    expect(project.revision).toBe(0);
    expect(project.sheets).toHaveLength(1);
    expect(project.sheets[0].components).toEqual([]);
    expect(project.createdAt).toBe("2026-09-22T00:00:00.000Z");
  });

  it("round-trips a project without losing its document data", () => {
    const project = createEmptyProject();

    expect(parseProjectFile(serializeProject(project))).toEqual(project);
  });

  it("rejects an unknown file format", () => {
    expect(() => parseProjectFile('{"format":"other","version":1}')).toThrow(
      ProjectFileError,
    );
  });

  it("rejects a newer file version until a migration exists", () => {
    expect(() =>
      parseProjectFile('{"format":"ezwire-project","version":99,"project":{}}'),
    ).toThrow("지원하지 않는 파일 버전입니다: 99");
  });
});

