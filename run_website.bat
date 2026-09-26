@echo off
title RAKTechSoftHub Local Website Server
cd /d "%~dp0"
echo ========================================================
echo Starting RAKTechSoftHub Website locally...
echo ========================================================
start "" http://localhost:3000
node serve_website.js
pause
