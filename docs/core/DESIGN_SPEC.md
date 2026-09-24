```markdown
# 설계 규격서

- 문서명: 설계 규격서
- 대상: 부품 배치 및 배선 연결 웹앱
- 기준 버전: Draft v0.1
- 기준 참고 서비스: easycable.co.kr/app
- 목적: 사용자 요구사항을 실제 UI/UX와 내부 개념으로 구체화한다.

---

## 1. 기본 레이아웃

전체 화면은 다음 구조를 기본으로 한다.

```text
┌──────────────────────────────────────────────────────────────┐
│ Logo │ Mode Selector │ Mode Toolbox                         │
├──────────────┬──────────────────────────────┬────────────────┤
│              │ [EZ-001] [EZ-002] [EZ-003]  │                │
│ 좌측 Sidebar │──────────────────────────────│ 우측 Sidebar   │
│              │                              │                │
│ Library      │            Canvas            │ Properties     │
│ Public Parts │                              │                │
│              │                              │                │
│     ◀        │                              │        ▶       │
├──────────────┴──────────────────────────────┴────────────────┤
│ 선택 객체 정보 1 Line │ Zoom │ BOM │ Table │ Grid │ Snap... │
│                              Code │ PDF │ PNG │ Help │ System │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. 상단 Header

### DES-HEADER-001
로고는 브랜드 식별만 가능한 작은 영역으로 배치한다.

### DES-MODE-001
Mode Selector는 다음 3개 모드를 명확히 구분한다.

- Mouse
- Wire
- Image

현재 선택된 모드는 시각적으로 명확하게 강조한다.

### DES-TOOLBOX-001
Mode Toolbox는 상단 고정형으로 배치한다.

도구상자의 위치는 변경되지 않으며, 내부 도구만 현재 Mode에 따라 변경될 수 있다.

예:

```text
Mouse Mode
[선택] [이동] [복사] [회전] [삭제]

Wire Mode
[90°] [45°] [Free] [색상] [두께]

Image Mode
[자르기] [배경제거] [회전] [크기]
```

실제 도구 구성은 후속 설계에서 확정한다.

---

## 3. Sidebar

### DES-SIDEBAR-L-001
좌측 Sidebar는 탭 방식으로 구성한다.

```text
[라이브러리] [공용부품]
```

### DES-SIDEBAR-L-002
좌측 Sidebar는 사용자가 접거나 펼칠 수 있다.

Sidebar를 접으면 중앙 Canvas가 해당 영역만큼 확장된다.

### DES-SIDEBAR-R-001
우측 Sidebar는 선택 객체의 상세 속성을 표시한다.

### DES-SIDEBAR-R-002
우측 Sidebar도 접기/펼치기를 지원하며, 접을 경우 Canvas 영역이 확장된다.

---

## 4. Canvas 문서 구조

### DES-CANVAS-001
Canvas는 도면 규격을 가진 유한 작업영역으로 설계한다.

지원 규격:

- A4 Landscape
- A4 Portrait
- A3 Landscape
- A3 Portrait

기본값:

- A4 Landscape

### DES-CANVAS-002
Canvas 배경 기본값은 White로 한다.

사용자 커스텀 배경색은 System 설정에서 변경한다.

### DES-CANVAS-003
Grid는 Canvas 좌표에 종속되며, 화면(Viewport)이 아니라 Canvas와 함께 이동한다.

---

## 5. 작업 페이지 탭

### DES-PAGE-001
한 프로젝트 내 작업 페이지는 최대 3개까지 표시한다.

### DES-PAGE-002
탭 이름은 다음 형식을 기본값으로 한다.

```text
EZ-001
EZ-002
EZ-003
```

접두어:

```text
EZ
```

번호:

```text
3자리 Zero Padding
```

---

## 6. 객체 구조

### DES-OBJECT-001
Canvas의 최소 객체 타입은 다음과 같다.

```text
Object
├─ Image
├─ Line
├─ Point
└─ Text
```

### DES-OBJECT-002
부품(Component)은 여러 Object의 조합으로 표현할 수 있다.

예:

```text
Component
├─ Image
├─ Terminal(Point)
├─ Terminal(Point)
├─ Text
└─ Additional Objects
```

### DES-OBJECT-ID-001
모든 객체는 고유 Object ID를 가진다.

