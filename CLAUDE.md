# CLAUDE.md

부품 배치·배선 웹앱. 작업 전에 `docs/00-brief/PROJECT_DEFINITION.md`를 먼저 읽는다.

## 폴더

```
docs/00-brief/     프로젝트 정의서
docs/01-spec/      URS.md, FDS.md, 용어집, 시나리오
docs/02-plan/      work.yaml — 업무 목록
docs/03-design/    업무별 설계 문서
       frontend/   F01-<slug>.md …
       backend/    B01-<slug>.md …
       database/   D01-<slug>.md …
docs/adr/          ADR-001-<slug>.md …
docs/guide/        공통 개발 가이드(스택 확정 후)
docs/interviews/   draft-<YYYYMMDD>-<주제>.md — 인터뷰 종료 후 draft- 제거
```

코드 폴더 구조는 기술 스택 ADR 확정 후 정한다.

## ID

| ID | 뜻 | 정의 위치 |
| --- | --- | --- |
| F01, F02 … | frontend 업무 | work.yaml |
| B01, B02 … | backend 업무(서버·인증·배포·백업) | work.yaml |
| D01, D02 … | database 업무(데이터 모델·파일 형식·저장) | work.yaml |
| REQ-…, DES-… | 요구사항·설계 항목 | URS·FDS |
| ADR-001 … | 기술 결정 | adr/ |
| M1, M2a … | 마일스톤 | 정의서 8절 |

- 업무 ID 하나에 설계 문서 하나: `docs/03-design/<영역>/<ID>-<slug>.md`
- ID는 바꾸거나 재사용하지 않는다.
- 커밋 메시지는 업무 ID로 시작한다. 예: `F05: 90° 배선 경로 생성`

## 결정 권한

정의서 3절을 따른다. 요약: 내부 구현·테스트 추가·동작을 바꾸지 않는 리팩터링은 단독 결정. 스택·라이브러리 추가, 파일·저장 형식 변경, 요구사항·범위 변경, 배포·데이터 삭제, 기존 테스트 변경, 정의서·URS·FDS 변경은 본인 승인.

## 참고 소스

easycable 백업 소스는 구조와 동작만 참고한다. 코드와 이미지는 복사하지 않는다.
