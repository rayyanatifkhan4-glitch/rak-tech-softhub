@echo off
title RAK Tech ERP Launcher
cd /d "%~dp0App"
echo ========================================================
echo   Starting RAK Tech ERP (Enterprise Business Suite)...
echo ========================================================
echo   Web URL:        http://localhost:5173
echo   Local DB Server: http://localhost:3010
echo   Desktop Window: Launching Electron UI...
echo ========================================================
start "" http://localhost:5173
npm run dev
pause
