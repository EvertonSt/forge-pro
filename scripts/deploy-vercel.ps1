# deploy-vercel.ps1 - Forge-Pro Vercel Deployment (PowerShell)
param(
    [switch]$App,
    [switch]$Templates,
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"
$root = Split-Path $PSScriptRoot

if (-not $App -and -not $Templates) { $App = $true; $Templates = $true }

Write-Host ""
Write-Host "============================================="
Write-Host "  Forge-Pro Vercel Deployment"
Write-Host "============================================="
Write-Host ""

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI not found. Install: npm i -g vercel" -ForegroundColor Red
    exit 1
}

try { $user = vercel whoami 2>&1 } catch { $user = "" }
if (-not $user) {
    Write-Host "Not logged in. Running vercel login..." -ForegroundColor Yellow
    vercel login
}
Write-Host "Logged in as: $user" -ForegroundColor Green
Write-Host ""

function Deploy-Project {
    param([string]$Name, [string]$Dir)
    
    Write-Host "--- Deploying: $Name ---" -ForegroundColor Cyan
    Write-Host "Directory: $Dir" -ForegroundColor Cyan
    
    if ($DryRun) {
        Write-Host "[DRY RUN] Would deploy $Name" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    Push-Location $Dir
    try {
        $result = vercel --yes --prod 2>&1
        foreach ($line in $result) {
            if ($line -match "https://") {
                Write-Host "  $line" -ForegroundColor Green
            }
            if ($line -match "Ready in") {
                Write-Host "  $line" -ForegroundColor Green
            }
        }
    } finally {
        Pop-Location
    }
    Write-Host ""
}

if ($App) {
    Write-Host "=== Deploying Main App ===" -ForegroundColor Green
    Deploy-Project -Name "forge-pro" -Dir (Join-Path $root "apps\app")
}

if ($Templates) {
    Write-Host "=== Deploying 10 Templates ===" -ForegroundColor Green
    Write-Host ""
    
    @("nimbus","atlas","lumen","studio","forge","pulse","sage","mesa","ledger","quill") | ForEach-Object {
        $dir = Join-Path $root "templates\$_"
        if (Test-Path $dir) {
            Deploy-Project -Name $_ -Dir $dir
        } else {
            Write-Host "  $_ not found - skipping" -ForegroundColor Yellow
        }
    }
}

Write-Host "============================================="
Write-Host "  Done!"
Write-Host "============================================="
Write-Host ""
