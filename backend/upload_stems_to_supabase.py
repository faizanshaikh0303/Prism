"""
One-time local seeding script — run this ONCE to:
  1. Upload all local stem files to Supabase Storage (bucket: prism-stems)
  2. Recreate the songs/stems in Neon PostgreSQL with public Supabase URLs

Prerequisites:
  pip install supabase psycopg2-binary

Usage:
  Set the following env vars (or create a .env.production file):

    SUPABASE_URL=https://xxxx.supabase.co
    SUPABASE_SERVICE_KEY=eyJhbGci...   # service_role key from Supabase dashboard
    DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require   # Neon

  Then run:
    python backend/upload_stems_to_supabase.py
"""
import os
import sys
from pathlib import Path

# ── Load env ──────────────────────────────────────────────────────────────────
from dotenv import load_dotenv

# Try .env.production first, fall back to .env
load_dotenv(Path(__file__).parent / ".env.production", override=False)
load_dotenv(Path(__file__).parent / ".env", override=False)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
DATABASE_URL = os.environ["DATABASE_URL"]
BUCKET = "prism-stems"

# Local SQLite used as the source of truth for which songs/stems exist
LOCAL_SQLITE = Path(__file__).parent / "prism.db"

# ── Imports ───────────────────────────────────────────────────────────────────
try:
    from supabase import create_client
except ImportError:
    sys.exit("supabase package not installed. Run: pip install supabase")

try:
    import sqlalchemy as sa
    from sqlalchemy.orm import sessionmaker
except ImportError:
    sys.exit("sqlalchemy not installed. Run: pip install sqlalchemy psycopg2-binary")

# ── Connect to local SQLite ───────────────────────────────────────────────────
sqlite_engine = sa.create_engine(
    f"sqlite:///{LOCAL_SQLITE}", connect_args={"check_same_thread": False}
)
LocalSession = sessionmaker(bind=sqlite_engine)

# ── Connect to Neon (PostgreSQL) ──────────────────────────────────────────────
neon_url = DATABASE_URL
if "sslmode" not in neon_url:
    neon_url += "?sslmode=require"
neon_engine = sa.create_engine(neon_url)
NeonSession = sessionmaker(bind=neon_engine)

# ── Connect to Supabase Storage ───────────────────────────────────────────────
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def ensure_bucket():
    """Create the bucket if it doesn't exist (idempotent)."""
    buckets = [b.name for b in supabase.storage.list_buckets()]
    if BUCKET not in buckets:
        supabase.storage.create_bucket(BUCKET, options={"public": True})
        print(f"Created bucket: {BUCKET}")
    else:
        print(f"Bucket '{BUCKET}' already exists.")


def public_url(path_in_bucket: str) -> str:
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path_in_bucket}"


def upload_stem(local_path: Path, song_id: int, stem_type: str) -> str:
    """Upload one stem file, return its public URL."""
    remote_path = f"{song_id}/{stem_type}{local_path.suffix}"
    with local_path.open("rb") as f:
        data = f.read()
    try:
        supabase.storage.from_(BUCKET).upload(
            remote_path, data,
            file_options={"content-type": "audio/wav", "upsert": "true"},
        )
    except Exception as e:
        print(f"  Warning uploading {remote_path}: {e}")
    url = public_url(remote_path)
    print(f"  ↑ {local_path.name} → {url}")
    return url


def seed_neon(songs_data: list[dict]):
    """Insert songs + stems into Neon, skipping already-existing titles."""
    with NeonSession() as neon:
        # Ensure tables exist (idempotent)
        with neon_engine.connect() as conn:
            conn.execute(sa.text("""
                CREATE TABLE IF NOT EXISTS songs (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    artist TEXT,
                    original_path TEXT,
                    status TEXT NOT NULL DEFAULT 'complete',
                    error_message TEXT,
                    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
                    user_id INTEGER,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))
            conn.execute(sa.text("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))
            conn.execute(sa.text("""
                CREATE TABLE IF NOT EXISTS stems (
                    id SERIAL PRIMARY KEY,
                    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
                    stem_type TEXT NOT NULL,
                    file_path TEXT NOT NULL
                )
            """))
            conn.commit()

        for song in songs_data:
            # Check if already inserted
            existing = neon.execute(
                sa.text("SELECT id FROM songs WHERE title = :title AND is_demo = TRUE"),
                {"title": song["title"]},
            ).fetchone()
            if existing:
                print(f"  skip (exists): {song['title']}")
                continue

            row = neon.execute(
                sa.text("""
                    INSERT INTO songs (title, artist, status, is_demo)
                    VALUES (:title, :artist, 'complete', TRUE)
                    RETURNING id
                """),
                {"title": song["title"], "artist": song.get("artist", "")},
            ).fetchone()
            new_id = row[0]

            for stem_type, url in song["stems"].items():
                neon.execute(
                    sa.text("INSERT INTO stems (song_id, stem_type, file_path) VALUES (:sid, :st, :fp)"),
                    {"sid": new_id, "st": stem_type, "fp": url},
                )

            neon.commit()
            print(f"  ✓ seeded: {song['title']} (id={new_id})")


def main():
    print("=== Prism: Upload stems to Supabase + seed Neon ===\n")

    # 1. Read demo songs from local SQLite
    with LocalSession() as local:
        songs_rows = local.execute(
            sa.text("SELECT id, title, artist FROM songs WHERE is_demo = 1 AND status = 'complete'")
        ).fetchall()

    if not songs_rows:
        sys.exit(
            "No demo songs found in local prism.db. "
            "Run seed_demos.py first to generate stems locally."
        )

    print(f"Found {len(songs_rows)} demo songs in local DB.\n")

    # 2. Ensure Supabase bucket exists
    ensure_bucket()
    print()

    # 3. For each song, upload its stems and collect URLs
    songs_data = []
    for (song_id, title, artist) in songs_rows:
        print(f"Song [{song_id}]: {title}")

        with LocalSession() as local:
            stems_rows = local.execute(
                sa.text("SELECT stem_type, file_path FROM stems WHERE song_id = :sid"),
                {"sid": song_id},
            ).fetchall()

        stem_urls = {}
        for (stem_type, file_path) in stems_rows:
            local_path = Path(file_path)
            if not local_path.exists():
                print(f"  ✗ Missing file: {file_path} — skipping stem")
                continue
            url = upload_stem(local_path, song_id, stem_type)
            stem_urls[stem_type] = url

        if stem_urls:
            songs_data.append({"title": title, "artist": artist, "stems": stem_urls})
        else:
            print(f"  ✗ No stem files found for '{title}' — skipping song")

        print()

    # 4. Seed Neon
    print("Seeding Neon PostgreSQL...")
    seed_neon(songs_data)

    print("\n✓ Done! Your Neon DB is ready and stems are on Supabase CDN.")
    print(f"\nNext steps:")
    print(f"  1. Set DATABASE_URL on Render to your Neon connection string")
    print(f"  2. Set CORS_ORIGINS on Render to your Vercel domain")
    print(f"  3. Push to GitHub → Render deploys automatically")


if __name__ == "__main__":
    main()
