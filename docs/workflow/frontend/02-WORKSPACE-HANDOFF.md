# FE-02 인계 — 2026-09-23

상태: FE-02 구현·검증 완료. `02-WORKSPACE`는 main의 FE-01 병합 커밋 `74a86e9`에서 시작했다. 착수 시 사용자 변경 없음. 백엔드/API/DB 변경 없음.

## 구현 및 변경 파일

| 파일 | 구현 |
|---|---|
| `src/features/editor/editor-shell.tsx` | 5영역, Mouse/Wire/Image 및 고정 Toolbox, 라이브러리/공용부품 탭, 양쪽 Sidebar 접힘, 페이지 탭/3페이지 제한, 용지, 속성 표시, 한 줄 요약, 하단 진입점, Grid/Snap/Zoom/Full Screen, Help/System 배경색 |
| `src/features/editor/editor-canvas.tsx` | 유한 도면/문서 Grid 레이어, CTM 기반 드래그·기본 부품 DnD, Wheel/Space/휠 버튼 Pan, Snap Preview, 모드별 입력 제한 |
| `src/features/editor/workspace-input.ts` | 실제 SVG CTM의 client→viewport 변환, 입력 보호, Wheel 정규화/우선순위 |
| `src/domain/coordinates.ts` | 기존 변환 위에 `zoomAt`, `panBy` 추가 |
| `src/domain/snap.ts` | 결정적 후보 수집/선택, Object/Grid/Off 보정, 별도의 유효 연결 후보 검색 |
| `src/app/globals.css` | UI 토큰, 데스크톱 레이아웃, 선택/포커스/준비 상태, 패널 스크롤 및 한 줄 요약 |
| `src/domain/workspace.test.ts`, `e2e/workspace.spec.ts` | 좌표·Snap·입력 보호·실제 브라우저 상호작용 검증 |
| `AGENTS.md`, `CLAUDE.md` | `next dev` 자동 생성 지침. Next 설치본 generator로 출처 확인, 로컬 use-client 가이드 확인 |
| 워크플로우 README, FE-02 가이드·인계, 추적표 | 구현 상태·선택·증거 및 FE-03 연결 계약 |

기존 생성/열기/닫기, 추가/삭제, 실제 단자, Undo/Redo, ID·파일 검증은 유지했다. 범용 객체 및 배선 렌더링은 FE-01과 마찬가지로 후속 단계이며 파일 데이터는 보존한다.

## 좌표·입력 API

- 문서 mm, 화면 CSS px, 부품 로컬 mm 계약 유지. `paperSize`, `localToDocument`, `documentToLocal`, `documentToScreen`, `screenToDocument` 재사용.
- 입력 순서: `clientToViewport(svg, {x: clientX, y: clientY})` → `screenToDocument(point, view)` → 필요 시 `documentToLocal`. SVG root에는 viewBox를 두지 않아 viewport 단위가 CSS px이며, 실제 CTM 역행렬이 화면 오프셋/조상 변환을 반영한다. Sidebar 변경 때 bounding box의 폭 비례로 문서 좌표를 추정하지 않는다.
- 렌더링: `documentToScreen({x:0,y:0}, view)`로 얻은 이동 및 `pixelsPerMm * zoom` 배율을 하나의 문서 `<g>`에 적용. Grid·도면·부품·Preview는 이 레이어를 공유한다. 용지/Sidebar/창 크기는 배율을 자동 변경하지 않는다.
- `zoomAt(view, viewportAnchor, zoom)`은 앵커의 문서 위치를 보존하며 20–400%로 제한한다. `panBy(view, deltaCssPx)`는 화면 이동만 바꾼다. 하단 줌은 viewport 중심, Wheel 줌은 포인터 중심이다.
- `wheelViewport` 우선순위는 Ctrl/Alt → Shift → 기본. Wheel deltaMode line=16px, page=viewport 높이로 정규화한다. 기본 세로 및 trackpad deltaX, Shift 가로, Ctrl/Alt 지수 줌(`exp(-deltaY*0.002)`). 줌 중 Shift는 무시한다.
- Pan 우선순위는 휠 버튼 또는 Space+왼쪽 Drag → Mouse 객체 이동 → 빈 영역 선택 해제. Space는 **캔버스에 포커스가 있을 때** 소비한다. canvas Wheel만 non-passive listener에서 preventDefault한다.
- `isProtectedTarget`은 input/textarea/select/button/contenteditable/dialog 및 하위 요소를 보호한다. 창 blur, 캔버스 blur, Esc, pointercancel/lost capture는 Preview를 취소한다. 드래그 중 Wheel 탐색도 취소 후 이동한다. 페이지/모드/revision 변경은 캔버스 제스처를 폐기한다.
- 탐색 상태는 셸의 `Viewport` 하나이며 파일·이력에 포함하지 않는다. 페이지 사이에는 같은 탐색 시점을 유지하되 선택/Preview는 `switchSheet`로 초기화한다. Grid 표시도 세션 UI 상태다. 중복 문서·선택·페이지 상태를 추가하지 않았다.

