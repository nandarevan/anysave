# AnySave

**All-in-One watermark-free media downloader** — download videos, reels, shorts, posts, audio, and images from **Instagram**, **TikTok**, and **YouTube** instantly.

Built with **React 19 + TypeScript + Tailwind CSS** (frontend) and **Python FastAPI + yt-dlp** (backend).

---

## 🚀 Local Development

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **ffmpeg** installed and on `PATH` (required by yt-dlp for audio conversion)
- **yt-dlp** (installed via `requirements.txt`)

### Backend

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run dev server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.  
Health check: `GET http://localhost:8000/health`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env file and configure
cp .env.example .env
# Edit .env if your backend runs on a different port

# Run dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🌐 Environment Variables

### Frontend

| Variable             | Description                | Default                  |
| -------------------- | -------------------------- | ------------------------ |
| `VITE_API_BASE_URL`  | Backend API base URL       | `http://localhost:8000`  |

### Backend

| Variable           | Description                              | Default                                                            |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------ |
| `ALLOWED_ORIGINS`  | Comma-separated list of allowed origins  | `http://localhost:5173,http://localhost:3000,https://anysave.vercel.app` |

---

## 🚢 Deployment

### Frontend → Vercel

1. Push the repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. Set **Root Directory** to `frontend`.
4. Set **Framework Preset** to `Vite`.
5. Add environment variable:
   - `VITE_API_BASE_URL` = your Render backend URL (e.g., `https://anysave-api.onrender.com`)
6. Deploy.

### Backend → Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect your GitHub repo.
3. Set **Root Directory** to `backend`.
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable:
   - `ALLOWED_ORIGINS` = your Vercel frontend URL (e.g., `https://anysave.vercel.app`)
7. Deploy.

> **Note:** Render's free tier may cold-start after inactivity. The first request may take ~30 seconds.

---

## 🛡️ API Endpoints

### `POST /api/extract`

Extract metadata and download links from a supported URL.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "success": true,
  "platform": "youtube",
  "title": "Video Title",
  "author": "Channel Name",
  "thumbnail": "https://...",
  "duration": "3:33",
  "original_url": "https://...",
  "formats": [
    { "format_type": "video", "label": "Download Video (1080p)", "ext": "mp4", "quality": "1080p", "url": "https://..." },
    { "format_type": "audio", "label": "Download Audio", "ext": "mp3", "quality": "128kbps", "url": "https://..." },
    { "format_type": "image", "label": "Download Image", "ext": "jpg", "url": "https://..." }
  ]
}
```

### `GET /api/download?url=...&filename=...`

Proxy download a media file with a clean filename.

### `GET /health`

Returns `{ "status": "ok", "service": "AnySave API" }`.

---

## 📄 License

This project is for personal and educational use. Respect the Terms of Service of each platform when downloading content.

---

**Made by Nanda Revan Saputro — © 2026**
