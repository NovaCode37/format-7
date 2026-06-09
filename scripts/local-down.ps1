#Requires -Version 5.1
[CmdletBinding()]
param(
    [switch]$Wipe
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Die($msg) { Write-Host "xx  $msg" -ForegroundColor Red; exit 1 }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Die "Docker not found. Install Docker Desktop first."
}
try {
    docker info *> $null
} catch {
}
if ($LASTEXITCODE -ne 0) {
    Die "Docker daemon is not running. Start Docker Desktop."
}

if ($Wipe) {
    Write-Host "Stopping stack and wiping volumes (database will be lost)..." -ForegroundColor Yellow
    docker compose down -v
} else {
    Write-Host "Stopping stack (volumes preserved)..." -ForegroundColor Cyan
    docker compose down
}

Write-Host "Done." -ForegroundColor Green
