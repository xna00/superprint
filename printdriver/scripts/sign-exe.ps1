# Signing script
# Signs exe files with self-signed certificate

param(
    [string[]]$ExePaths = @("..\build\PrintDriver.exe", "..\output\SupermanPrint-Setup.exe"),
    [string]$PfxPath = "..\cert\PrintDriver.pfx",
    [string]$Password = "PrintDriver2024"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not [System.IO.Path]::IsPathRooted($PfxPath)) {
    $PfxPath = Join-Path $scriptDir $PfxPath
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PrintDriver Code Signing Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not (Test-Path $PfxPath)) {
    Write-Host "Error: PFX file not found: $PfxPath" -ForegroundColor Red
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
    exit 1
}

Write-Host "Using signtool: $signtool" -ForegroundColor Green

# Sign each file
foreach ($ExePath in $ExePaths) {
    $fullPath = $ExePath
    if (-not [System.IO.Path]::IsPathRooted($fullPath)) {
        $fullPath = Join-Path $scriptDir $fullPath
    }
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "Skipping (not found): $fullPath" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Signing $fullPath..." -ForegroundColor Green
    
    $signArgs = @(
        "sign",
        "/f", $PfxPath,
        "/p", $Password,
        "/fd", "sha256",
        $fullPath
    )
    
    $result = & $signtool $signArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Done" -ForegroundColor Green
    } else {
        Write-Host "Error: Signing failed for $fullPath" -ForegroundColor Red
        Write-Host $result
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
