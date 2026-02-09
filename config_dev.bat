@echo off
title Sistema Dev - Bet Balance Boss
cd /d "%~dp0"

:: --- CONFIGURACAO DAS FERRAMENTAS NO DISCO D ---
set NODE_HOME=D:\PROGRAMACAO\node
set GIT_HOME=D:\PROGRAMACAO\Git\bin
set PATH=%NODE_HOME%;%GIT_HOME%;%PATH%

:menu
cls
echo ====================================================
echo    AMBIENTE DE DESENVOLVIMENTO (DISCO D)
echo ====================================================
echo  PASTA: %cd%
echo ====================================================
echo.
echo  1. INICIAR SERVIDOR (pnpm dev)
echo  2. CONECTAR/ENVIAR PARA GITHUB (Novo Repositorio)
echo  3. ATUALIZAR GITHUB (Apenas subir mudancas)
echo  4. INSTALAR DEPENDENCIAS (pnpm install)
echo  5. SAIR
echo.
set /p opt="Escolha uma opcao: "

if "%opt%"=="1" goto :servidor
if "%opt%"=="2" goto :conectar_git
if "%opt%"=="3" goto :push_git
if "%opt%"=="4" goto :instalar
if "%opt%"=="5" exit
goto menu

:servidor
echo.
echo [!] Iniciando servidor Vite...
call pnpm dev
pause
goto menu

:conectar_git
echo.
set /p repo_url="COLE O LINK DO REPOSITORIO (HTTPS): "
call git init
call git remote remove origin >nul 2>&1
call git remote add origin %repo_url%
call git branch -M main
call git add .
call git commit -m "Conexao via Menu"
call git push -u origin main --force
echo.
echo [OK] Repositorio conectado e sincronizado!
pause
goto menu

:push_git
echo.
set /p msg="O que voce mudou? "
call git add .
call git commit -m "%msg%"
call git push origin main
echo.
echo [OK] Alteracoes enviadas!
pause
goto menu

:instalar
echo.
echo [!] Rodando pnpm install...
call pnpm install
pause
goto menu