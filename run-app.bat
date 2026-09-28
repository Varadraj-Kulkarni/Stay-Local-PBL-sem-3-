@echo off
title StayLocal Full-Stack System
cd /d "%~dp0"
set PATH=%~dp0.tools\node;%PATH%
set PORT=8787
set HOST=127.0.0.1
set STAYLOCAL_DATABASE_MODE=sqlite
set STAYLOCAL_SQLITE_PATH=./data/staylocal.sqlite
set STAYLOCAL_ALLOW_SIMULATION=true
set VITE_API_BASE_URL=http://localhost:8787

echo ==========================================================
echo              STAYLOCAL FULL-STACK SYSTEM                  
echo     Stay with Locals, Pay Less, Experience More.          
echo ==========================================================
echo.
echo Starting Backend API server on http://localhost:8787...
start /b "" "%~dp0.tools\node\node.exe" "%~dp0node_modules\tsx\dist\cli.mjs" "%~dp0server\src\index.ts"
timeout /t 2 /nobreak >nul

echo Starting Web Frontend on http://localhost:5173...
echo.
echo Demo Logins:
echo   Tourist: tourist@staylocal.demo ^| DemoPass123!
echo   Host:    host@staylocal.demo    ^| DemoPass123!
echo   Admin:   admin@staylocal.demo   ^| DemoPass123!
echo.
"%~dp0.tools\node\node.exe" "%~dp0node_modules\vite\bin\vite.js" --host