그룹 생성 시:

```text
Child Object IDs → 유지
Group Object ID → 신규 발급
```

---

## 7. 단자(Terminal)

### DES-TERMINAL-001
부품에서 배선이 연결되는 Point 타입 객체는 **단자(Terminal)** 라고 명명한다.

### DES-TERMINAL-002
단자는 최소 다음 개념 정보를 가질 수 있도록 설계한다.

- Object ID
- X/Y 위치
- 이름
- 표시 여부
- 연결 가능 여부
- 연결된 Wire 목록

상세 데이터 필드는 후속 데이터 설계에서 확정한다.

### DES-TERMINAL-003
배선 편집 모드에서 Terminal은 고정점으로 취급하며 직접 Drag 이동을 허용하지 않는다.

---

## 8. Snap

### DES-SNAP-001
Snap Mode는 3단계 상태로 구성한다.

```text
Object Snap
Grid Snap
Snap Off
```

기본값:

```text
Object Snap
```

### DES-SNAP-002
Snap 대상에 마우스가 접근하면 사용자가 대상 위치를 사전에 인지할 수 있도록 시각적 Preview를 제공한다.

---

## 9. 선택 및 회전

### DES-SELECT-001

```text
Click
→ Single Select

Ctrl + Click
→ Multi Select Toggle

Shift + Click
→ Multi Select Toggle
```

### DES-ROTATE-001

```text
Mouse Drag
→ Free Rotate

Shift + Drag
→ 45° Angle Snap
```

---

## 10. Canvas Navigation

### DES-NAV-001

```text
Wheel
→ Vertical Scroll

Shift + Wheel
→ Horizontal Scroll

Ctrl + Wheel
Alt + Wheel
→ Zoom In / Out
```

### DES-PAN-001

```text
Middle Mouse Button + Drag
→ Pan

Space + Drag
→ Pan
```

---

## 11. 배선 모델

### DES-WIRE-001
Wire는 최소 다음 구조를 갖는 개념 모델로 설계한다.

```text
Wire
├─ Start Endpoint
├─ End Endpoint
├─ Bend Point[]
├─ Junction Point[]
├─ Wire Type
├─ Color
└─ Thickness
```

실제 데이터 모델은 구현 단계에서 세분화한다.

### DES-WIRE-ENDPOINT-001
Wire의 Endpoint는 반드시 다음 중 하나에 연결한다.

- Terminal
- Junction Point

---

## 12. 배선 타입

### DES-WIRE-TYPE-001

#### 90° Wire

수평/수직 선분으로 구성한다.

```text
●──────┐
       │
       └────●
```

#### 45° Wire

45도 단위 대각 선분을 포함할 수 있다.

```text
●──────╲
        ╲────●
```

#### Free Wire

시작점과 끝점을 하나의 직선으로 연결한다.

```text
●──────────────●
```

Free Wire는 중간 Bend Point를 사용하지 않는다.

---

## 13. Bend Point

### DES-BEND-001
Bend Point는 배선의 경로를 변경하기 위한 편집점이다.

### DES-BEND-002
사용자가 배선의 선분을 Drag하여 이동하면 필요한 Bend Point를 자동 생성한다.

예:

```text
Before

●────────────────────●

After Segment Drag

●──────○
       │
       ○──────────────●
```

`○` = Bend Point

### DES-BEND-003
Bend Point를 삭제하면 인접한 선분을 병합하고 배선 경로를 가능한 범위에서 자동 단순화한다.

### DES-BEND-MOVE-001
90° Wire의 Bend Point는 다음 방향으로만 이동한다.

```text
↑
← ○ →
↓
```

### DES-BEND-MOVE-002
45° Wire의 Bend Point는 8방향 이동을 허용한다.

```text
↖ ↑ ↗
← ○ →
↙ ↓ ↘
```

대각 이동 기능은 구현 난이도에 따라 후속 버전으로 연기 가능하다.

---

## 14. Junction Point

### DES-JUNCTION-001
Junction Point는 배선끼리 실제 전기적으로 연결되는 위치를 의미한다.

표시 예:

```text
        │
────────●────────
        │
```

### DES-JUNCTION-002
다음 상황에서 기존 Wire 중간에 Junction 후보를 생성한다.

1. 새 Wire의 시작점을 기존 Wire 중간으로 지정
2. 새 Wire의 끝점을 기존 Wire 중간으로 지정

