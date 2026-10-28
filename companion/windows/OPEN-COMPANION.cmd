@echo off
setlocal
title OmniDev Companion - Keep Open
if not exist "%~dp0dashboard.mjs" (
 echo Right-click the ZIP and choose Extract All first.
 pause
 exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
 echo Install Node.js 22 or newer from nodejs.org first.
 pause
 exit /b 1
)
node "%~dp0dashboard.mjs"
pause
