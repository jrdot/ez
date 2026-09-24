from fastapi import FastAPI

from backend.api.health import router as health_router


def create_app() -> FastAPI:
    application = FastAPI(
        title="ezwire API",
        description="Server API for ezwire projects and assets.",
        version="0.1.0",
    )
    application.include_router(health_router)
    return application


app = create_app()
