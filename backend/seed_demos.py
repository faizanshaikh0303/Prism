"""
Demo song seeder — scans the /songs folder and seeds the database.

Instead of downloading tracks, it reads every audio file from a local
songs/ directory (default: <repo_root>/songs/), parses Artist / Title
from the filename, and runs Demucs stem separation.

Usage:
    cd backend
    python seed_demos.py              # scan ../songs/
    python seed_demos.py --reset      # clear existing demo entries first
    python seed_demos.py --songs-dir /path/to/folder
    python seed_demos.py --reset --songs-dir /path/to/folder
"""
import re
import shutil
import sys
import argparse
from pathlib import Path

# Add project root so we can import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import Song, Stem
from app.services.stem_separator import separate_stems

AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac"}

# Default songs folder: one level above backend/
DEFAULT_SONGS_DIR = Path(__file__).parent.parent / "songs"


def parse_filename(stem: str) -> tuple[str, str]:
    """
    Parse 'Artist - Title (Optional Noise)' from a filename stem.

    Examples:
      'Bruno Mars - The Lazy Song (Official Music Video) - (128 Kbps)'
        → ('Bruno Mars', 'The Lazy Song')
      'Coldplay - Paradise (Official Video)'
        → ('Coldplay', 'Paradise')
      'Imagine Dragons - Bad Liar'
        → ('Imagine Dragons', 'Bad Liar')
    """
    s = stem

    # Strip trailing " - (anything)" e.g. " - (128 Kbps)"
    s = re.sub(r'\s*-\s*\([^)]*\)\s*$', '', s).strip()

    # Strip trailing parentheticals with known noise words
    s = re.sub(
        r'\s*\([^)]*(?:official|video|audio|hd|music|lyrics|mv|kbps|visualizer|remaster)[^)]*\)\s*$',
        '', s, flags=re.IGNORECASE,
    ).strip()
    # Also strip square-bracket variants
    s = re.sub(
        r'\s*\[[^\]]*(?:official|video|audio|hd|music|lyrics|mv)[^\]]*\]\s*$',
        '', s, flags=re.IGNORECASE,
    ).strip()

    if ' - ' in s:
        artist, title = s.split(' - ', 1)
        return artist.strip(), title.strip()

    return 'Unknown', s.strip()


def clear_demo_songs(db) -> None:
    """Delete all is_demo=True songs (and their stems via cascade)."""
    deleted = db.query(Song).filter(Song.is_demo == True).delete()
    db.commit()
    print(f"  Cleared {deleted} existing demo song(s) from database.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed demo songs from a local folder.")
    parser.add_argument(
        "--songs-dir",
        type=Path,
        default=DEFAULT_SONGS_DIR,
        help=f"Folder containing audio files (default: {DEFAULT_SONGS_DIR})",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear existing demo entries before seeding",
    )
    args = parser.parse_args()

    songs_dir: Path = args.songs_dir.resolve()

    if not songs_dir.exists():
        sys.exit(f"Songs folder not found: {songs_dir}")

    audio_files = sorted(
        f for f in songs_dir.iterdir()
        if f.is_file() and f.suffix.lower() in AUDIO_EXTENSIONS
    )

    if not audio_files:
        sys.exit(f"No audio files found in {songs_dir}")

    print(f"Found {len(audio_files)} audio file(s) in {songs_dir}\n")

    Base.metadata.create_all(bind=engine)

    raw_dir   = Path(settings.UPLOAD_DIR) / "demo_originals"
    stems_dir = Path(settings.UPLOAD_DIR) / "stems"
    raw_dir.mkdir(parents=True, exist_ok=True)
    stems_dir.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()

    if args.reset:
        clear_demo_songs(db)
        print()

    for audio_file in audio_files:
        artist, title = parse_filename(audio_file.stem)
        print(f"→ {artist} — {title}  [{audio_file.name}]")

        # Skip if already seeded (by title match)
        existing = db.query(Song).filter(Song.title == title, Song.is_demo == True).first()
        if existing:
            print(f"  [skip] already in database\n")
            continue

        # Copy original into uploads/demo_originals/
        dest_path = raw_dir / audio_file.name
        if not dest_path.exists():
            shutil.copy2(audio_file, dest_path)
            print(f"  Copied → {dest_path.name}")
        else:
            print(f"  [cached] {dest_path.name}")

        # Create DB record
        song = Song(
            title=title,
            artist=artist,
            original_path=str(dest_path),
            status="processing",
            is_demo=True,
        )
        db.add(song)
        db.commit()
        db.refresh(song)

        # Run Demucs
        print(f"  Separating stems (this takes a few minutes) …")
        try:
            stem_paths = separate_stems(str(dest_path), str(stems_dir), song.id)
            for stem_type, path in stem_paths.items():
                db.add(Stem(song_id=song.id, stem_type=stem_type, file_path=str(path)))
            song.status = "complete"
            db.commit()
            print(f"  ✓ {len(stem_paths)} stems: {', '.join(stem_paths.keys())}\n")
        except Exception as e:
            song.status = "error"
            song.error_message = str(e)[:500]
            db.commit()
            print(f"  [error] Demucs failed: {e}\n")

    db.close()
    print("Seeding complete.")


if __name__ == "__main__":
    main()
