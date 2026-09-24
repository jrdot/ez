# FE-01 인계 — 2026-09-23

상태: FE-01 구현·검증 완료. 현재 규격 우선 방침 확인으로 종료 게이트 충족. 작업 브랜치 `01-FOUNDATION`. 착수 시 사용자 변경 없음. main 병합은 아직 수행하지 않음.

## 확정 요구와 결정

| 구분 | 계약 / 근거 |
|---|---|
| 규격 확정 | A4 가로, 흰 배경, Object Snap, EZ-001, 최대 3페이지. A4/A3 양 방향 치수 제공. |
| 규격 확정 | Image/Line/Point/Text, 복합 부품, 그룹 신규 ID 및 자식 ID 유지. Terminal/Junction만 Wire endpoint. Free에 Bend 금지. |
| 사용자 확인 | 2026-09-23: 확정 편집을 동작당 Undo 1회, 삭제된 페이지 번호 재사용 안 함, 연결 부품 삭제는 거부. |
| 구현 선택 | 문서 mm, 화면 CSS px, 부품 로컬 mm. 좌상단 원점, +x 오른쪽/+y 아래. 로컬 (0,0) 중심 scale → 시계방향 회전 → 이동. SVG CTM 역변환으로 실제 letterbox와 화면 오프셋 처리. 출력 DPI는 좌표 계약과 독립. |
| 구현 선택 | 기존 SVG 유지. ID는 UUID v4 생성, 가져온 ID는 비어 있지 않은 문자열 허용. 프로젝트 전체(정의 내부 포함) 중복 금지. 표시 번호와 ID 분리. |
| 구현 선택 | 그룹은 같은 페이지의 객체/부품/그룹 참조. 자식 좌표는 페이지 좌표 그대로. 순환·중복 소유 금지. 부품 내부 객체/단자는 부품 로컬 좌표, 정의 복제 시 신규 ID 발행. 정의 변경 자동 전파 없음. |
| 구현 선택 | Junction은 공유 노드, Wire 양끝으로 참조. 분기는 Wire 분할 표현을 사용하며 기존 segment ID 한 개 유지/추가 segment 신규 ID를 FE-04 명령에서 구현할 예정. 저장 역참조 없이 연결 Wire 목록을 파생. 좌표 일치는 연결이 아님. |
| 구현 선택 | v2 파일은 project 내부에 parts/assets 보유. 앱 버전은 package.json, 포맷 버전은 2, revision은 확정 명령/Undo/Redo마다 증가. 취소/no-op는 증가 안 함. |
| 사용자 지시 / 구현 선택 | 현재 사용자 요구사항·설계 규격을 기준으로 개발. 충돌하는 임시 모델·샘플·전용 호환 테스트와 마이그레이션 요구를 제거함. 현재 포맷의 버전·무결성 검증은 유지함. |

## 변경 파일과 API

- `src/domain/project.ts`: 타입, `createEmptyProject`, `createSheet`, 용지/페이지 기본값.
- `src/domain/coordinates.ts`: `paperSize`, `localToDocument`, `documentToLocal`, `documentToScreen`, `screenToDocument`.
- `src/domain/validation.ts`: `assertProject(unknown)`, `resolveEndpoint`. 전체 중첩 구조, 유한 수치/양수 크기, ID, 참조, 자산, 그룹, 페이지 검사. 미지원 필드는 조용히 버리지 않고 경로 포함 오류 반환.
- `src/domain/editor.ts`: `createEditor`, `activeSheet`, `execute`, `undo`, `redo`, `switchSheet`, `switchMode`, `cancelPreview`, `addSheet`, `deleteActiveSheet`, `duplicateActiveSheet`, `moveComponent`, `groupObjects`, `connectedWires`, `createComponentInstance`.
- `src/domain/project-file.ts`: `serializeProject`와 `parseProjectFile`, 양방향 검증. UTF-8 JSON, 알 수 없는 버전/필드는 명시적 거부. 입력 문자열과 디스크 파일을 수정하지 않음.
- `src/features/editor/editor-shell.tsx`: 활성 페이지, 추가 제한, 명령/Undo/Redo, 검증 오류 표시. 저장하지 않은 문서를 ‘저장됨’으로 표시하던 문구 정정.
- `src/features/editor/editor-canvas.tsx`: 실제 Terminal 표시, CTM 변환, 임시 드래그/확정 명령 분리.
- `src/domain/*.test.ts`, `e2e/project-lifecycle.spec.ts`: 계약과 기존 진입 회귀.

