# Production Deployment Guide

## Recommended Setup

This project runs as two separate services:

- Frontend: Vite build served from any static host
- Backend: FastAPI served with Uvicorn on a Linux or Windows VM

## Backend Deployment

1. Copy the project to your server and create a virtual environment.
2. Install backend dependencies from `backend/requirements.txt`.
3. Install the spaCy English model:
   `python -m spacy download en_core_web_sm`
4. Copy `.env.example` to `.env` and set your API keys.
5. Start the API from `backend/`:
   `python -m uvicorn main:app --host 0.0.0.0 --port 8000`

## Frontend Deployment

1. Install dependencies in `frontend/`.
2. Build the app with `npm run build`.
3. Serve the generated `frontend/dist` folder with your preferred static host.
4. Point the frontend API base URL at the deployed backend service.

## Production Considerations

### Required Environment Variables

- `MISTRAL_API_KEY` for the primary LLM provider
- `OPENROUTER_API_KEY` if you want the fallback provider enabled

### Security Notes

- File uploads are capped in the backend
- Temporary audio files are cleaned up automatically
- CORS should be restricted to your frontend origin before production use

### Monitoring

- Health check endpoint: `/health`
- Review Uvicorn or process-manager logs for runtime issues

### Scaling

- The default session store is file-based and best suited for a single instance
- For horizontal scaling, move sessions and indexes to shared infrastructure

## Suggested Production Stack

- `uvicorn` behind a process manager such as `systemd`, `pm2`, or NSSM
- A reverse proxy such as Nginx, Caddy, or your platform's built-in gateway
- Persistent storage for uploaded audio, indexes, and any session database you keep