## Snap·확정 명령·활성 페이지 API

- `snapCandidates(sheet, excludeId?)`: 활성 페이지의 표시되고 연결 가능한 단자(로컬 변환 반영), 기존 Junction, 부품 원점, 기본 객체 transform 원점. 이동 부품 자신의 원점/단자는 제외한다.
- `nearestCandidate(point, candidates, pixelsPerMm)`: 10 CSS px 이내 최단 거리, 동률이면 Terminal → Junction → Anchor, 이후 ID 코드 순. Grid 간격은 기존 문서 `gridSize`(기본 5mm).
- `resolveSnap(...)` → `{point, candidate}`. Object는 후보 점, Grid는 FE-01 `snapPoint` 반올림, Off는 원좌표/후보 없음. 드래그 중 부품 **원점**을 보정하며 별도의 모서리/축 정렬은 아직 없다.
- 후보는 반투명 원과 십자로 표시한다. 동일 반환 point를 `state.preview` 및 pointerup `moveComponent` 명령에 사용한다. DnD도 같은 변환·Snap을 거친다. 실제 이동은 동작당 한 명령이며 후보 표시만으로 문서를 바꾸지 않는다.
- `connectionCandidate(point, sheet, pixelsPerMm)`는 위치 Snap과 독립된 연결 대상 탐색이다. Wire 모드에서 Off여도 유효 Terminal/Junction만 표시한다. Anchor/Grid/빈 좌표는 endpoint가 될 수 없다. 확정 endpoint 제약은 기존 `assertProject`/`resolveEndpoint`가 계속 강제한다.
- **미구현:** 기존 배선 중간 분기 후보, 경로·교차 Shadow, 배선 생성. Off와 중간 분기 후보의 정책은 FE-04A 전에 확정한다. 숨긴 단자는 새로운 후보로 노출하지 않으며 기존 연결의 유효성은 변경하지 않는다.
- `activeSheet`, `switchSheet`, `switchMode`, `execute`, `addSheet`, `moveComponent`, `undo`, `redo`를 그대로 사용한다. 문서 설정은 `execute`의 활성 sheetId 명령에서 project.canvas를 갱신한다. 문서 설정은 프로젝트 공통이며 Undo 가능하다.
- 용지 축소/방향 변경은 객체를 삭제·이동하지 않는다. 경계 밖 객체도 회색 여백에서 보존·접근 가능하다. 해당 정책을 우측 문서 정보에 표시한다. 페이지 삭제/이름 변경 UI는 추가하지 않았다.

## UI 토큰·후속 연결 위치

구현 선택이며 규격의 고정 수치가 아니다.

