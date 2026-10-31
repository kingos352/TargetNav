@echo off
setlocal
set "NODE_EXE=%~dp0runtime\node.exe"
if not exist "%NODE_EXE%" (
  where node >nul 2>nul || (
    echo Node.js bulunamadi. https://nodejs.org adresinden kurun.
    pause
    exit /b 1
  )
  set "NODE_EXE=node"
)
if not exist "%~dp0launcher.cjs" (
  echo Baslatici dosyasi eksik. Guncel paketi yeniden cikarin.
  pause
  exit /b 1
)
"%NODE_EXE%" "%~dp0launcher.cjs"
if errorlevel 1 (
  echo Ayrintilar: "%~dp0runtime\baslat.log" ve "%~dp0runtime\sunucu.log"
  pause
  exit /b 1
)
endlocal
