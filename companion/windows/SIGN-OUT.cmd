@echo off
setlocal
title OmniDev ChatGPT Companion
if not exist "%~dp0chatgpt.mjs" (
 echo Right-click the ZIP and choose Extract All first.
 pause
 exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required. Install it from https://nodejs.org
  pause
  exit /b 1
)
echo OmniDev ChatGPT Companion
echo Keep this window open while the companion works.
echo.
node "%~dp0chatgpt.mjs" logout
echo.
pause