- `.editor-shell`: Header 64px, 왼쪽 216px, 오른쪽 240px, 접힘 36px, 하단 80px, 최소 데스크톱 폭 1024px. 작은 폭은 가로 넘침을 허용하며 모바일 완료를 주장하지 않는다.
- 색상은 기존 `--ink/--muted/--line/--surface/--teal/--teal-soft` 계열을 유지. 선택/Preview는 teal, 준비 중은 disabled 및 명시적 문구. 모든 조작에 접근 가능한 이름·포커스/활성 상태를 제공한다.
- 초기 viewport 여백 24px, 96/25.4 CSS px/mm, 줌 55%. 종이 자체는 기본 흰색, 주변은 회녹색. 물리 출력 DPI와 독립이다.
- `EditorShell`의 `mode-toolbox`: FE-03 객체/이미지 도구, FE-04 배선 도구 연결 위치. 모드 상태는 `EditorState.mode` 사용. Wire/Image에서 부품 이동/DnD 차단.
- `library-content`: 기본 컨트롤러 클릭/DnD만 제공. FE-03 사용자 부품 등록·목록·수정, FE-05 공용 서비스 연결. 공용부품은 실제 서비스 완료로 표시하지 않는다.
- `inspector-selection`: 현재 선택 부품 ID·좌표·크기·회전·배율 전체 표시, 속성 입력은 FE-03. 선택 요약은 nowrap/ellipsis/title이며 자세한 정보는 우측 패널에서 확인.
- `bottom-tools`/`bottom-system`: 실제 Zoom/Grid/Snap/Full Screen, BOM/Table/Code/PDF/PNG는 준비 중 및 비활성. Help는 현재 조작 안내, System은 배경색 편집만 구현. 저장·출력 완료를 가장하는 동작 없음.

## 검증·시각 확인

- `npm test`: 6파일 39개 통과. 기존 34개 + 줌 앵커/제한/좌표 왕복, Wheel 우선순위, 변환된 단자/후보 거리·동률, Grid Preview/명령 일치·Off endpoint 거부, 보호 입력.
- `npm run typecheck`, `npm run lint`, `npm run build`: 통과.
- `PLAYWRIGHT_PORT=3102 npm run test:e2e -- --reporter=line`: 기존 8개 + Workspace 시나리오. 최종 **13개 전체 통과**. Sidebar 후 드래그/DnD, Object/Grid Preview와 확정 일치, Off 보정 없음, 페이지/모드 취소, System 배경색 Undo, Full Screen 진입/종료 포함.
- 시각 확인: Chromium 1280×720 펼침/접힘 화면을 직접 열어 도면/Grid/선택, Toolbox 고정, 단일 행 요약, 패널 확장을 확인. 1024×768 Wire 화면도 직접 확인하여 모드 강조·도구 준비 상태·하단 접근성과 패널 표시를 검증했다.
- 캡처는 `test-results/workspace-expanded.png`, `workspace-collapsed.png`, `workspace-1024-wire.png`에 생성하며 git 제외 경로다. 테스트 재실행 시 다시 생성한다.
- 첫 검증에서 테스트의 미등록 part fixture와 Vitest alias import를 수정했고, 화면 중심 줌으로 화면 밖으로 나간 부품을 드래그하던 테스트를 포인터 중심 줌 시나리오로 수정했다. 실패를 통과 결과로 간주하지 않았다.

## 남은 문제·FE-03 시작 조건

FE-03은 이 좌표/입력/Snap/활성 페이지 계약 위에서 시작 가능하다. 이 단계의 UI 미정 수치는 위 구현 선택으로 기록했으며 차단 중인 FE-02 항목은 없다.

FE-03 작업: 네 기본 객체 렌더링/편집, 사용자 부품 등록·편집, 범용 DnD payload, 다중 선택/회전/단축키, 이미지 편집·자산 어댑터. 현재 컨트롤러의 `application/x-ezwire-part` payload는 기본 part ID만 허용하므로 임의 데이터로 확장할 때 라이브러리 정의 조회·검증을 추가해야 한다. 제스처 Preview는 확정 명령과 계속 분리하고 props 입력은 canvas 이벤트 영역 밖에 둔다.

미실행/후속: Firefox/WebKit/모바일, 100부품·300배선 성능, 실제 저장·자동복구·출력·공용 서비스. 편집은 메모리에만 남으며 닫기/새로고침 시 보존하지 않는다. 객체/배선 기능 전체가 구현된 것으로 해석하지 않는다.

최종 `git diff --check` 통과. 변경은 `02-WORKSPACE`에 커밋 후 기존 main worktree의 변경 없음과 기준 커밋을 확인하여 로컬 main에 fast-forward 병합한다. 원격 push/PR 및 FE-03 구현은 이번 작업에서 수행하지 않는다.
