@echo off
setlocal
cd /d "%~dp0\.."
C:\Progra~1\nodejs\node.exe scripts\serve-static.mjs --root apps/mobile/dist --port 8085
