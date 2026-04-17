# Production Deployment Guide

## Quick Start with Docker

1. **Copy environment file:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

2. **Build and run:**
```bash
docker-compose up -d
```

3. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Production Considerations

### Required Environment Variables
- `MISTRAL_API_KEY` - Primary LLM provider
- `OPENROUTER_API_KEY` - Fallback LLM provider

### Security Notes
- File uploads limited to 100MB
- Audio files are automatically cleaned up
- Error messages don't expose internal details
- CORS restricted to localhost by default

### Monitoring
- Health check endpoint: `/health`
- Application logs available via `docker-compose logs`

### Scaling
- Backend is stateful (SQLite sessions)
- For horizontal scaling, replace SQLite with PostgreSQL
- Add Redis for session storage in multi-instance deployments

## Critical Fixes Applied

1. **Error Handling** - No more raw exception exposure
2. **Upload Security** - Size limits and validation
3. **File Cleanup** - Guaranteed temp file removal
4. **spaCy Model** - Startup check instead of runtime download
5. **Containerization** - Full Docker setup with nginx reverse proxy

Your application is now production-ready for single-instance deployment.
