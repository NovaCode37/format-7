#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$Email,
    [Parameter(Mandatory=$false)][string]$Password,
    [Parameter(Mandatory=$false)][string]$Name = "Admin"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker not found. Install Docker Desktop first." -ForegroundColor Red
    exit 1
}
try {
    docker info *> $null
} catch {
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker daemon is not running. Start Docker Desktop." -ForegroundColor Red
    exit 1
}

if (-not $Password) {
    $sec = Read-Host "Password for $Email" -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
}

if ($Password.Length -lt 12) {
    Write-Host "Password too short (min 12 chars)" -ForegroundColor Red
    exit 1
}

$envCheck = docker compose ps --services --filter "status=running" 2>&1
if ($envCheck -notmatch "backend") {
    Write-Host "Backend container is not running. Start it first: .\scripts\local-up.ps1" -ForegroundColor Red
    exit 1
}

$EmailLc = $Email.ToLower()
$NameEsc = $Name -replace "'", "''"

$pyCode = @"
from database import SessionLocal
from models import User
from auth import hash_password
db = SessionLocal()
try:
    u = db.query(User).filter(User.email == '$EmailLc').first()
    if u:
        u.hashed_password = hash_password('$Password')
        u.email_verified = True
        u.is_active = True
        db.commit()
        print('updated existing user', u.id)
    else:
        u = User(email='$EmailLc', name='$NameEsc',
                hashed_password=hash_password('$Password'),
                is_active=True, email_verified=True)
        db.add(u); db.commit(); db.refresh(u)
        print('created user', u.id)
finally:
    db.close()
"@

$pyCode | docker compose exec -T backend python -

Write-Host ""
Write-Host "Now grant admin role:" -ForegroundColor Cyan
Write-Host "  Add to .env:  ADMIN_EMAILS=$EmailLc" -ForegroundColor Gray
Write-Host "  Then:         docker compose restart backend" -ForegroundColor Gray