```ts
const document = createEmptyProject();
let editor = createEditor(document);
editor = execute(editor, addSheet(editor.activeSheetId));
editor = switchSheet(editor, editor.document.sheets[1].id);
// UI 입력은 preview만 갱신. 확정 시 아래 명령을 한 번 실행한다.
editor = execute(editor, {
  label: "부품 추가", sheetId: editor.activeSheetId,
  apply: (sheet, project) => {
    project.parts.push(structuredClone(DEFAULT_PART));
    sheet.components.push(createComponentInstance(createId(), { x: 20, y: 30 }));
  },
});
editor = execute(editor, moveComponent(editor.activeSheetId,
  activeSheet(editor).components[0].id, { x: 40, y: 50 }));
editor = undo(editor);
editor = redo(editor);
const reopened = parseProjectFile(serializeProject(editor.document));
const screen = documentToScreen({ x: 10, y: 20 }, {
  origin: { x: 100, y: 60 }, pan: { x: 0, y: 0 },
  pixelsPerMm: 96 / 25.4, zoom: 1.5,
});
```

명령 apply는 복제본에서 실행하고 전체 검증 성공 후 게시한다. 비활성 기존 페이지 수정과 메타데이터 직접 변경을 거부한다. 오류는 문서와 이력을 변경하지 않는다. 새 명령은 redo를 폐기한다. Snapshot 이력은 FE-01의 단순하고 검증 가능한 구현 선택이며 대규모 문서의 메모리 최적화는 별도다. Undo는 페이지 번호를 포함한 문서 내용을 복원하므로 취소한 생성 번호는 재사용 가능하지만 확정 삭제는 nextSheetNumber를 낮추지 않는다.

Preview는 문서/파일/이력에 포함되지 않는다. pointerup에 한 번 확정하고 Esc/pointercancel/lost capture/blur/페이지 전환은 취소한다. `switchMode`도 Preview를 비운다. FE-02/03 입력 구현은 이 계약을 사용해야 한다. 모드 UI와 전체 키보드 단축키는 후속 단계다.

## FE-02 샘플과 시작 조건

- `public/sample-project.wireproj`: v2 빈 문서, 생성/열기/닫기 회귀용.
- `public/foundation-sample.wireproj`: 네 객체 타입, 이미지 자산 참조, 그룹, 두 부품/단자, Junction과 두 Wire. 파서 왕복 검증용. 현재 셸은 부품/단자만 렌더링한다. 범용 객체는 FE-03, 배선 렌더링은 FE-04에서 추가한다.

FE-02는 활성 페이지·Viewport 변환·Preview/명령 API 위에서 시작 가능하다. Object Snap의 기본 상태는 구현했으나 실제 대상 탐색/시각적 Preview와 줌/팬 조작은 FE-02/03 범위다. Wire 경로 각도 제약/분할 알고리즘/교차 표시/숨긴 단자의 hit-test 및 Preview 정책은 FE-04에서 결정·검증한다. hidden과 connectable은 독립 데이터이며 기존 숨긴 단자 연결은 유효하다. 모바일 범위, 파일 저장 UI/자동저장/충돌, 자산 실제 읽기·내보내기, 출력 DPI는 이번 단계의 완료 주장에 포함하지 않는다.

## 검증 기록

| 실행 | 결과 |
|---|---|
| `npm test` | 5개 파일, 34개 테스트 통과. 좌표 왕복, 페이지/ID/그룹/참조, 복제 재매핑, 취소, 명령 복원, 파일 무손실 왕복, 잘못된 데이터 거부. |
| `npm run typecheck` | 통과. |
| `npm run lint` | 통과. |
| `npm run build` | Next.js production build 통과. |
| `PLAYWRIGHT_PORT=3101 npm run test:e2e` | Chromium 8개 통과. 생성/ID fallback·오류/열기/닫기/추가·삭제/페이지·Undo/미지원 버전 오류/드래그·Esc. |
| `git diff --check` | 통과. |

첫 E2E 실행은 3000 포트의 다른 기존 앱을 재사용했으므로 증거에서 제외했다. 전용 포트 실행에서 오류 alert 선택자가 Next route announcer와 충돌한 테스트를 수정한 뒤 8개 전체 재실행 통과했다.

미실행: 백엔드/API/DB 검사(변경 없음), Firefox/WebKit/모바일, 100부품·300배선 성능, 후속 FE-02~05 UI와 실제 저장·자동복구/출력. 이력은 현재 메모리만 사용하며 닫기/새로고침 시 보존하지 않는다.

2026-09-23 충돌 항목 제거 후 재검증: 단위 34개, Chromium E2E 8개, typecheck, lint, diff 검사 통과. production build는 앞선 FE-01 실행 결과이며 이번 문구·샘플 정리 후에는 재실행하지 않았다.
