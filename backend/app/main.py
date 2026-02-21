from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, engine
from .routers import auth, songs, files


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables and upload directories on startup
    Base.metadata.create_all(bind=engine)
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.DEMO_STEMS_DIR).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="Prism API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded audio files as static assets (supports Range requests via browser)
app.mount(
    "/uploads",
    StaticFiles(directory=settings.UPLOAD_DIR),
    name="uploads",
)

app.include_router(auth.router)
app.include_router(songs.router)
app.include_router(files.router)


@app.get("/health")
def health():
    return {"status": "ok"}
