# Prism — Sound in Space

Binaural spatial audio mixer with AI stem separation.

Upload a song → Demucs separates it into vocal, drum, bass, guitar, piano, other tracks → drag each stem node anywhere around the listener → hear the music in 3D (best with headphones).

---

## Architecture

```
prism/
├── backend/               # FastAPI (Python)
│   ├── app/
│   │   ├── main.py        # App factory, CORS, static mounts
│   │   ├── config.py      # Pydantic settings (.env)
│   │   ├── database.py    # SQLAlchemy + SQLite
│   │   ├── models.py      # User, Song, Stem ORM models
│   │   ├── schemas.py     # Pydantic I/O schemas
│   │   ├── auth.py        # JWT + bcrypt helpers
│   │   ├── routers/
│   │   │   ├── auth.py    # POST /register, /login  GET /me
│   │   │   ├── songs.py   # GET /demos /my  POST /upload  DELETE /:id
│   │   │   └── files.py   # GET /api/files/:path (audio serving)
│   │   └── services/
│   │       └── stem_separator.py  # Demucs wrapper
│   ├── seed_demos.py      # Download + stem 10 CC-BY demo songs
│   └── requirements.txt
│
└── frontend/              # React 18 + Vite
    └── src/
        ├── pages/
        │   ├── Landing.jsx   # Marketing / scroll page
        │   ├── Auth.jsx      # Login / signup
        │   └── Studio.jsx    # Main mixer — sidebar + canvas + player
        ├── components/
        │   ├── SpatialCanvas.jsx   # Canvas-based drag UI
        │   └── PlayerControls.jsx  # Play, mute per-stem, volume
        ├── hooks/
        │   ├── useSpatialAudio.js  # Web Audio API HRTF engine
        │   └── useAuth.js          # JWT session management
        ├── store/
        │   └── audioStore.js       # Zustand global state
        ├── services/api.js         # Axios wrapper
        └── constants.js            # Colours, canvas geometry
```

### How spatial audio works

```
AudioBufferSourceNode
       │
   GainNode  (individual mute / volume per stem)
       │
   PannerNode  (panningModel: HRTF, distanceModel: inverse)
       │
  MasterGain
       │
AudioContext.destination (→ headphones)
```

Canvas position `(x, y)` → 3-D audio space:
```
audioX =  canvasX / CANVAS_RADIUS * MAX_DIST
audioZ = -canvasY / CANVAS_RADIUS * MAX_DIST   ← canvas down = audio back
audioY = 0                                       ← horizontal plane only
```

Distance from centre → `inverse` rolloff → closer = louder.
Angle around centre → HRTF panning → perceived direction.

---

## Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 20+ |
| pip | latest |

Demucs requires **PyTorch**. Install CPU-only version first (easiest):
```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
```
For CUDA (much faster), see https://pytorch.org/get-started/locally/

---

### 1 — Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set a strong SECRET_KEY

# Start server
uvicorn app.main:app --reload --port 8000
```

The API is now live at http://localhost:8000
Interactive docs: http://localhost:8000/docs

---

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

### 3 — Seed demo songs (optional but recommended)

Run this **once** after the backend is started. It downloads 10 CC-BY tracks from Kevin MacLeod, runs Demucs on each (~5 min per song on CPU), and registers them as demo songs.

```bash
cd backend
source .venv/bin/activate
python seed_demos.py
```

Songs are stored in `backend/uploads/` and registered in `prism.db`.

---

## API Reference

### Auth
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{email, password}` | Create account → JWT |
| POST | `/api/auth/login`    | `{email, password}` | Sign in → JWT |
| GET  | `/api/auth/me`       | — | Current user (Bearer) |

### Songs
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/songs/demos`      | List complete demo songs |
| GET  | `/api/songs/my`         | List current user's songs |
| POST | `/api/songs/upload`     | Upload + queue stem separation |
| GET  | `/api/songs/{id}`       | Poll song status & stems |
| DELETE | `/api/songs/{id}`     | Delete song + files |

Stem processing is async. Poll `GET /api/songs/{id}` until `status === "complete"`.

---

## Limits (free, zero-cost)

| Limit | Value |
|-------|-------|
| Songs per account | 3 |
| Demo songs | 10 (pre-seeded) |
| Storage | Local disk |
| Processing | CPU Demucs (~5 min/song) |

All infrastructure runs on your own machine — no paid services required.

---

## Replacing the frontend

The UI is intentionally minimal. When your Figma / Spline design is ready:

1. Replace `Landing.jsx`, `Auth.jsx`, `Studio.jsx` with your new components.
2. Keep the hooks (`useSpatialAudio`, `useAuth`) and store (`audioStore`) — they are UI-agnostic.
3. `SpatialCanvas.jsx` can be replaced with a WebGL/Three.js canvas; just call `onPositionChange(stemId, x, y)` when nodes move.

---

## Demo song attribution

All demo songs by **Kevin MacLeod** (incompetech.com).
Licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).
