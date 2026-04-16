from fastapi import FastAPI

from backend.app.api.router import api_router
from backend.app.core.config import get_settings
from backend.app.core.lifespan import lifespan


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)
    app.include_router(api_router, prefix="/api")

    @app.get("/", tags=["health"])
    async def root() -> dict[str, str]:
        return {"message": f"{settings.app_name} is running"}

    return app


app = create_app()