@echo off
cd /d "%~dp0src\backend"
echo ========================================
echo   Ledger Inbox — Backend API
echo   FastAPI :8000
echo ========================================
echo.
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
