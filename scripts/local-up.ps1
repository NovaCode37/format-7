#Requires -Version 5.1
[CmdletBinding()]
param(
    [switch]$Fresh,
    [switch]$NoSeed
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($msg)  { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)    { Write-Host "    ok  $msg"   -ForegroundColor Green }
function Warn($msg)  { Write-Host "    !!  $msg"   -ForegroundColor Yellow }
function Die($msg)   { Write-Host "    xx  $msg"   -ForegroundColor Red; exit 1 }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Die "Docker not found. Install Docker Desktop first."
}
try {
    docker info *> $null
} catch {
}
if ($LASTEXITCODE -ne 0) { Die "Docker daemon is not running. Start Docker Desktop." }

Step "Checking .env"
$envExists = Test-Path ".env"
$envEmpty  = $envExists -and ((Get-Item ".env").Length -eq 0)

if (-not $envExists -or $envEmpty) {
    if ($envEmpty) { Warn ".env is empty - regenerating from .env.example" }
    if (-not (Test-Path ".env.example")) { Die ".env.example not found" }

    Copy-Item ".env.example" ".env" -Force
    $secret = python -c "import secrets; print(secrets.token_urlsafe(48))"
    if (-not $secret) { Die "Failed to generate JWT secret. Is Python on PATH?" }
    (Get-Content ".env") -replace '^JWT_SECRET_KEY=.*$', "JWT_SECRET_KEY=$secret" | Set-Content ".env" -Encoding UTF8

    if (-not (Select-String -Path ".env" -Pattern "^APP_ENV=" -Quiet))            { Add-Content ".env" "APP_ENV=development" }
    if (-not (Select-String -Path ".env" -Pattern "^ENABLE_DEV_PAYMENT=" -Quiet)) { Add-Content ".env" "ENABLE_DEV_PAYMENT=1" }

    Ok ".env created (JWT_SECRET_KEY auto-generated)"
    Warn "Edit .env to add ADMIN_EMAILS=you@example.com if you want admin notifications"
} else {
    Ok ".env already exists"
}

if ($Fresh) {
    Step "Tearing down existing stack and volumes"
    docker compose down -v 2>&1 | Out-Null
    Ok "Volumes wiped"
}

Step "Starting core services postgres redis backend frontend"
docker compose up -d --build postgres redis backend frontend
if ($LASTEXITCODE -ne 0) { Die "docker compose up failed" }

Step "Waiting for backend healthcheck"
$max = 60
$ok = $false
for ($i = 0; $i -lt $max; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($resp.StatusCode -eq 200) { $ok = $true; break }
    } catch { Start-Sleep -Seconds 1 }
}
if (-not $ok) {
    Warn "Backend did not respond in $max seconds. Check: docker compose logs backend"
} else {
    Ok "Backend healthy"
}

Step "Applying database migrations"
& {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        cmd /c "docker compose exec -T backend alembic upgrade head 2>&1" | Out-Host
    } finally {
        $ErrorActionPreference = $prev
    }
}
if ($LASTEXITCODE -ne 0) { Warn "Alembic failed (auto_migrate fallback)" } else { Ok "Migrations applied" }

if (-not $NoSeed) {
    Step "Seeding initial data"
    & {
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        try {
            cmd /c "docker compose exec -T backend python seed.py 2>&1" | Out-Host
        } finally {
            $ErrorActionPreference = $prev
        }
    }
    if ($LASTEXITCODE -eq 0) { Ok "Seed loaded" } else { Warn "Seed failed (probably already seeded)" }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor White
Write-Host " Format7 is up:" -ForegroundColor White
Write-Host "   Site     http://localhost:3000" -ForegroundColor Green
Write-Host "   API      http://localhost:8000" -ForegroundColor Green
Write-Host "   Swagger  http://localhost:8000/docs" -ForegroundColor Green
Write-Host "   Health   http://localhost:8000/health" -ForegroundColor Green
Write-Host ""
Write-Host " Useful commands:" -ForegroundColor White
Write-Host "   logs:    docker compose logs -f backend frontend" -ForegroundColor Gray
Write-Host "   stop:    .\scripts\local-down.ps1" -ForegroundColor Gray
Write-Host "   admin:   .\scripts\create-admin.ps1 -Email you@x.com" -ForegroundColor Gray
Write-Host "   reset:   .\scripts\local-up.ps1 -Fresh" -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor White
