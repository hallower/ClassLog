@echo off
rem -- ClassLog production launcher (NODE_ENV=production, uses classlog-prod DB) --
rem Korean comments / messages are intentionally avoided here:
rem Windows cmd parses .bat files in the OEM codepage (CP949 on Korean Windows),
rem so non-ASCII characters get mis-parsed and break the script. See README for the
rem Korean description of what this script does.

title ClassLog
cd /d "%~dp0"

echo.
echo === ClassLog ===
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js is not installed.
  echo     Please install LTS from https://nodejs.org and run this again.
  echo.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo Installing pnpm ^(first time only^)...
  call npm install -g pnpm
  if errorlevel 1 (
    echo [!] Failed to install pnpm.
    pause
    exit /b 1
  )
)

if not exist node_modules (
  echo Installing packages... ^(1-2 min^)
  call pnpm install --no-frozen-lockfile
  if errorlevel 1 (
    echo [!] Package install failed.
    pause
    exit /b 1
  )
)

if not exist .next (
  echo Building... ^(1-2 min, first time only^)
  call pnpm build
  if errorlevel 1 (
    echo [!] Build failed.
    pause
    exit /b 1
  )
)

echo.
echo Starting server. Browser will open in a few seconds.
echo Press Ctrl+C in this window to stop.
echo.

start "" "http://localhost:3000"
call pnpm start
