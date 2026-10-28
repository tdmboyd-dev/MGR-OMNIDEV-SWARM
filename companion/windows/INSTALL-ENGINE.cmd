@echo off
setlocal
if not exist "%~dp0engine\install.mjs" (echo Extract All first. & pause & exit /b 1)
where node >nul 2>nul
if errorlevel 1 (echo Install Node.js 22 or newer from nodejs.org first. & pause & exit /b 1)
node "%~dp0engine\install.mjs"
pause