### DES-JUNCTION-003
마우스가 Junction 생성 가능 위치에 접근하면 Snap을 발생시키고, 확정 전에는 Shadow Junction을 표시한다.

```text
기존 Wire
──────────────

후보
──────◌───────

확정
──────●───────
      │
```

- `◌`: Shadow Junction
- `●`: Confirmed Junction

---

## 15. Crossover

### DES-CROSS-001
서로 다른 Wire가 교차하지만 연결되지 않는 경우 Crossover로 표현한다.

### DES-CROSS-002
분기점이 없는 모든 교차점에는 반원 형태의 Jump 표시를 사용한다.

개념 예:

```text
────────╭─╮────────
        │
        │
```

### DES-CROSS-003
실제 연결된 교차는 Junction Point로 표시하여 Crossover와 명확히 구분한다.

```text
────────●────────
        │
        │
```

---

## 16. Wire Shadow Preview

### DES-WIRE-SHADOW-001
Wire Mode는 기본적으로 Shadow Preview를 활성화한다.

사용자가 클릭하기 전 다음 결과를 미리 표시한다.

- 연결 대상 Terminal
- Junction 후보
- Snap 위치
- 예상 Wire 경로
- 90°/45° 꺾임 결과
- 교차 여부
- 실제 연결 여부

### DES-WIRE-SHADOW-002
Shadow Preview는 실제 확정 객체와 시각적으로 구별되어야 한다.

색상, 투명도, 외곽선 등 구체적 표현 방식은 UI Style 설계 단계에서 확정한다.

### DES-WIRE-SHADOW-003
Shadow Preview의 핵심 목적은 다음과 같다.

- 오접속 방지
- 잘못된 분기 생성 방지
- 예상하지 못한 Snap 방지
- 배선 생성 결과 사전 확인
- 휴먼에러 최소화

---

## 17. Image Editor

### DES-IMAGE-001
Image Mode에서는 업로드 이미지의 기본 편집 기능을 제공한다.

기본 도구:

- Crop
- Remove Background
- Resize

추가 기능은 후속 설계에서 결정한다.

### DES-IMAGE-002
Clipboard에서 이미지를 Paste할 경우 부품 추가 프로세스로 자연스럽게 연결한다.

---

## 18. 하단 영역

### DES-BOTTOM-001
하단 영역은 좌측의 선택 객체 정보와 우측의 작업/시스템 기능으로 구성하는 방향을 기본으로 한다.

### DES-BOTTOM-002
선택 객체 정보는 반드시 **1 Line**으로 제한한다.

예:

```text
선택: ESP32-S3 | X:420 Y:251 | 442×191 | Rotate:270°
```

### DES-BOTTOM-003
작업 보조 기능:

```text
Zoom
BOM View
Table View
Grid
Snap
Full Screen
```

### DES-BOTTOM-004
시스템 기능:

```text
Code Download
PDF Download
PNG Download
Help
System
```

---

## 19. 사용자 설정

### DES-SYSTEM-001
System 영역은 사용자 커스텀 설정 진입점으로 사용한다.

현재 확정된 설정 항목:

- Canvas 배경색

추후 추가 후보:

- Grid 표시
- Grid 간격
- 기본 Snap Mode
- 기본 Wire 색상
- 기본 Wire 두께
- UI Theme
- 단축키

---

## 20. 후속 설계 필요 항목

다음 항목은 현재 미확정이며 별도 설계가 필요하다.

1. Library의 부품 카드 UI
2. 공용부품 검색/분류 방식
3. 부품 추가 Wizard
4. 단자 생성/수정 UI
5. Terminal의 표시 모양
6. Object ID 및 Group ID 실제 포맷
7. Wire 생성의 세부 클릭 순서
8. 90°/45° Wire 자동 경로 생성 규칙
9. Wire가 부품 이미지 위를 지나갈 때의 처리
10. Crossover 반원의 크기 및 방향
11. Junction Point 표시 크기/색상
12. Shadow Preview의 색상/투명도
13. BOM View
14. Table View
15. Code Download 규격
16. PDF/PNG 출력 범위
17. 프로젝트 저장/불러오기
18. Undo/Redo History 범위
19. Auto Save
20. 사용자 계정 및 공용부품 관리 정책

```

