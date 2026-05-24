@echo off
chcp 65001 >nul
title ClassLog · 클래스로그
cd /d "%~dp0"

echo.
echo  ClassLog · 클래스로그
echo  ----------------------
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [!] Node.js가 설치되어 있지 않습니다.
  echo      https://nodejs.org 에서 LTS 버전을 먼저 설치해주세요.
  echo.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo  pnpm을 설치합니다 ^(최초 1회^)...
  call npm install -g pnpm
  if errorlevel 1 (
    echo  [!] pnpm 설치에 실패했습니다.
    pause
    exit /b 1
  )
)

if not exist node_modules (
  echo  첫 실행이라 패키지를 설치합니다. 1~2분 걸립니다...
  call pnpm install --no-frozen-lockfile
  if errorlevel 1 (
    echo  [!] 패키지 설치 실패.
    pause
    exit /b 1
  )
)

if not exist .next (
  echo  첫 빌드를 진행합니다. 1~2분 걸립니다...
  call pnpm build
  if errorlevel 1 (
    echo  [!] 빌드 실패.
    pause
    exit /b 1
  )
)

echo.
echo  서버를 시작합니다. 잠시 후 브라우저가 자동으로 열립니다.
echo  종료하려면 이 창에서 Ctrl+C 를 누르세요.
echo.

start "" "" "http://localhost:3000"
call pnpm start
