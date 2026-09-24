# 요구사항 추적표와 결정 목록

두 규격서의 모든 REQ/DES ID를 실행 단계에 연결한다. 아래 상태는 가이드 작성 시점의 계획 상태이며 코드 검증 완료를 뜻하지 않는다. 구현 에이전트는 각 행에 실제 파일·테스트명 또는 증거 경로를 추가하고 상태를 갱신한다.

상태 값: `계획`, `진행`, `검증 완료`, `결정 대기`, `연동 대기`, `허용 연기`. 일반적인 기능 생략은 허용 연기로 기록할 수 없다. 명시적으로 허용된 연기는 45° Bend의 대각 이동이다.

| 규격 ID | 실행 단계 | 검증 초점 | 상태 / 구현·증거 |
|---|---|---|---|
| `REQ-LAYOUT-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-HEADER-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-MODE-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 완료 / 후속 기능 대기: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-TOOLBOX-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 완료 / 후속 기능 대기: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-SIDEBAR-L-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-LIBRARY-001` | [FE-03 / FE-05](03-OBJECTS-IMAGES.md) | 등록·목록·수정·DnD·공용 목록·Paste·Crop/배경 제거/Resize | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-PUBLIC-LIBRARY-001` | [FE-03 / FE-05](03-OBJECTS-IMAGES.md) | 등록·목록·수정·DnD·공용 목록·Paste·Crop/배경 제거/Resize | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-SIDEBAR-L-002` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-SIDEBAR-R-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-SIDEBAR-R-002` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-CANVAS-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 완료 / 후속 기능 대기: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-CANVAS-SIZE-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-CANVAS-BG-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-GRID-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-SNAP-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-OVERLAP-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-PROJECT-001` | [FE-01 / FE-02](02-WORKSPACE.md) | 최대 3페이지·EZ 번호·페이지별 데이터 격리 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-PAGE-NAME-001` | [FE-01 / FE-02](02-WORKSPACE.md) | 최대 3페이지·EZ 번호·페이지별 데이터 격리 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-OBJECT-001` | [FE-01 / FE-03](03-OBJECTS-IMAGES.md) | 4객체·복합 부품·고유 ID·그룹의 자식 ID 보존 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-OBJECT-ID-001` | [FE-01 / FE-03](03-OBJECTS-IMAGES.md) | 4객체·복합 부품·고유 ID·그룹의 자식 ID 보존 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-GROUP-001` | [FE-01 / FE-03](03-OBJECTS-IMAGES.md) | 4객체·복합 부품·고유 ID·그룹의 자식 ID 보존 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-TERMINAL-001` | [FE-03 / FE-04](03-OBJECTS-IMAGES.md) | 단자 데이터·복수 연결·부품 편집 이동·배선 모드 고정 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-TERMINAL-002` | [FE-03 / FE-04](03-OBJECTS-IMAGES.md) | 단자 데이터·복수 연결·부품 편집 이동·배선 모드 고정 | FE-03 단자/연결 목록·fixture 완료; 복수 Wire 생성 UI는 FE-04. `objects.ts`, `entity-properties.tsx`, `objects.test.ts`; [계약](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-TERMINAL-003` | [FE-03 / FE-04](03-OBJECTS-IMAGES.md) | 단자 데이터·복수 연결·부품 편집 이동·배선 모드 고정 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-CLIPBOARD-001` | [FE-03 / FE-05](03-OBJECTS-IMAGES.md) | 등록·목록·수정·DnD·공용 목록·Paste·Crop/배경 제거/Resize | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-IMAGE-001` | [FE-03 / FE-05](03-OBJECTS-IMAGES.md) | 등록·목록·수정·DnD·공용 목록·Paste·Crop/배경 제거/Resize | FE-03 Crop/Resize 검증 · 배경 제거는 사용자 지시로 외부 AI 연동 대기. `image.ts`, `image-edit.ts`, `image-editor.tsx`, `objects.test.ts`, `image.test.ts`, `e2e/objects-images.spec.ts`; [인계](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-SELECT-001` | [FE-03](03-OBJECTS-IMAGES.md) | 선택 토글·단축키·입력 보호·자유/45° 회전 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-SHORTCUT-001` | [FE-03](03-OBJECTS-IMAGES.md) | 선택 토글·단축키·입력 보호·자유/45° 회전 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-ROTATE-001` | [FE-03](03-OBJECTS-IMAGES.md) | 선택 토글·단축키·입력 보호·자유/45° 회전 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-ROTATE-002` | [FE-03](03-OBJECTS-IMAGES.md) | 선택 토글·단축키·입력 보호·자유/45° 회전 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `REQ-NAV-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-PAN-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-WIRE-ENDPOINT-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 진행 / FE-01 데이터·검증: `src/domain/project.ts`, `validation.ts`, `coordinates.test.ts`, `editor.test.ts`, `validation.test.ts`; UI/동작 후속 단계 |
| `REQ-WIRE-TYPE-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-FREE-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 진행 / FE-01 데이터·검증: `src/domain/project.ts`, `validation.ts`, `coordinates.test.ts`, `editor.test.ts`, `validation.test.ts`; UI/동작 후속 단계 |
| `REQ-WIRE-STYLE-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-EDIT-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-BEND-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-BEND-DELETE-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-BEND-MOVE-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-BEND-MOVE-002` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-JUNCTION-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-JUNCTION-002` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-JUNCTION-003` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-JUNCTION-004` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-CROSS-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-CROSS-002` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-SHADOW-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-WIRE-SHADOW-002` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `REQ-BOTTOM-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 완료 / 후속 기능 대기: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `REQ-BOTTOM-002` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-HEADER-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-MODE-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 완료 / 후속 기능 대기: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-TOOLBOX-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 완료 / 후속 기능 대기: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-SIDEBAR-L-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-SIDEBAR-L-002` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-SIDEBAR-R-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-SIDEBAR-R-002` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-CANVAS-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-CANVAS-002` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-CANVAS-003` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-PAGE-001` | [FE-01 / FE-02](02-WORKSPACE.md) | 최대 3페이지·EZ 번호·페이지별 데이터 격리 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-PAGE-002` | [FE-01 / FE-02](02-WORKSPACE.md) | 최대 3페이지·EZ 번호·페이지별 데이터 격리 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-OBJECT-001` | [FE-01 / FE-03](03-OBJECTS-IMAGES.md) | 4객체·복합 부품·고유 ID·그룹의 자식 ID 보존 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `DES-OBJECT-002` | [FE-01 / FE-03](03-OBJECTS-IMAGES.md) | 4객체·복합 부품·고유 ID·그룹의 자식 ID 보존 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `DES-OBJECT-ID-001` | [FE-01 / FE-03](03-OBJECTS-IMAGES.md) | 4객체·복합 부품·고유 ID·그룹의 자식 ID 보존 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `DES-TERMINAL-001` | [FE-03 / FE-04](03-OBJECTS-IMAGES.md) | 단자 데이터·복수 연결·부품 편집 이동·배선 모드 고정 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `DES-TERMINAL-002` | [FE-03 / FE-04](03-OBJECTS-IMAGES.md) | 단자 데이터·복수 연결·부품 편집 이동·배선 모드 고정 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `DES-TERMINAL-003` | [FE-03 / FE-04](03-OBJECTS-IMAGES.md) | 단자 데이터·복수 연결·부품 편집 이동·배선 모드 고정 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `DES-SNAP-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-SNAP-002` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-SELECT-001` | [FE-03](03-OBJECTS-IMAGES.md) | 선택 토글·단축키·입력 보호·자유/45° 회전 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `DES-ROTATE-001` | [FE-03](03-OBJECTS-IMAGES.md) | 선택 토글·단축키·입력 보호·자유/45° 회전 | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `DES-NAV-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-PAN-001` | [FE-02 / FE-03](02-WORKSPACE.md) | 용지·배경·좌표 변환·탐색·스냅·겹침 허용 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-WIRE-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-WIRE-ENDPOINT-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 진행 / FE-01 데이터·검증: `src/domain/project.ts`, `validation.ts`, `coordinates.test.ts`, `editor.test.ts`, `validation.test.ts`; UI/동작 후속 단계 |
| `DES-WIRE-TYPE-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-BEND-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-BEND-002` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-BEND-003` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-BEND-MOVE-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-BEND-MOVE-002` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-JUNCTION-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-JUNCTION-002` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-JUNCTION-003` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-CROSS-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-CROSS-002` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-CROSS-003` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-WIRE-SHADOW-001` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-WIRE-SHADOW-002` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-WIRE-SHADOW-003` | [FE-04](04-WIRING.md) | 대상 ID의 배선 불변 조건과 생성/편집/취소/복원 시나리오 | 계획 / 미기록 |
| `DES-IMAGE-001` | [FE-03 / FE-05](03-OBJECTS-IMAGES.md) | 등록·목록·수정·DnD·공용 목록·Paste·Crop/배경 제거/Resize | FE-03 Crop/Resize 검증 · 배경 제거는 사용자 지시로 외부 AI 연동 대기. `image.ts`, `image-edit.ts`, `image-editor.tsx`, `objects.test.ts`, `image.test.ts`, `e2e/objects-images.spec.ts`; [인계](03-OBJECTS-IMAGES-HANDOFF.md) |
| `DES-IMAGE-002` | [FE-03 / FE-05](03-OBJECTS-IMAGES.md) | 등록·목록·수정·DnD·공용 목록·Paste·Crop/배경 제거/Resize | FE-03 구현·검증: `objects.ts`, `editor-canvas.tsx`, `editor-shell.tsx`, `entity-properties.tsx`, `part-editor.tsx`, `image-editor.tsx`; `objects.test.ts`, `e2e/objects-images.spec.ts`; [범위·제한](03-OBJECTS-IMAGES-HANDOFF.md) |
| `DES-BOTTOM-001` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-BOTTOM-002` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 검증 완료: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-BOTTOM-003` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 완료 / 후속 기능 대기: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-BOTTOM-004` | [FE-02 / FE-05](02-WORKSPACE.md) | 영역·모드·접힘·속성·한 줄 요약 및 보조 기능 진입/실행 | FE-02 완료 / 후속 기능 대기: `editor-shell.tsx`, `editor-canvas.tsx`, `workspace-input.ts`, `snap.ts`; `workspace.test.ts`, `e2e/workspace.spec.ts` 및 기존 FE-01 검사. [범위·증거](02-WORKSPACE-HANDOFF.md) |
| `DES-SYSTEM-001` | [FE-05](05-INTEGRATIONS.md) | System 배경색 변경; 추가 설정 후보와 확정 범위 구분 | FE-02 배경색/Undo 구현·검증 / Help·System 상세 후속: `editor-shell.tsx`, `e2e/workspace.spec.ts` |

## 미정 항목의 결정 시점

원문 §19(요구사항)와 §20(설계)의 번호 없는 미정 항목도 별도 추적한다. 아래는 결정 작업 목록이며 요구사항 승인으로 간주하지 않는다. 결정 기록에는 선택·근거·영향 ID·데이터 호환·검증 변경을 포함한다.

| 결정 묶음 | 포함 항목 | 결정 시점 |
|---|---|---|
| UI 기준 | 레이아웃 수치·Header/Sidebar 크기·색·아이콘, Terminal/Junction 모양·크기·색, Shadow 표현 | FE-02 기본 스타일, FE-03/04 대상별 스타일 |
| 플랫폼 | Canvas 렌더러 해석, 모바일/태블릿 지원 범위 | FE-01/02 |
| 도메인 | 객체/그룹 ID 형식·번호, 부품 내부 구조·단자 상세·표시/연결 규칙 | FE-01, FE-03 전 |
| 라이브러리 | 카드 UI·공용 검색/분류·부품 Wizard·단자 생성/수정 UI·정의 수정 전파 | FE-03 |
| 배선 생성 | 클릭 순서·90°/45° 경로 규칙·부품 이미지 위 통과·Snap Off와 분기 후보 | FE-04A 전 |
| 배선 표현 | Jump 크기/방향·대상 Wire, Junction/Shadow 표현, 중첩·끝점 접촉 | FE-04B 전 |
| 편집 이력 | Undo/Redo 범위·제스처 경계·복사 범위·관련 연결 삭제/복원 | FE-01 초안, FE-03/04 확정 |
| 보조 화면 | BOM/Table 데이터·열·편집·집계 범위, Help/System 상세 | FE-05 해당 기능 전 |
| 출력 | Code 목적·형식, PDF/PNG 범위·해상도·배경/Grid | FE-05 해당 기능 전 |
| 보존 | 저장/열기 포맷·자산·버전, 자동저장·복구·충돌 | FE-01 호환 방침, FE-05 연동 전 |
| 서비스 | 사용자 계정·공용부품 관리 정책·API, 배경 제거 처리 방식 | FE-03 어댑터 선택/FE-05 실제 연동 전 |

서로 충돌하거나 데이터 손실/제품 의미를 바꾸는 선택은 해당 기능에 한해 확인을 요청한다. 독립적인 좌표·레이아웃·객체·검증 작업까지 중지할 이유로 사용하지 않는다.

## FE-01 결정·증거

[FE-01 인계](01-FOUNDATION-HANDOFF.md)에 확정 요구·구현 선택·사용자 확인·확인 대기를 구분했다. 편집 이력/삭제/번호 정책은 사용자 권장안 승인. 사용자 지시에 따라 현재 규격과 충돌하는 임시 모델·샘플·전용 호환 테스트 및 마이그레이션 요구를 제거했다. 현재 포맷의 데이터 검증은 유지한다. 후속 단계의 UI와 배선 알고리즘을 데이터 타입 검증만으로 완료 처리하지 않는다.

## FE-02 결정·증거

[FE-02 인계](02-WORKSPACE-HANDOFF.md)에 UI 수치, 좌표/입력 우선순위, 후보 거리/동률 정책, 용지 경계 보존, 페이지 전환 취소 및 검증을 기록했다. 라이브러리 DnD는 기본 부품만 지원한다. Wire/Image 모드 전환 및 진입점은 완료했으나 실제 편집 도구와 공용부품 서비스, BOM/Table/출력은 후속 단계다. 이를 전체 기능 완료로 처리하지 않는다.

## FE-03 결정·증거

[FE-03 인계](03-OBJECTS-IMAGES-HANDOFF.md)에 객체/클립보드/단자/이미지 API, 변환·보존 정책과 검증 증거를 기록했다. 배경 제거는 사용자 요청에 따라 외부 AI 연동 확정까지 대기한다. 공용부품은 샘플 읽기 어댑터이며 실제 연동이 아니다. FE-04 시작은 가능하며 경로/분기/교차 편집을 FE-03 완료에 포함하지 않는다.
