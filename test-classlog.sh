#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo
echo " ClassLog · 테스트 모드 (개발 서버)"
echo " ----------------------------------"
echo " 처음 실행하면 테스트 학생/수업 데이터가 자동으로 채워집니다."
echo

if ! command -v node >/dev/null 2>&1; then
  echo " [!] Node.js가 설치되어 있지 않습니다."
  echo "     https://nodejs.org 에서 LTS 버전을 먼저 설치해주세요."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo " pnpm을 설치합니다 (최초 1회)..."
  npm install -g pnpm
fi

if [ ! -d node_modules ]; then
  echo " 패키지를 설치합니다. 1~2분 걸립니다..."
  pnpm install --no-frozen-lockfile
fi

echo
echo " 개발 서버를 시작합니다. 잠시 후 브라우저가 자동으로 열립니다."
echo " 종료하려면 Ctrl+C 를 누르세요."
echo

open_url() {
  sleep 3
  if command -v open >/dev/null 2>&1; then
    open "http://localhost:3000"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000"
  fi
}
open_url &

exec pnpm dev
