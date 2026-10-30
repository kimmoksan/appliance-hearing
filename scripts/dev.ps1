# 개발 서버: 백엔드(8000)는 새 창, 프론트(5173)는 현재 창
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

Start-Process powershell -WorkingDirectory "$root/backend" -ArgumentList '-NoExit', '-Command',
    'uv run uvicorn app.main:app --reload --port 8000 --env-file .env'
Set-Location "$root/frontend"
npm run dev
