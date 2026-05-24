@echo off
rem -- ClassLog dev/test launcher (NODE_ENV=development, uses classlog-dev DB) --
rem Seeds test students/sessions on first run. Korean text avoided here because
rem Windows cmd parses .bat in CP949 and breaks on UTF-8 multibyte chars.

title ClassLog (test)
cd /d "%~dp0"

echo.
echo === ClassLog (test mode, seeded data) ===
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

echo.
echo Starting dev server. Browser will open in a few seconds.
echo On first visit, sample students / sessions are seeded automatically.
echo Press Ctrl+C in this window to stop.
echo.

start "" "http://localhost:3000"
call pnpm dev
