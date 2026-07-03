@echo off
cd /d "%~dp0src\frontend"
echo ========================================
echo   Ledger Inbox — Frontend
echo   Next.js :3000
echo ========================================
echo.
call npm run dev
pause
