# FE-03 인계 — 2026-09-23

상태: 객체·부품·Crop/Resize 구현 및 검증. **배경 제거는 사용자 지시로 외부 AI 연동 확정까지 대기**이며 완료로 보고하지 않는다. 공용부품은 샘플 읽기 어댑터이고 실제 서비스는 미연동이다. 착수 브랜치 `03-OBJECTS-IMAGES`, 기준 main `d623858`, 사용자 변경 없음. 백엔드/API/DB 변경 없음.

## 구현 내용·파일

| 파일 | 동작 |
|---|---|
| `src/domain/objects.ts` | 선택 루트/그룹 전개, 일반 객체 생성, 그룹·다중 이동/회전/배율, 삭제, 클립보드 그래프·의존 자산 복제, endpoint 월드 위치 |
| `src/domain/image-edit.ts` | Crop/Resize와 로컬 단자 좌표 변환·단자 유실 방지 |
| `src/adapters/image.ts` | PNG/JPEG/WebP 디코딩, Canvas 기반 실제 Crop/Resize, AbortSignal, 제한·오류, 배경 제거 대기 상태 |
| `src/adapters/library.ts` | `PublicPartsAdapter`와 sample/connected/unavailable 상태, 샘플 컨트롤러 목록 |
| `src/features/editor/editor-canvas.tsx`, `object-shape.tsx` | 4객체·복합 부품·단자 렌더링, 단일/토글/그룹 선택, 다중 이동, 회전 핸들, Preview, 기존 CTM/Snap/DnD 재사용 |
| `src/features/editor/editor-shell.tsx` | 생성 도구·명령 연결, 단축키, 라이브러리 등록/수정/배치, 이미지 파일/Paste 진입, 모드별 도구·상태 |
| `entity-properties.tsx`, `part-editor.tsx` | 객체별 속성, 부품·단자·내부 객체 편집, 정의 초안과 적용/취소, native modal |
| `image-editor.tsx` | 이미지 초안·실제 처리 결과 Preview, Crop/Resize, 단자 편집, 등록/수정과 취소 |
| `src/app/globals.css` | 편집 폼·모달·선택 표시·연결 불가 단자 표현 |
| `src/domain/objects.test.ts`, `src/adapters/image.test.ts`, `e2e/objects-images.spec.ts` | 변환·ID·무결성·이미지·입력·UI 회귀 |
| `public/objects-images-fixture.wireproj`, `public/fixture-image.png` | FE-04 연결 후보/변환 개발용 v2 fixture와 실제 PNG |

일반 Line은 도형, 일반 Point는 표시 객체다. Wire/Terminal을 생성하지 않으며 일반 Point가 연결 후보가 되는 일은 없다. Line/Point/Text는 좌측 생성 버튼, Image는 업로드/Paste → 라이브러리 등록 후 `이미지 객체 추가` 버튼으로 독립 배치할 수 있다. 복합 부품은 부품 편집에서 여러 객체와 단자를 조합한다.

## 선택·변환·명령 API

