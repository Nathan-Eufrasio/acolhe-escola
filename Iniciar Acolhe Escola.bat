@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado. Instale o Node.js e tente novamente.
  pause
  exit /b 1
)

if not exist "node_modules\express" (
  echo Preparando o projeto pela primeira vez...
  call npm.cmd install
  if errorlevel 1 (
    echo Nao foi possivel instalar as dependencias.
    pause
    exit /b 1
  )
)

node -e "require('net').connect(3000,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))" >nul 2>nul
if not errorlevel 1 (
  echo O servidor ja esta ativo. Abrindo o sistema...
  start "" "http://localhost:3000"
  exit /b 0
)

start "Acolhe Escola - servidor" cmd /k "cd /d ""%~dp0"" && npm.cmd start"
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"
echo O servidor esta aberto em outra janela. Mantenha-a aberta enquanto usar o sistema.
endlocal