# ezwire backend / DB 기반

FastAPI의 `/api/health`와 PostgreSQL 프로젝트 저장 계층을 제공한다. 인증·프로젝트 HTTP API는 아직 연결하지 않았다. 저장 방식·권한·미구현 범위는 [DB 설계](../docs/workflow/backend/01-DATABASE.md)를 따른다.

## 설치와 실행

Python 3.13+, uv, PostgreSQL을 사용한다. 통합 테스트는 PostgreSQL 17에서 수행했고, 사용자 서버의 PostgreSQL 18.6에는 초기 마이그레이션 적용과 스키마 일치 검사를 완료했다. 이 디렉터리에서 실행한다.

```bash
uv sync --locked
uv run backend
```

- API: `http://127.0.0.1:8000/api/health`
- OpenAPI UI: `http://127.0.0.1:8000/docs`

기존 `uv run uvicorn main:app --reload` 실행 방식도 지원한다.

health 경로는 DB 없이도 실행된다. DB 연결은 `backend.db.connection.make_engine()` 호출 시 생성하며, import나 앱 시작 시 마이그레이션을 실행하지 않는다.

## 앱 구조와 테스트

- 실행 코드는 `backend/src/backend/` 패키지에 두고, `create_app()`에서 FastAPI 앱과 기능별 `APIRouter`를 조립한다.
- 현재 HTTP 경로는 `GET /api/health`이며, 응답 모델을 OpenAPI 문서로 제공한다.
- `pytest`와 FastAPI `TestClient`로 헬스 체크와 OpenAPI 계약을 검증하고, DB 통합 테스트와 함께 CI에서 실행한다.
- PostgreSQL 저장소는 구현되어 있으며, 인증·프로젝트 HTTP API·파일 어댑터 연결은 관련 계약 확정 후 진행한다.

## main 병합·배포 후 DB 연결 설정

DB 기반 코드는 main에 포함되어 있다. 아래 절차는 해당 코드가 web 서버에 반영된 뒤 web 서버에서 실행한다. 작업 공간의 파일이나 비밀 설정이 web 서버로 자동 복사된다고 가정하지 않는다.

현재 작업 공간에서 대상 DB에 초기 마이그레이션 `0001`을 적용했다. `projects`, `project_members`, `alembic_version` 생성과 소유자 `ezwire`, 모델과 DB 스키마 일치를 확인했다. 적용 직후 프로젝트·멤버 행은 0개다. web 서버의 코드 배포·환경설정 반영 여부는 별도로 확인해야 한다. 배포 시 아래 `upgrade head`를 다시 실행해도 이미 적용된 `0001`은 재실행하지 않는다. `.env`는 Git에서 제외되므로 main 병합으로 전달되지 않으며 web 서버에 별도로 설정한다.

사용자가 준비한 DB 서버는 `192.168.0.4`, DB 이름과 계정은 모두 `ezwire`다. web 서버에서 해당 계정으로 접속한 결과를 확인했다. 계정과 DB를 다시 만들 필요가 없다.

1. web 서버에서 배포된 프로젝트의 `backend` 폴더로 이동한다. `ls -a`를 입력했을 때 `alembic.ini`, `.env.example`, `pyproject.toml`이 보여야 한다. 정확한 배포 경로는 서버의 프로젝트 위치를 사용한다.
2. 아래 명령으로 설정 예시를 `.env`라는 실제 설정 파일로 복사한다. 이미 `.env`가 있으면 기존 파일을 편집하며, `cp -n`은 덮어쓰지 않는다.

```bash
cp -n .env.example .env
chmod 600 .env
nano .env
```

3. 파일에서 아래 항목을 확인하고 비밀번호만 실제 DB 비밀번호로 바꾼다. 비밀번호 양쪽의 작은따옴표는 유지한다.

```dotenv
DB_HOST=192.168.0.4
DB_PORT=5432
DB_NAME=ezwire
DB_USER=ezwire
DB_PASSWORD='여기에_DB_비밀번호_입력'
```

4. nano에서 `Ctrl+O`, `Enter`로 저장하고 `Ctrl+X`로 종료한다. `.env` 파일이나 비밀번호를 대화·Git에 올리지 않는다. `.env`는 이미 Git 제외 대상으로 설정되어 있다.
5. 같은 `backend` 폴더에서 아래 명령을 한 줄씩 실행한다. `uv: command not found`가 나오면 uv 설치부터 필요하다. 중간에 오류가 나오면 다음 명령으로 넘어가지 않고 비밀번호를 제외한 오류 내용을 확인한다.

```bash
uv sync --locked
uv run alembic upgrade head
uv run alembic current
uv run alembic check
```

`upgrade head`가 프로젝트·멤버 테이블을 생성한다. `current`에서 `0001 (head)`, `check`에서 `No new upgrade operations detected.`가 나오면 초기 스키마가 적용된 것이다. 이미 같은 이름의 테이블이 있다면 먼저 기존 구조와 Alembic 이력을 확인한다.

`backend/.env`는 실행 위치에 관계없이 백엔드 소스 위치를 기준으로 자동으로 읽는다. `alembic.ini`를 수정하거나 `export`, `source .env`를 실행할 필요가 없다. 앱을 실행하는 OS 사용자가 `.env`를 읽을 수 있어야 한다. 실행 중인 앱의 연결 설정을 바꿨다면 앱을 재시작한다.

