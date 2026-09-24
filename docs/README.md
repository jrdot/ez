# 프로젝트 문서 안내

프로젝트 문서는 핵심 규격(`core`)과 규격을 구현하는 업무 문서(`workflow`)로 구분한다.

## 폴더 구조

```text
docs/
  README.md                         프로젝트 문서 안내
  core/
    USER_REQUIREMENTS_SPEC.md        사용자 요구사항 규격서 (URS)
    DESIGN_SPEC.md                   설계 규격서 (DS)
  workflow/
    common.md                        모든 영역에 적용되는 공통 업무 원칙
    frontend/
      common.md                      프런트엔드 공통 업무·실행 순서
      01-FOUNDATION.md
      01-FOUNDATION-HANDOFF.md
      02-WORKSPACE.md
      02-WORKSPACE-HANDOFF.md
      03-OBJECTS-IMAGES.md
      03-OBJECTS-IMAGES-HANDOFF.md
      04-WIRING.md
      05-INTEGRATIONS.md
      06-VALIDATION.md
      07-TRACEABILITY.md
    backend/
      common.md                      백엔드 공통 업무·실행 순서
      01-DATABASE.md                 DB 저장 계약·구현·검증
```

## 읽는 순서

1. [사용자 요구사항 규격서 (URS)](core/USER_REQUIREMENTS_SPEC.md)와 [설계 규격서 (DS)](core/DESIGN_SPEC.md): 사용자 동작·필수 기능과 UI/UX·객체·배선 설계의 기준.
2. [전역 공통 업무](workflow/common.md): 제품 배경, 업무 분장, 개발 원칙과 공통 인계 기준.
3. 담당 영역의 [Frontend 공통](workflow/frontend/common.md) 또는 [Backend 공통](workflow/backend/common.md): 영역별 책임과 작업 순서.
4. 해당 영역의 번호가 붙은 작업 문서와 선행 작업의 인계 문서: 구체적인 범위·계약·완료 기준·검증 결과. 프런트엔드 규격별 대응은 [요구사항 추적표](workflow/frontend/07-TRACEABILITY.md)에서 확인한다.

## 작성과 관리 규칙

- `core/`는 프로젝트의 기본·핵심 규격을 관리한다. 워크플로우는 이 규격을 기준으로 작업을 나눈다.
- `workflow/common.md`는 전역 공통 업무, `workflow/<영역>/common.md`는 해당 영역 전체의 업무 범위를 다룬다.
- 작업 문서는 `00-work.md`와 같은 번호·이름 형식인 `workflow/<영역>/NN-TOPIC.md`로 작성한다. 기존 프런트엔드 작업 번호와 파일명은 유지한다.
- 작업 문서에는 대상 REQ/DES ID, 선행 조건, 작업 범위, 완료 기준과 검증 방법을 기록한다. 규격에 없는 제안과 미정 사항은 확정 요구와 구분한다.
- 인계 문서는 같은 번호의 `NN-TOPIC-HANDOFF.md`로 연결하고 실제 변경·검증·제한·다음 작업을 기록한다.
- 기존 제품 계획과 과거 구현 기록은 현재 core 규격의 확정 범위나 최신 구현 상태로 간주하지 않는다.
- 도메인·로컬 저장·API·인프라의 독립 작업 문서는 아직 작성되지 않았다. 해당 업무 착수 시 영역별 공통 문서와 작업 문서를 추가하고 이 안내에 연결한다.

## 관련 문서

- [백엔드 DB 작업](workflow/backend/01-DATABASE.md): 저장 계약, 권한, 마이그레이션과 검증 기록.
- [백엔드 실행 안내](../backend/README.md): 설치, 환경설정, 실행과 검증 명령.
- [참고 프로젝트 분석](../ref/ARCHITECTURE_ANALYSIS.md): 기존 EasyCable의 기능·구조 분석.

현재 도메인 타입은 `src/domain/`, CI 설정은 `.github/workflows/ci.yml`을 확인한다. 문서에는 현재 구현과 향후 계획을 구분하며, 기능 구현 시 실제 경로·계약·검증 방법도 함께 갱신한다.
