$ErrorActionPreference = "Stop"
$compose = "..\infrastructure\docker\docker-compose.yml"

Write-Host "Starting test database..."
docker compose -f $compose up -d postgres_test
do { Start-Sleep -Seconds 2; $h = docker inspect -f "{{.State.Health.Status}}" dcms_postgres_test } until ($h -eq "healthy")

Write-Host "Unit tests..."
npm test
$unit = $LASTEXITCODE

Write-Host "Integration (e2e) tests..."
npm run test:e2e
$e2e = $LASTEXITCODE

docker compose -f $compose stop postgres_test
if ($unit -ne 0 -or $e2e -ne 0) { Write-Host "FAILED" -ForegroundColor Red; exit 1 }
Write-Host "ALL TESTS PASSED" -ForegroundColor Green
