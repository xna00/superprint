$exe = "$env:LOCALAPPDATA\SuperPrint\QuickSuperPrint.exe"
if (Test-Path $exe) {
    Remove-Item "$exe.old" -Force -ErrorAction SilentlyContinue
    Rename-Item $exe "$exe.old" -Force -ErrorAction SilentlyContinue
    if (Test-Path $exe) {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show('超人打印正在运行，请先退出后再更新')
        exit 1
    }
}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$t = (Get-Date -f 'yyyyMMddHHmmss')
$urls = @(
    "https://superprint6.xna00.top/printdriver/QuickSuperPrint.exe?t=$t",
    "https://superprint.xna00.top/printdriver/QuickSuperPrint.exe?t=$t"
)
$ok = $false
foreach ($url in $urls) {
    try { Invoke-WebRequest -Uri $url -OutFile $exe; $ok = $true; break } catch {}
}
if (-not $ok) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show('更新失败，请检查网络连接')
    exit 1
}
Start-Process -FilePath $exe
