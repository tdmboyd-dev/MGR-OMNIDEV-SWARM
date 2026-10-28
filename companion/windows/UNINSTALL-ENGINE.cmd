@echo off
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0UNINSTALL-ENGINE.ps1"
pause
