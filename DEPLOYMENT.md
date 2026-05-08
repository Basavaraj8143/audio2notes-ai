# Deployment Guide

This repository is set up for the following split deployment:

- **Frontend** on Vercel
- **Backend** on Render

That matches the current codebase and avoids any Docker requirement.

## Recommended Architecture

### Frontend

- Deploy the `frontend/` directory to Vercel as a Vite app
- Serve the built static files from Vercel's CDN
- Configure the frontend to call the Render backend with `VITE_API_BASE_URL`

### Backend

- Deploy the `backend/` directory to Render as a Python web service
- Start the API with Uvicorn on `0.0.0.0:$PORT`
- Configure CORS to allow your Vercel frontend URL

## Backend on Render

Render supports native Python web services, and its FastAPI quickstart uses:

- build command: `pip install -r requirements.txt`
- start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

This repo uses a slightly expanded build command because the app also needs Whisper and the spaCy English model.

### Option 1: Use `render.yaml`

The repository includes [render.yaml](D:/projects/audio2notes-ai/render.yaml:1) for a Render Blueprint-based setup.

Service configuration:

- runtime: `python`
- root directory: `backend`
- health check path: `/health`
- build command:
  `pip install -r requirements.txt && pip install openai-whisper && python -m spacy download en_core_web_sm`
- start command:
  `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`

### Option 2: Configure Render Manually

If you prefer the dashboard instead of Blueprint sync, create a new Render Web Service with:

- **Runtime**: Python
- **Root Directory**: `backend`
- **Build Command**:
  `pip install -r requirements.txt && pip install openai-whisper && python -m spacy download en_core_web_sm`
- **Start Command**:
  `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`

### Render Environment Variables

Set these in the Render dashboard:

- `MISTRAL_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_HTTP_REFERER`
- `CORS_ORIGINS`

Usually you should also set:

- `OPENROUTER_APP_TITLE=Audio2Notes AI`
- `WHISPER_MODEL_SIZE=tiny` on Render free, or `base` on a larger instance

#### Example Render values

```text
CORS_ORIGINS=https://your-frontend.vercel.app
OPENROUTER_HTTP_REFERER=https://your-frontend.vercel.app
OPENROUTER_APP_TITLE=Audio2Notes AI
```

### Important Render Note

Render free web services have an **ephemeral filesystem**. That means:

- SQLite session history can be lost after restart or spin-down
- any FAISS data stored on disk is not durable on free instances

If you want persistent local storage on Render, use a **paid web service with a persistent disk** and move paths like `SESSION_DB_PATH` and `FAISS_INDEX_DIR` under that disk mount path.

## Frontend on Vercel

Vercel supports Vite directly. The repo already includes [frontend/vercel.json](D:/projects/audio2notes-ai/frontend/vercel.json:1) for SPA rewrites.

### Vercel Project Settings

When creating the Vercel project:

- set the **Root Directory** to `frontend`
- framework preset can remain **Vite**
- build command: `npm run build`
- output directory: `dist`

### Vercel Environment Variables

Set these in the Vercel project:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com
VITE_API_DOCS_URL=https://your-render-service.onrender.com/docs
```

This project now routes API calls through `frontend/src/config/api.js`, so the Vercel deployment will use those values instead of hardcoded localhost URLs.

## End-to-End Deployment Order

1. Deploy the backend to Render first.
2. Copy the Render backend URL.
3. Add that URL to Vercel as `VITE_API_BASE_URL`.
4. Deploy the frontend to Vercel.
5. Copy the Vercel frontend URL.
6. Add that URL to Render as `CORS_ORIGINS`.
7. If you use OpenRouter, also set `OPENROUTER_HTTP_REFERER` to the Vercel frontend URL.
8. Redeploy the backend after changing Render environment variables.

## Post-Deploy Checks

After both deployments are live, verify:

### Backend

- `GET https://your-render-service.onrender.com/health`
- `GET https://your-render-service.onrender.com/docs`

### Frontend

- Vercel homepage loads
- audio upload requests reach the Render API
- transcript approval works
- Q&A requests succeed
- export endpoints open from the Notes page

## Troubleshooting

### CORS errors in browser

Check that:

- `CORS_ORIGINS` exactly includes your Vercel production domain
- you redeployed the Render service after changing env vars

### Frontend still calling localhost

Check that:

- Vercel project root is `frontend`
- `VITE_API_BASE_URL` is set in Vercel
- the frontend was redeployed after adding the env variable

### Render build fails on first deploy

Check:

- Python dependencies install successfully
- Whisper install completed
- `python -m spacy download en_core_web_sm` completed during the build

### Session history disappears on free Render

That is expected on Render free web services because the filesystem is not persistent across restart and spin-down. Use a paid instance with a persistent disk if you want durable local SQLite storage.
