@echo off
setlocal
title PUSULA - Tablet
set "NODE_EXE=%~dp0runtime\node.exe"
if not exist "%NODE_EXE%" (
  where node >nul 2>nul || (
    echo Node.js bulunamadi. https://nodejs.org adresinden kurun.
    pause
    exit /b 1
  )
  set "NODE_EXE=node"
)
"%NODE_EXE%" "%~dp0tablet.mjs"
if errorlevel 1 pause
endlocal
