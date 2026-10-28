@echo off
cd /d "%~dp0"
node doctor.mjs
if errorlevel 1 (
  echo Worker is not ready. Resolve the displayed requirements first.
  pause
  exit /b 1
)
node runner.mjs
pause
