@echo off
title Site Gean - Menu Principal
chcp 65001 >nul

:MENU
cls
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║         SITE GEAN - MENU PRINCIPAL           ║
echo  ╠══════════════════════════════════════════════╣
echo  ║  [1] Rodar localmente  (http://localhost:5174)║
echo  ║  [2] Build + Deploy → Cloudflare Pages       ║
echo  ║  [3] Apenas Build     (gera pasta dist/)     ║
echo  ║  [0] Sair                                    ║
echo  ╚══════════════════════════════════════════════╝
echo.
set /p opcao="  Escolha uma opcao: "

if "%opcao%"=="1" goto DEV
if "%opcao%"=="2" goto DEPLOY
if "%opcao%"=="3" goto BUILD
if "%opcao%"=="0" exit
goto MENU

:: ─────────────────────────────────────────────
:DEV
cls
echo.
echo  [1/2] Verificando Node.js...
where npm >nul 2>&1
if errorlevel 1 (
    echo  ERRO: Node.js nao encontrado. Instale em https://nodejs.org
    pause & goto MENU
)
echo  [2/2] Verificando dependencias...
if not exist "node_modules" (
    echo  Instalando dependencias pela primeira vez...
    npm install
)
echo.
echo  Abrindo http://localhost:5174 no navegador...
timeout /t 2 >nul
start "" "http://localhost:5174"
npm run dev
pause & goto MENU

:: ─────────────────────────────────────────────
:BUILD
cls
echo.
echo  Gerando build de producao...
npm run build
if errorlevel 1 (
    echo.
    echo  ERRO no build! Verifique os erros acima.
    pause & goto MENU
)
echo.
echo  Build gerado com sucesso na pasta dist/
pause & goto MENU

:: ─────────────────────────────────────────────
:DEPLOY
cls
echo.
echo  [1/3] Verificando Node.js e npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo  ERRO: Node.js nao encontrado. Instale em https://nodejs.org
    pause & goto MENU
)
echo  [2/3] Gerando build de producao...
npm run build
if errorlevel 1 (
    echo.
    echo  ERRO no build! Verifique os erros acima.
    pause & goto MENU
)
echo.
echo  [3/3] Enviando para Cloudflare Pages...
echo  (Na primeira vez pode pedir login no navegador - e so uma vez)
echo.
npx wrangler pages deploy dist --project-name site-gean --branch main --commit-dirty=true
if errorlevel 1 (
    echo.
    echo  ERRO no deploy! Verifique os erros acima.
    pause & goto MENU
)
echo.
echo  ✓ Deploy concluido!
echo  Acesse: https://site-gean.pages.dev
echo.
pause & goto MENU
