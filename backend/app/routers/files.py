"""
Serves audio files stored on disk with path-traversal protection.
Audio files are also accessible via the /uploads static mount in main.py,
but this router gives an explicit API endpoint with security checks.
"""
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..config import settings

router = APIRouter(prefix="/api/files", tags=["files"])


@router.get("/{file_path:path}")
def serve_file(file_path: str):
    base = Path(settings.UPLOAD_DIR).resolve()
    target = (base / file_path).resolve()

    # Prevent path traversal
    if not str(target).startswith(str(base)):
        raise HTTPException(status_code=403, detail="Access denied")

    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        str(target),
        headers={"Accept-Ranges": "bytes"},
    )
