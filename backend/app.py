"""FastAPI application entrypoint for Schema Evolution Guardian."""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.api import router as api_router
from services.storage import StorageService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

BASE_DIR = Path(__file__).resolve().parent
STORAGE = StorageService(base_dir=BASE_DIR)
STORAGE.initialize()
DEMO_DATABASE = STORAGE.bootstrap_demo_database()

app = FastAPI(
    title="Schema Evolution Guardian",
    version="1.0.0",
    description="AI-powered schema drift detection and impact analysis platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.storage = STORAGE
app.include_router(api_router)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    configured_db = STORAGE.get_setting("target_db_path")
    database_path = configured_db or str(DEMO_DATABASE)
    return {
        "status": "ok",
        "service": "Schema Evolution Guardian",
        "database": database_path,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