- 기존 `createId`, `execute`, `undo`, `redo`, `activeSheet`, `switchSheet`, `switchMode`, `groupObjects`, `createComponentInstance`, 좌표·Snap API를 재사용한다. v2 스키마 변경 없음.
- `rootId(sheet, id)`, `roots(sheet)`, `expandSelection(sheet, ids)`, `selectedEntities(sheet, ids)`: 중첩 그룹의 소유 루트와 실제 자식 조회. 그룹 선택은 자식을 함께 표시한다. 그룹 신규 ID, 자식 ID 불변. 그룹 생성 직후 새 그룹을 선택한다. 그룹 해제 UI는 제공하지 않는다.
- Click은 단일 선택, Ctrl/Shift+Click은 추가/해제. 다중 선택 중 선택된 객체를 Drag하면 전체 이동, 움직이지 않고 클릭을 끝내면 해당 루트만 선택한다. z-order는 부품 배열 → 독립 객체 배열, 각 배열 후순위가 위이며 부품 내부는 배열 순서 후 단자·라벨을 표시한다. 그룹은 z-order를 바꾸지 않는다.
- `transformOf(entity)`, `selectionCenter(sheet, ids)`, `transformSelection(sheet, ids, change)`, `transformCommand(sheetId, ids, change)`: `change = {delta, angle, center, scale?}`. mm 좌표, 단일 객체 로컬 원점 중심, 그룹/다중은 자식 원점들의 bounding box 중심. 각 자식의 월드 위치·각도를 함께 변경한다. 그룹 별도 transform 필드를 추가하지 않는다.
- `rotationAngle(angle, shift)`: 자유 각도 또는 45° 반올림. 단일 객체는 최종 절대 회전각을 Snap, 그룹·다중은 공동 회전 변화량을 Snap한다. 회전 핸들의 위치는 중심에서 문서 위쪽 12mm, 손잡이 반지름은 5 CSS px다.
- Drag Preview는 Canvas 로컬 편집 상태의 `{ids, value}`이며 확정 문서·파일·이력에 포함되지 않는다. pointerup에 `transformCommand` 한 번. Esc/blur/pointercancel/lost capture/Wheel/페이지·모드·revision 전환은 폐기한다. 기존 FE-01 Preview 취소 통로도 유지한다.
- 단일 속성 폼은 초안 후 `속성 적용` 한 명령, `변경 취소`는 문서 불변. 부품 배율은 단자·내부 객체에 함께 적용된다. 다중/그룹 속성은 혼합 상태를 표시하며 이동 X/Y, 회전 변화, 크기 배수를 한 번에 적용한다. 정의 width/height는 로컬 프레임 치수이며 인스턴스 전체 크기 변경은 배율로 한다.
- `deleteSelection(sheetId, ids)`는 그룹 자식까지 삭제한다. 연결된 부품이 포함되면 전체 삭제를 거부한다. 연결된 단자를 삭제하거나 연결 불가로 변경하는 속성 명령도 기존 `assertProject`가 원자적으로 거부한다.
- Ctrl+C/X/V, Ctrl+Z/Y (Ctrl+Shift+Z 포함), Delete, Ctrl+A, Esc. macOS Meta도 지원. input/textarea/select/contenteditable/button/native dialog는 텍스트 편집을 보호한다. Esc는 진행 제스처를 우선 취소하고 다음 Esc는 선택 해제한다.

## 복사·잘라내기 계약

- `copySelection(project, sheet, ids): ObjectClipboard` → 선택 객체/부품/그룹, 내부 직접 Terminal→Terminal Wire, 필요한 정의와 자산의 독립 스냅샷.
- `pasteSelection(sheetId, clipboard, offset={x:10,y:10}): Command`: 모든 소유 객체·그룹·단자·Wire ID와 정의/자산 ID를 새로 발행하고 `childIds`, `partId`, `assetId`, endpoint의 `componentId/terminalId`를 함께 재매핑한다. Bend에도 동일 위치 오프셋 적용. 원본 등록을 Undo한 후에도 clipboard에 의존 데이터가 남아 있으므로 붙여넣기 가능하다.
- 선택 외부와 연결된 Wire는 복사하지 않는다. Junction 그래프 복사·배선 선택은 FE-04 범위로 남긴다. 클립보드는 세션 내부 객체용이며 외부 프로젝트 JSON을 OS clipboard에서 신뢰하여 가져오지 않는다. 임의 Junction 복사를 완료했다고 주장하지 않는다.
- Cut은 복사 payload를 먼저 확보하고 삭제 검증 성공 시에만 내부 clipboard를 교체한다. 실패하면 문서·이력·기존 clipboard 불변. Paste와 Cut 각각 한 명령/Undo. 붙여넣기 완료 시 새 복제본을 선택한다.
- native copy/cut 이벤트에 `application/x-ezwire-objects` 마커를 기록한다. 외부 이미지 파일이 있으면 내부 객체보다 우선하여 이미지 초안을 연다. 외부 일반 텍스트는 객체로 해석하지 않는다. 브라우저 `clipboard.read()` 권한 요청을 사용하지 않으며 브라우저가 전달하지 않은 clipboard 데이터는 임의로 복구하지 않는다. 버튼 복사 후 버튼 붙여넣기도 제공한다.

## 라이브러리·단자·FE-04 API

