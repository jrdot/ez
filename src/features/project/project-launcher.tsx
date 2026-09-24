"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { ChevronIcon, CircuitIcon, FolderIcon, PlusIcon } from "@/components/icons";
import { createEmptyProject, type Project } from "@/domain/project";
import { parseProjectFile } from "@/domain/project-file";
import { EditorShell } from "@/features/editor/editor-shell";

export function ProjectLauncher() {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function startProject() {
    try {
      setProject(createEmptyProject());
      setError(null);
    } catch {
      setError("새 프로젝트를 만들 수 없습니다. 페이지를 새로고침한 후 다시 시도해 주세요.");
    }
  }

  async function openProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setProject(parseProjectFile(await file.text()));
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "프로젝트를 열 수 없습니다.");
    }
  }

  if (project) {
    return <EditorShell project={project} onProjectChange={setProject} onClose={() => setProject(null)} />;
  }

  return (
    <main className="launch-page">
      <nav className="launch-nav">
        <Link className="brand" href="/" aria-label="ezwire 홈">
          <span className="brand-mark"><CircuitIcon /></span>
          <span>ezwire</span>
        </Link>
        <span className="phase-badge">FOUNDATION · PHASE 0</span>
      </nav>

      <section className="launch-content">
        <div className="launch-copy">
          <p className="eyebrow"><span /> 로컬 우선 배선 설계 도구</p>
          <h1>아이디어를<br /><em>연결 가능한 도면</em>으로.</h1>
          <p className="launch-description">
            전자 부품과 단자의 연결 관계를 한눈에 정리하고,<br className="desktop-break" />
            제작에 필요한 문서와 BOM까지 한 프로젝트에서 관리하세요.
          </p>

          <div className="launch-actions">
            <button className="button button-primary" type="button" onClick={startProject}>
              <PlusIcon /> 새 프로젝트 <ChevronIcon />
            </button>
            <button className="button button-secondary" type="button" onClick={() => fileInputRef.current?.click()}>
              <FolderIcon /> 프로젝트 열기
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".wireproj,.json,application/json"
              onChange={openProject}
              suppressHydrationWarning
              hidden
            />
          </div>
          {error && <p className="launch-error" role="alert">{error}</p>}
          <p className="privacy-note">계정 없이 바로 시작할 수 있습니다. 프로젝트는 현재 브라우저에서만 처리됩니다.</p>
        </div>

        <div className="preview" aria-hidden="true">
          <div className="preview-glow" />
          <div className="preview-window">
            <div className="preview-topbar">
              <span className="preview-logo"><CircuitIcon /></span>
              <span>제목 없는 프로젝트</span>
              <i />
              <b>저장됨</b>
              <div className="window-controls"><span /><span /><span /></div>
            </div>
            <div className="preview-body">
              <div className="preview-rail"><span className="selected">↖</span><span>＋</span><span>⌁</span><span>T</span></div>
              <div className="preview-canvas">
                <svg viewBox="0 0 720 430">
                  <defs>
                    <pattern id="preview-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                      <path d="M16 0H0V16" fill="none" stroke="#dce7e4" strokeWidth=".6" />
                    </pattern>
                    <filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity=".12" /></filter>
                  </defs>
                  <rect width="720" height="430" fill="url(#preview-grid)" />
                  <path d="M250 205H350V126H468" className="preview-wire wire-blue" />
                  <path d="M250 238H392V275H468" className="preview-wire wire-orange" />
                  <g transform="translate(96 152)" filter="url(#shadow)">
                    <rect width="155" height="132" rx="9" className="preview-part" />
                    <rect x="16" y="18" width="123" height="28" rx="5" className="preview-part-title" />
                    <text x="77" y="37" textAnchor="middle">CONTROLLER</text>
                    <circle cx="155" cy="53" r="6" className="terminal terminal-blue" />
                    <circle cx="155" cy="86" r="6" className="terminal terminal-orange" />
                    <text x="126" y="57" textAnchor="end">D2</text>
                    <text x="126" y="90" textAnchor="end">5V</text>
                  </g>
                  <g transform="translate(468 88)" filter="url(#shadow)">
                    <rect width="150" height="225" rx="9" className="preview-part" />
                    <rect x="16" y="18" width="118" height="32" rx="5" className="preview-part-title" />
                    <text x="75" y="39" textAnchor="middle">SENSOR</text>
                    <circle cx="0" cy="38" r="6" className="terminal terminal-blue" />
                    <circle cx="0" cy="187" r="6" className="terminal terminal-orange" />
                    <path d="M38 89h74M38 109h74M38 129h50" className="part-detail" />
                  </g>
                </svg>
                <div className="preview-status"><span>EZ-001</span><b>100%</b></div>
              </div>
              <div className="preview-inspector"><strong>속성</strong><small>선택 없음</small><div /><div /><div /></div>
            </div>
          </div>
        </div>
      </section>

      <footer className="launch-footer">
        <span>© 2026 ezwire</span>
        <span>오프라인에서도 편집 가능한 설계 환경을 준비하고 있습니다.</span>
      </footer>
    </main>
  );
}