위 다섯 항목은 앱과 마이그레이션에 같은 계정을 사용한다. `DB_PASSWORD`에는 `@`, `:`, `%`, `$`, `#` 등을 그대로 입력하며 URL 인코딩이 필요 없다. 작은따옴표 자체는 `\'`, 역슬래시 자체는 `\\`로 작성한다. `${...}` 변수 치환은 하지 않는다. 형식은 [python-dotenv 설정 파일](https://bbc2.github.io/python-dotenv/reference/)을 사용한다.

DB 적용 후에도 웹앱의 서버 저장은 인증·프로젝트 API 연결 구현이 필요하다. `alembic downgrade base`는 프로젝트 테이블과 데이터를 삭제하므로 폐기 가능한 개발 DB에서만 사용한다.

## 개발·배포 시스템의 연결 설정

서버 환경변수는 같은 이름의 `.env` 값보다 우선한다. `DATABASE_URL`과 `MIGRATION_DATABASE_URL`을 사용하는 기존 구성도 지원하며, 각각 해당 용도의 `DB_*` 항목보다 우선한다. 이 URL 형식의 비밀번호에는 URL 인코딩이 필요하다. 예전 `export DATABASE_URL=...` 설정이 남아 있으면 `.env`의 개별 항목보다 우선하므로 사용하지 않는 URL 변수는 제거한다.

사용자 선택에 따라 현재는 DB 소유자 `ezwire` 계정을 앱·마이그레이션에 함께 사용하므로 앱에도 DDL 권한이 있다. 계정을 분리할 때는 각각의 URL을 명시하고 앱 계정에 CONNECT·스키마 USAGE와 아래 테이블 권한만 부여한다.

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON projects, project_members TO ezwire_app;
```

분리 구성의 앱 계정에는 DDL·`alembic_version` 변경 권한을 주지 않는다. 새 테이블이 추가되면 필요한 권한을 명시적으로 추가한다. 공통 `DB_*` 설정이 없는 URL 전용 구성에서 `MIGRATION_DATABASE_URL`이 누락되면 `DATABASE_URL`로 대체하지 않고 실패한다. 마이그레이션·앱 시작은 별도 작업이며 자동 DDL은 실행하지 않는다.

## 저장소 사용

```python
from sqlalchemy.orm import Session
from backend.db.connection import make_engine
from backend.db.projects import ProjectRepository

engine = make_engine()  # Reads backend/.env or process environment
with Session(engine) as session, session.begin():
    repo = ProjectRepository(session, actor_id=authenticated_subject)
    saved = repo.create(validated_project_file)
    # saved.document: full .wireproj, saved.revision: server concurrency token

with Session(engine) as session, session.begin():
    repo = ProjectRepository(session, actor_id=authenticated_subject)
    saved = repo.save(saved.id, edited_project_file, expected_revision=saved.revision)
```

`authenticated_subject`는 서버 인증으로 검증된 값이어야 한다. 저장소는 envelope만 검사하므로 서비스에서 도메인 참조를 먼저 검증한다. `ownerId`·로컬 revision은 서버 권한·서버 revision으로 사용하지 않는다. `ProjectNotFound`는 미존재/접근 불가를 함께 나타내며, `ProjectPermissionDenied`는 읽기 권한은 있으나 요청 작업이 허용되지 않은 경우다. `RevisionConflict` 발생 시 최신 문서를 조회해 사용자에게 충돌을 해결하도록 해야 하며 자동 덮어쓰지 않는다.

저장소는 flush만 수행한다. 예외는 `session.begin()` 밖으로 전파해 트랜잭션 전체를 rollback하고, commit 성공 이후에 응답한다. DB 제약 위반인 `IntegrityError`를 받은 세션은 rollback 없이 재사용하지 않는다. 동기 저장 계층은 FastAPI 동기 handler/service 또는 thread pool에서 호출한다.

## 검증

DB 테스트는 `tests/fixtures/project-v1.wireproj`에 고정한 BE-01 v1 계약을 사용한다. 이 fixture는 `a16c6b8`의 샘플 원본이다. 현재 프런트엔드의 `public/sample-project.wireproj`는 v2이며 백엔드 저장소에서 아직 지원하지 않는다. v2 연동 시 저장소 검증·DB 제약·마이그레이션과 호환성 테스트를 함께 추가해야 한다.

테스트용 DB도 UTF-8로 생성하고 `TEST_DATABASE_URL`의 계정에 해당 DB의 스키마 생성 권한을 부여한다. 개발/운영 DB 대신 별도 DB를 사용한다. 각 테스트는 Alembic으로 고유한 스키마를 생성하고 자신이 만든 스키마만 제거한다.

```bash
uv run ruff check src tests migrations
uv run ruff format --check src/backend/db tests migrations
uv run pytest -q
```

`TEST_DATABASE_URL`이 없으면 DB 통합 테스트는 skip된다. CI는 PostgreSQL 서비스를 제공해 통합 테스트를 실행한다. 동시성 검증은 실제 별도 연결을 사용하며 SQLite로 대체하지 않는다.