- 정의는 `project.parts`, 인스턴스는 활성 `sheet.components`. 정의 등록/수정도 `execute`로 수행해 Undo/Redo 가능. 정의 수정은 이후 배치에만 반영한다(FE-01 정책 유지). 인스턴스 편집은 정의를 변경하지 않는다. 각 배치에서 내부 객체·단자 신규 ID 발행.
- `application/x-ezwire-part` DnD payload는 정의 ID. 현재 개인/공용 어댑터 목록에 존재하는 ID만 배치하며 기존 CTM → document mm → `resolveSnap` 변환을 사용한다. 줌/팬 후 이미지 부품 DnD 좌표를 E2E로 확인했다.
- `PublicPartsAdapter.list(signal?): Promise<{status, parts, message}>`: 현재 `samplePublicParts`만 사용한다. `sample`과 `connected`는 다른 상태이며 UI는 `샘플 목록 · 공용 서비스 미연동`이라고 표시한다. 계정·서버 등록·검색/분류는 구현 범위 밖이다. 개인 라이브러리도 현재 프로젝트 메모리 안에 있으며 새로고침 후 보존을 주장하지 않는다.
- Terminal 필드: 기존 `id/type/role/x/y/name/visible/connectable` 유지. `TerminalFields`에서 추가·이름/좌표/표시/연결 가능 수정·삭제. Wire 모드에서는 속성 폼 비활성, Canvas 직접 Drag 금지. ID는 편집 불가.
- `endpointPosition(sheet, endpoint)`는 Junction 문서 위치 또는 `localToDocument(terminal, component)`를 반환한다. 유효하지 않거나 연결 불가인 Terminal이면 undefined. 기존 `resolveEndpoint`는 로컬 데이터 검증용이므로 월드 좌표 계산과 구분한다.
- `connectedWires(sheet, terminalId)`로 연결 Wire 목록 파생. `connectionCandidate`/`snapCandidates`는 표시되고 연결 가능한 Terminal만 새 후보로 노출한다. 숨긴 단자의 기존 연결은 계속 유효하며 Snap Off에서도 연결 유효성 검사는 유지된다.
- 부품 이동/회전/배율 변경 뒤 endpoint의 월드 위치는 최신 인스턴스에서 계산한다. Wire 경로 재생성·분기 보정·교차 렌더링은 FE-04에서 이어서 구현해야 한다. 이번 단계에서 기존 Wire의 Bend를 임의로 바꾸지 않는다.

## 이미지 어댑터·자산 정책

- 사용자 결정: **배경 제거는 외부 AI 연동 확정까지 대기**. `backgroundRemoval.status = 'pending'`, 버튼 비활성. 가짜 투명화/단색 배경 변경을 배경 제거로 제공하지 않는다. 서비스 제공자, 전송 동의/보존, 비용, 인증, 오류·취소 계약, 품질 기준을 확정한 후 실제 alpha 결과를 검증해야 한다.
- `ImageAdapter.decode(file, signal) -> ImageResult`, `edit(result, cropPixels, widthPixels, heightPixels, signal) -> ImageResult`. ImageResult는 `{asset,width,height}`. 어댑터와 도메인 geometry, React 초안을 분리했다.
- 구현 제한은 `IMAGE_LIMITS`: 입력 12MiB, 한 변 8192px, 1600만 픽셀. PNG/JPEG/WebP만 허용; MIME/디코딩 오류, 영역·크기 오류를 표시한다. GIF/SVG는 명시적으로 거부한다. 처리 결과는 PNG data URL, 임시 blob URL을 문서에 저장하지 않는다.
- 업로드/이미지 Paste → 이름·단자·이미지 초안 → Crop/Resize 적용 Preview → 라이브러리 등록. 자동 배치하지 않으며 등록 후 클릭/DnD로 배치한다. 업로드 최초 크기는 가로 50mm, 이미지 종횡비 유지. px와 로컬 mm 비율을 유지하여 Resize 시 물리 크기도 변경한다.
- `editPartGeometry(part, cropLocalMm, widthMm, heightMm)`는 Resize 시 단자 좌표에 x/y 비율을 적용, Crop 시 원점 이동 후 비율 적용. 숨긴 단자를 포함해 Crop 영역 바깥에 단자가 있으면 적용 거부한다. 단자 ID는 보존한다.
- Crop/Resize UI는 **로컬 원점·회전0·배율1인 단일 전체 이미지 부품**을 대상으로 한다. 단자가 있는 이미지 부품은 지원한다. 여러 내부 도형이 추가되었거나 이미지 자체가 별도 변환된 복합 부품은 명시적으로 거부하고 기존 자료를 보존한다. 복합 부품 일반 속성/배율 편집은 가능하다. 임의 복합 geometry의 비균등 변형은 추가 설계 범위다.
- 원본과 적용한 편집 결과는 별도 Asset ID로 유지하고 등록/변경 저장 시 하나의 명령에 포함한다. 기존 자산은 삭제하지 않아 다른 인스턴스 및 Undo 참조가 보존된다. 현재 Asset 스키마에는 파생 관계 필드가 없으므로 원본 복원 전용 UI는 제공하지 않는다. 사용하지 않는 보존 자산의 GC는 FE-05에서 결정한다.
- 미등록 초안 취소·편집 중 취소는 문서/라이브러리/자산 불변. 새 읽기 및 다른 확정 문서 편집은 이전 AbortController를 취소하며 프로젝트 종료 시 unmount cleanup으로 이전 결과를 차단한다. 읽기 취소 버튼/Esc, 이미지 모달 취소/Esc 지원. native modal이 처리 중 다른 프로젝트 조작을 차단한다.

