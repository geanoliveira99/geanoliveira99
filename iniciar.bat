@echo off
title Site Gean - Dev Server
echo.
echo  Iniciando o projeto site-gean...
echo.

cd /d "%~dp0"

where npm >nul 2>&1
if errorlevel 1 (
    echo  ERRO: Node.js / npm nao encontrado.
    echo  Instale em: https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo  Instalando dependencias...
    npm install
    echo.
)

echo  Abrindo no navegador em http://localhost:5173
start "" "http://localhost:5173"

npm run dev
pause
