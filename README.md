# ezwire

전자 부품을 캔버스에 배치하고 실제 연결 관계를 배선으로 표현하며, 프로젝트 문서와 BOM을 함께 관리하는 웹 기반 설계 도구입니다.

현재 Phase 0 기반 작업으로 다음을 제공합니다.

- Next.js 16, React 19, TypeScript 기반 앱
- 버전이 명시된 프로젝트 도메인 모델과 `.wireproj` JSON 포맷
- 새 빈 프로젝트 생성, 프로젝트 파일 열기, 프로젝트 닫기
- SVG 편집기 캔버스와 기본 부품 추가·이동·스냅·삭제
- Vitest 단위 테스트와 Playwright 핵심 흐름 테스트
- FastAPI 앱 구조와 헬스 체크 테스트
- lint, typecheck, test, build, E2E GitHub Actions

## 프로젝트 구조

```text
src/                       프런트엔드 소스
  app/                     Next.js 라우트·레이아웃·전역 스타일
  components/              공통 UI
  domain/                  프로젝트 타입·규칙·파일 포맷·단위 테스트
  features/                프로젝트 시작 화면·편집기
public/                    정적 파일·샘플 프로젝트
e2e/                       Playwright 시나리오
backend/
  src/backend/             FastAPI 앱·API·DB 저장소
  migrations/              Alembic 마이그레이션
  tests/                   백엔드 단위·DB 통합 테스트
  .env.example             DB 설정 예시
docs/                      제품·계층 설계 문서
ref/                       기존 제품 참고 자료
.github/workflows/         CI
```

프런트엔드 명령과 설정 파일은 저장소 루트, 백엔드 명령과 설정 파일은 `backend/`를 기준으로 한다. 프런트엔드 단위 테스트는 대상 도메인 코드 옆에 둔다. `node_modules/`, `.next/`, `.venv/`, Python 캐시와 테스트 결과는 생성 파일이며 Git에서 제외한다.

설계 문서는 [문서 안내](docs/README.md)에서 확인한다.

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 파일 열기는 [`public/sample-project.wireproj`](public/sample-project.wireproj)를 사용할 수 있습니다.

같은 네트워크에서는 `http://192.168.0.123:3000`으로 접속할 수 있습니다. 개발 서버의 HMR(WebSocket) 연결을 위해 이 IP를 `next.config.ts`의 `allowedDevOrigins`에 등록했습니다. 접속 IP가 바뀌면 해당 항목을 수정하고 개발 서버를 재시작합니다. 값에는 프로토콜이나 포트를 포함하지 않습니다.

백엔드는 별도 터미널에서 실행합니다.

```bash
cd backend
uv sync
uv run backend
```

## 검증

```bash
npm run lint
npm run typecheck
npm test
npm run build
cd backend && uv run pytest
```

로컬 E2E를 처음 실행할 때는 Chromium을 설치해야 합니다.

```bash
npx playwright install chromium
npm run test:e2e
```

제품 범위와 개발 원칙은 [`docs/workflow/common.md`](docs/workflow/common.md)를 기준으로 합니다.

PostgreSQL 프로젝트 저장 기반(SQLAlchemy·Alembic)과 권한·동시 저장 통합 테스트도 제공합니다. 서버 인증·프로젝트 API 연결 전 단계이며, 설치와 DB 설정은 [`backend/README.md`](backend/README.md), 저장 계약은 [`docs/workflow/backend/01-DATABASE.md`](docs/workflow/backend/01-DATABASE.md)를 참조합니다.
