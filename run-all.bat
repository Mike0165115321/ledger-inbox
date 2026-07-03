@echo off
echo ========================================
echo   Ledger Inbox — Start All Services
echo ========================================
echo.
echo Starting Backend API (FastAPI :8000)...
start "Ledger-Backend" cmd /c "cd /d %~dp0src\backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend (Next.js :3000)...
start "Ledger-Frontend" cmd /c "cd /d %~dp0src\frontend && npm run dev"
echo.
echo ========================================
echo   Backend  → http://localhost:8000
echo   Frontend → http://localhost:3000
echo   API Docs → http://localhost:8000/docs
echo ========================================
echo.
echo Close this window to stop both services.
pause
