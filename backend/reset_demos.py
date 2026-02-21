"""
Clears all demo songs + stems from the database and deletes the stem files.
Downloaded MP3s in uploads/demo_originals/ are kept so re-seeding is faster.

Usage:
    cd backend
    python reset_demos.py
"""
import sys
import shutil
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import Song, Stem
from app.config import settings

db = SessionLocal()

demo_songs = db.query(Song).filter(Song.is_demo == True).all()
print(f"Found {len(demo_songs)} demo song(s) to remove.")

for song in demo_songs:
    db.query(Stem).filter(Stem.song_id == song.id).delete()
    db.delete(song)

db.commit()
db.close()
print("Database records cleared.")

# Delete stem files (keep demo_originals so downloads are skipped on re-seed)
stems_dir = Path(settings.UPLOAD_DIR) / "stems"
if stems_dir.exists():
    shutil.rmtree(stems_dir)
    stems_dir.mkdir()
    print(f"Stem files deleted: {stems_dir}")

print("\nDone. Run `python seed_demos.py` to re-seed.")
