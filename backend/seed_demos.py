"""
Demo song seeder.

Downloads 10 CC-licensed tracks from Kevin MacLeod (Incompetech, CC BY 3.0),
runs Demucs stem separation on each, and registers them in the database as
is_demo=True songs.

Usage:
    cd backend
    python seed_demos.py

Attribution: All songs by Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
https://creativecommons.org/licenses/by/4.0/
"""
import sys
import urllib.request
from pathlib import Path

# Add project root so we can import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import Song, Stem
from app.services.stem_separator import separate_stems

# ── Demo track catalogue ───────────────────────────────────────────────────────
# Direct MP3 links from the Free Music Archive / Incompetech.
# These are all CC BY 4.0 — free for any use with attribution.
DEMO_TRACKS = [
    {
        "title": "Sneaky Snitch",
        "artist": "Kevin MacLeod",
        "url": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3",
    },
    {
        "title": "Monkeys Spinning Monkeys",
        "artist": "Kevin MacLeod",
        "url": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3",
    },
    {
        "title": "Investigations",
        "artist": "Kevin MacLeod",
        "url": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Investigations.mp3",
    },
    {
        "title": "Pixelland",
        "artist": "Kevin MacLeod",
        "url": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Pixelland.mp3",
    },
    {
        "title": "Five Armies",
        "artist": "Kevin MacLeod",
        "url": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Five%20Armies.mp3",
    },
    # {
    #     "title": "Dewdrop Fantasy",
    #     "artist": "Kevin MacLeod",
    #     "url": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dewdrop%20Fantasy.mp3",
    # },
    # {
    #     "title": "Local Forecast",
    #     "artist": "Kevin MacLeod",
    #     "url": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Local%20Forecast.mp3",
    # },
    # {
    #     "title": "Scheming Weasel",
    #     "artist": "Kevin MacLeod",
    #     "url": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Scheming%20Weasel%20slower.mp3",
    # },
    # {
    #     "title": "Achaidh Cheide",
    #     "artist": "Kevin MacLeod",
    #     "url": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Achaidh%20Cheide.mp3",
    # },
    # {
    #     "title": "Volatile Reaction",
    #     "artist": "Kevin MacLeod",
    #     "url": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Volatile%20Reaction.mp3",
    # },
]


def main() -> None:
    Base.metadata.create_all(bind=engine)

    raw_dir = Path(settings.UPLOAD_DIR) / "demo_originals"
    stems_dir = Path(settings.UPLOAD_DIR) / "stems"
    raw_dir.mkdir(parents=True, exist_ok=True)
    stems_dir.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()

    for track in DEMO_TRACKS:
        title = track["title"]
        artist = track["artist"]

        # Skip if already seeded
        existing = db.query(Song).filter(Song.title == title, Song.is_demo == True).first()
        if existing:
            print(f"  [skip] {title} — already in database")
            continue

        print(f"\n→ Processing: {title}")

        # Download
        safe_name = title.replace(" ", "_").replace("/", "-")
        mp3_path = raw_dir / f"{safe_name}.mp3"

        if not mp3_path.exists():
            print(f"  Downloading from {track['url']} …")
            try:
                urllib.request.urlretrieve(track["url"], mp3_path)
            except Exception as e:
                print(f"  [error] Download failed: {e}")
                continue
        else:
            print(f"  [cached] {mp3_path.name}")

        # Create DB record
        song = Song(
            title=title,
            artist=artist,
            original_path=str(mp3_path),
            status="processing",
            is_demo=True,
        )
        db.add(song)
        db.commit()
        db.refresh(song)

        # Run Demucs
        print(f"  Separating stems (this takes a few minutes) …")
        try:
            stem_paths = separate_stems(str(mp3_path), str(stems_dir), song.id)
            for stem_type, path in stem_paths.items():
                db.add(Stem(song_id=song.id, stem_type=stem_type, file_path=str(path)))
            song.status = "complete"
            db.commit()
            print(f"  ✓ Done — {len(stem_paths)} stems: {', '.join(stem_paths.keys())}")
        except Exception as e:
            song.status = "error"
            song.error_message = str(e)[:500]
            db.commit()
            print(f"  [error] Demucs failed: {e}")

    db.close()
    print("\nSeeding complete.")


if __name__ == "__main__":
    main()