## 검증 결과

- `npm test`: 8파일 **53개**. 기존 39개 포함. 그룹 ID·공동 변환, 전체 ID/endpoint 재매핑, 다중 인스턴스, 내부/외부 Wire 복사, 연결 삭제 원자성, 단자 월드 변환, 자유/45° 각도, no-op/단일 이력/Undo/Redo, 이미지 geometry·단자 유실 거부, fixture 파일 왕복, MIME/용량/Abort/잘못된 크기.
- `npm run typecheck`, `npm run lint`, `npm run build`: 최종 결과는 아래 검증 마감 기록 참조.
- `PLAYWRIGHT_PORT=3103 npm run test:e2e -- --reporter=line`: **21개 통과** (기존 13개 + FE-03 8개). 객체·그룹·복사/잘라내기/붙여넣기·텍스트 입력 보호, 라이브러리 등록·정의 격리·DnD, Wire 단자 고정, 자유/45° 회전·Esc, Crop/Resize 실제 픽셀·단자 거부, 이미지 Paste·취소·디코딩 실패·프로젝트 종료 후 지연 결과 차단, 다중 토글·일반 클릭·공동 이동, 이미지 정의/인스턴스 편집·독립 Image·Undo.
- 시각 증거: `test-results/fe03-objects.png`, `test-results/fe03-image-editor.png` (git 제외). 기존 Workspace 화면 캡처도 회귀 실행에서 생성한다.
- 초기 검증 실패: 샘플 목록으로 변경된 공용 탭 문구 기대값, 중복 ‘다중 선택/그룹 선택’ 테스트 선택자를 수정. 타입 narrowing·React hook 선언 순서도 수정 후 재검증했다. 실패 실행을 통과 증거로 포함하지 않는다.

미실행: Firefox/WebKit/모바일, 대규모 100부품·300배선 성능, 외부 AI/공용 서비스, IndexedDB 저장·자동복구·출력. 이미지 메모리 사용량은 원본/결과 보존에 따라 증가한다. 후속 단계에서 자산 저장·GC와 이력 메모리 정책을 정해야 한다.

## Fixture·FE-04 시작 조건

`public/objects-images-fixture.wireproj`를 프로젝트 열기로 불러올 수 있다. 실제 PNG data URL, 4종 독립 객체, 이미지+텍스트 복합 부품, 각기 다른 회전/배율, 연결 가능·연결 불가(NC)·숨긴 단자, 그룹, 기존 Junction/Wire 데이터가 포함된다. Wire/Junction 데이터는 보존하지만 FE-03 Canvas에서는 배선을 렌더링하지 않는다.

FE-04는 실제 Terminal ID/월드 위치/후보 검색과 기존 명령/무결성 검사 위에서 시작 가능하다. 배경 제거 대기는 배선 작업을 차단하지 않는다. 시작 시 배선 생성 클릭 순서·경로/분기/교차 정책을 확정하고, 이동·회전·단자 수정 후 경로 보정, Junction 포함 클립보드 정책을 이어서 구현한다. 연결된 부품 삭제 거부, visible/connectable 독립 의미, Endpoint ID 참조 및 자산/정의 격리를 유지한다.

## 검증 마감·병합

최종 코드 기준 단위 53개, Chromium E2E 21개 전체 통과. 타입 검사·Lint·프로덕션 빌드·`git diff --check` 통과. Chromium 1280×720 화면에서 객체 회전/속성 및 이미지 편집 모달을 직접 확인했다. `03-OBJECTS-IMAGES`에 커밋하고 변경 없는 `/app` main worktree로 로컬 fast-forward 병합하는 절차를 따른다. 원격 push와 FE-04 구현은 이번 범위에 포함하지 않는다.
