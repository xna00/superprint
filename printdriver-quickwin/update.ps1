Remove-Item "$env:TEMP\QuickSuperPrint_*.exe" -Force -ErrorAction SilentlyContinue
$t = (Get-Date -Format 'yyyyMMddHHmmss')
$tmp = "$env:TEMP\QuickSuperPrint_$t.exe"
$urls = @(
    "https://superprint6.xna00.top/printdriver/QuickSuperPrint.exe?t=$t",
    "https://superprint.xna00.top/printdriver/QuickSuperPrint.exe?t=$t"
)
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $ok = $false
    foreach ($url in $urls) {
        try { Invoke-WebRequest -Uri $url -OutFile $tmp; $ok = $true; break } catch {}
    }
    if (-not $ok) { throw '所有下载地址均失败' }
    Start-Process -FilePath $tmp
} catch {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message)
}
