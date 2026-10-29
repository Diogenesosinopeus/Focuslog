@echo off
cd /d "%~dp0"
title Focuslog Service
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Please install Node.js before starting Focuslog.
  pause
  exit /b 1
)
echo Starting Focuslog...
echo Keep this window open while using the timer.
echo.
node server.js
echo.
echo Focuslog stopped. Press any key to close.
pause >nul
