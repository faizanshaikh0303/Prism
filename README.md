# Prism — Sound in Space

Binaural spatial audio mixer with AI stem separation.

Select a demo song → drag each stem node anywhere around the listener → hear the music in 3D with headphones.

**Live demo:** [prism.vercel.app](https://prism.vercel.app) *(replace with your Vercel URL)*

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript, Tailwind CSS, Zustand, React Router v6 |
| Spatial audio | Web Audio API — `PannerNode` with `panningModel: 'HRTF'` |
| Backend | FastAPI (Python 3.11), SQLAlchemy, JWT auth |
| Database | Neon (PostgreSQL, free tier) |
| Stem audio files | Supabase Storage (public CDN, free 1 GB) |
| Hosting — frontend | Vercel (free) |
| Hosting — backend | Render (free tier, demo-only mode) |
| Stem separation | Meta Demucs `htdemucs_6s` — run **locally**, stems pre-uploaded |

---

## Architecture

```
prism/
├── backend/                      # FastAPI
│   ├── app/
│   │   ├── main.py               # App factory, CORS, static mount (conditional)
│   │   ├── config.py             # Pydantic settings (.env / env vars)
│   │   ├── database.py           # SQLAlchemy — SQLite locally, Neon in prod
│   │   ├── models.py             # User, Song, Stem ORM models
│   │   ├── schemas.py            # Pydantic I/O schemas
│   │   ├── auth.py               # JWT + bcrypt helpers
│   │   ├── routers/
│   │   │   ├── auth.py           # POST /register /login  GET /me
│   │   │   ├── songs.py          # GET /demos /my  POST /upload  DELETE /:id
│   │   │   └── files.py          # GET /api/files/:path (local audio serving)
│   │   └── services/
│   │       └── stem_separator.py # Demucs subprocess wrapper
│   ├── seed_demos.py             # Scan /songs folder → run Demucs → seed DB
│   ├── upload_stems_to_supabase.py  # One-time: upload local stems → Supabase + Neon
│   └── requirements.txt          # No torch/demucs in prod (slim Render deploy)
│
├── Figma-Frontend/               # React app (Vite)
│   └── src/app/
│       ├── pages/Studio.jsx      # Main mixer — sidebar + canvas + player bar
│       ├── components/
│       │   ├── SpatialCanvas.jsx # 2D canvas drag UI
│       │   └── PlayerControls.jsx# Seek bar, play/pause, volume
│       ├── hooks/
│       │   ├── useSpatialAudio.js# Web Audio API HRTF engine
│       │   └── useAuth.js        # JWT session management
│       ├── store/audioStore.js   # Zustand global state
│       ├── services/api.js       # Axios wrapper + stemUrl() helper
│       └── constants.js          # STEM_COLORS, canvas geometry
│
├── render.yaml                   # Render deployment config
└── songs/                        # (gitignored) local audio files for seeding
```

### How spatial audio works

```
AudioBufferSourceNode
       │
   GainNode   (per-stem mute)
       │
   PannerNode  (panningModel: HRTF, distanceModel: inverse)
       │
  MasterGain
       │
AudioContext.destination → headphones
```

Canvas `(x, y)` → 3-D audio coordinates:
```
audioX =  canvasX / CANVAS_RADIUS * MAX_DIST
audioZ = -canvasY / CANVAS_RADIUS * MAX_DIST   ← canvas up = audio forward
audioY = 0                                       ← horizontal plane only
```

Distance from centre → `inverse` rolloff → closer = louder.
Angle around centre → HRTF panning → perceived direction.

---

## Local development

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 20+ |
| pip | latest |

Demucs requires **PyTorch** (local only — not needed on Render):
```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
```

---

### 1 — Backend (local)

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows: .venv\Scripts\activate

pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

cp .env.example .env
# Edit .env — set SECRET_KEY and any other values

uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000
Docs: http://localhost:8000/docs

---

### 2 — Frontend (local)

```bash
cd Figma-Frontend
npm install
npm run dev
```

Open http://localhost:5173

---

### 3 — Seed demo songs

Place audio files in a `songs/` folder at the repo root (any format: mp3, wav, flac…).
Filenames should follow `Artist - Title.mp3` for best parsing.

```bash
cd backend
source .venv/Scripts/activate
python seed_demos.py              # scans ../songs/, runs Demucs, seeds local DB
python seed_demos.py --reset      # clear existing demos first
python seed_demos.py --songs-dir /path/to/folder
```

---

## Deployment (free tier)

The production setup uses **demo-only mode** — stems are pre-generated locally and served from Supabase Storage CDN. Render's free tier (512 MB RAM) cannot run Demucs (needs 2–4 GB).

### One-time setup

1. **Supabase** — create project → Storage → bucket `prism-stems` (public)
2. **Neon** — create project `prism`, copy connection string
3. Seed Neon + upload stems to Supabase:
   ```bash
   cd backend
   pip install supabase psycopg2-binary
   # Set SUPABASE_URL, SUPABASE_SERVICE_KEY, DATABASE_URL in .env.production
   python upload_stems_to_supabase.py
   ```

### Render (backend)

- Connect GitHub repo → New Web Service
- Root directory: `backend` (or `render.yaml` handles this)
- Set env vars in Render dashboard:
  - `DATABASE_URL` — Neon connection string
  - `SECRET_KEY` — random hex: `python -c "import secrets; print(secrets.token_hex(32))"`
  - `CORS_ORIGINS` — `["https://your-app.vercel.app"]`
- `DEMO_MODE`, `PYTHON_VERSION`, `UPLOAD_DIR` are already set in `render.yaml`

### Vercel (frontend)

- Import GitHub repo → Root Directory: `Figma-Frontend`
- Add env var: `VITE_API_URL=https://prism-api.onrender.com`
- Add env var: `VITE_DEMO_MODE=true`
- Deploy

---

## API reference

### Auth
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{email, password}` | Create account → JWT |
| POST | `/api/auth/login`    | `{email, password}` | Sign in → JWT |
| GET  | `/api/auth/me`       | — | Current user (Bearer) |

### Songs
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/songs/demos`  | List complete demo songs + stems |
| GET    | `/api/songs/my`     | List current user's songs |
| POST   | `/api/songs/upload` | Upload + queue stem separation (disabled in demo mode) |
| GET    | `/api/songs/{id}`   | Poll song status & stems |
| DELETE | `/api/songs/{id}`   | Delete song + files |
| GET    | `/health`           | Health check (wakes Render from sleep) |

Stem processing is async. Poll `GET /api/songs/{id}` until `status === "complete"`.

---

## Environment variables

| Variable | Where set | Description |
|----------|-----------|-------------|
| `SECRET_KEY` | Render dashboard | JWT signing key |
| `DATABASE_URL` | Render dashboard | Neon PostgreSQL connection string |
| `CORS_ORIGINS` | Render dashboard | `["https://your-app.vercel.app"]` |
| `DEMO_MODE` | render.yaml | `"true"` — disables user uploads |
| `PYTHON_VERSION` | render.yaml | `"3.11.10"` — prevents Render defaulting to 3.14 |
| `VITE_API_URL` | Vercel dashboard | Render backend URL |
| `VITE_DEMO_MODE` | Vercel dashboard | `"true"` — disables upload button in UI |

---

## Attribution

Demo songs by artists from the `songs/` folder (user-supplied).
Stem separation powered by [Meta Demucs](https://github.com/facebookresearch/demucs).
