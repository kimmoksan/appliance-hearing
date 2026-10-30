# PR 전 검사: 프론트 lint·타입·빌드 + 백엔드 테스트. 하나라도 실패하면 종료코드 1
$root = Split-Path $PSScriptRoot -Parent
$failed = @()

Push-Location "$root/frontend"
npm run lint;  if ($LASTEXITCODE) { $failed += 'frontend lint' }
npm run build; if ($LASTEXITCODE) { $failed += 'frontend build' }
Pop-Location

Push-Location "$root/backend"
uv run pytest -q; if ($LASTEXITCODE) { $failed += 'backend test' }
Pop-Location

if ($failed) { Write-Host "실패: $($failed -join ', ')" -ForegroundColor Red; exit 1 }
Write-Host '모든 검사 통과' -ForegroundColor Green
