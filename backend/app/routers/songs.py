"""
Songs router — upload, list, poll status, delete.

Stem separation runs in a FastAPI BackgroundTask using a fresh DB session
so it doesn't block the request thread.
"""
import shutil
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import settings
from ..database import get_db, SessionLocal
from ..models import Song, Stem, User
from ..schemas import SongOut
from ..services.stem_separator import separate_stems

router = APIRouter(prefix="/api/songs", tags=["songs"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac"}


# ── Background worker ──────────────────────────────────────────────────────────

def _process_song(song_id: int, file_path: str) -> None:
    """Run demucs in the background, persist results to a fresh DB session."""
    db = SessionLocal()
    try:
        song = db.query(Song).filter(Song.id == song_id).first()
        if not song:
            return

        song.status = "processing"
        db.commit()

        stems_dir = Path(settings.UPLOAD_DIR) / "stems"
        stem_paths = separate_stems(file_path, str(stems_dir), song_id)

        for stem_type, path in stem_paths.items():
            db.add(Stem(song_id=song_id, stem_type=stem_type, file_path=str(path)))

        song.status = "complete"
        db.commit()

    except Exception as exc:
        db.rollback()
        try:
            song = db.query(Song).filter(Song.id == song_id).first()
            if song:
                song.status = "error"
                song.error_message = str(exc)[:500]
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/demos", response_model=List[SongOut])
def get_demo_songs(db: Session = Depends(get_db)):
    """Public — list all pre-stemmed demo songs."""
    return (
        db.query(Song)
        .filter(Song.is_demo == True, Song.status == "complete")
        .order_by(Song.title)
        .all()
    )


@router.get("/my", response_model=List[SongOut])
def get_my_songs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Song)
        .filter(Song.user_id == current_user.id)
        .order_by(Song.created_at.desc())
        .all()
    )


@router.post("/upload", response_model=SongOut, status_code=status.HTTP_202_ACCEPTED)
async def upload_song(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Enforce upload limit
    song_count = db.query(Song).filter(Song.user_id == current_user.id).count()
    if song_count >= settings.MAX_USER_SONGS:
        raise HTTPException(
            status_code=400,
            detail=f"Upload limit reached ({settings.MAX_USER_SONGS} songs per account).",
        )

    # Validate extension
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}")

    # Save original
    originals_dir = Path(settings.UPLOAD_DIR) / "originals"
    originals_dir.mkdir(parents=True, exist_ok=True)

    file_id = uuid.uuid4().hex
    dest_path = originals_dir / f"{file_id}{suffix}"

    with dest_path.open("wb") as fp:
        shutil.copyfileobj(file.file, fp)

    title = Path(file.filename or "Untitled").stem
    song = Song(
        title=title,
        original_path=str(dest_path),
        status="pending",
        user_id=current_user.id,
    )
    db.add(song)
    db.commit()
    db.refresh(song)

    background_tasks.add_task(_process_song, song.id, str(dest_path))
    return song


@router.get("/{song_id}", response_model=SongOut)
def get_song(
    song_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    if not song.is_demo and song.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return song


@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_song(
    song_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    song = db.query(Song).filter(
        Song.id == song_id,
        Song.user_id == current_user.id,
    ).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found or access denied")

    if song.original_path:
        Path(song.original_path).unlink(missing_ok=True)
    for stem in song.stems:
        Path(stem.file_path).unlink(missing_ok=True)

    db.delete(song)
    db.commit()
