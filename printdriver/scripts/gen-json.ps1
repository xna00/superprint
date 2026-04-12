$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$versionLine = Select-String -Path "$scriptDir\..\src\version.h" -Pattern 'PROJECT_VERSION ' | Select-Object -First 1
if ($versionLine) {
    $version = $versionLine.Line -split '\s+' | Select-Object -Index 2
    $version = $version.Trim('"')
    $json = @{
        version = $version
        exe = 'PrintDriver.exe'
        setupexe = 'PrintDriver-Setup.exe'
    } | ConvertTo-Json -Depth 3
    [System.IO.File]::WriteAllText("$scriptDir\..\output\printdriver.json", $json, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Generated output\printdriver.json"
}
