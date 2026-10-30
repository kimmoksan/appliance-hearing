# 최초 1회: 의존성 설치 + backend/.env 생성(없을 때만)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

Push-Location "$root/frontend"; npm install; Pop-Location
Push-Location "$root/backend"; uv sync; Pop-Location

$envFile = "$root/backend/.env"
if (-not (Test-Path $envFile)) {
    Copy-Item "$root/backend/.env.example" $envFile
    Write-Host 'backend/.env 생성됨 (예시 모드). 실제 키는 이 파일에만 넣기.'
}
