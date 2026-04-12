# Signing script
# Signs exe files with self-signed certificate

param(
    [string]$ExePath = "..\build\PrintDriver.exe",
    [string]$PfxPath = "..\cert\PrintDriver.pfx",
    [string]$Password = "PrintDriver2024",
    [string]$TimestampUrl = "",
    [switch]$NoTimestamp
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not [System.IO.Path]::IsPathRooted($ExePath)) {
    $ExePath = Join-Path $scriptDir $ExePath
}
if (-not [System.IO.Path]::IsPathRooted($PfxPath)) {
    $PfxPath = Join-Path $scriptDir $PfxPath
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PrintDriver Code Signing Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if files exist
if (-not (Test-Path $ExePath)) {
    Write-Host "Error: exe file not found: $ExePath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $PfxPath)) {
    Write-Host "Error: PFX file not found: $PfxPath" -ForegroundColor Red
    Write-Host "Please run create-cert.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Find signtool
$signtoolPaths = @(
    "C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe",
    "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe",
    "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22000.0\x64\signtool.exe",
    "C:\Program Files (x86)\Windows Kits\10\bin\*\x64\signtool.exe"
)

$signtool = $null
foreach ($path in $signtoolPaths) {
    if ($path -like "*\*\*") {
        $found = Get-Item $path -ErrorAction SilentlyContinue | Select-Object -Last 1
        if ($found) {
            $signtool = $found.FullName
            break
        }
    } elseif (Test-Path $path) {
        $signtool = $path
        break
    }
}

if (-not $signtool) {
    Write-Host "Error: signtool.exe not found" -ForegroundColor Red
    Write-Host "Please install Windows SDK" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using signtool: $signtool" -ForegroundColor Green
Write-Host "Signing file: $ExePath" -ForegroundColor Green

# Execute signing (without timestamp for self-signed cert)
$signArgs = @(
    "sign",
    "/f", $PfxPath,
    "/p", $Password,
    "/fd", "sha256",
    $ExePath
)

Write-Host "`nSigning..." -ForegroundColor Yellow
$result = & $signtool $signArgs 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Signing successful!" -ForegroundColor Green
    
    Write-Host "`nVerifying signature..." -ForegroundColor Yellow
    $verifyArgs = @("verify", "/pa", $ExePath)
    & $signtool $verifyArgs 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Signature verification passed!" -ForegroundColor Green
    } else {
        Write-Host "Signature verification failed (self-signed cert is normal)" -ForegroundColor Yellow
    }
} else {
    Write-Host "Signing failed:" -ForegroundColor Red
    Write-Host $result
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
