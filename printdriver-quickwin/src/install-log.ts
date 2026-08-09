import * as std from 'std'

function encodeUtf8(s: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(s)
  const buf = new ArrayBuffer(bytes.length)
  new Uint8Array(buf).set(bytes)
  return buf
}

/** 双写日志：安装目录一份 + %TEMP% 一份（防安装目录被外部清空导致日志丢失）。 */
export function logInstall(line: string): void {
  const d = new Date()
  const pad = (n: number) => (n < 10 ? '0' + n : String(n))
  const ts = '' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
             ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) +
             '.' + String(d.getMilliseconds()).padStart(3, '0')
  const buf = encodeUtf8('[' + ts + '] ' + line + '\n')

  const la = std.getenv('LOCALAPPDATA') || ''
  const tmp = std.getenv('TEMP') || ''
  const paths: string[] = []
  if (la) paths.push(la + '\\SuperPrint\\install.log')
  if (tmp) paths.push(tmp + '\\superprint-install.log')

  for (const p of paths) {
    try {
      const f = std.open(p, 'ab')
      if (f) {
        f.write(buf, 0, buf.byteLength)
        f.close()
      }
    } catch (_) {}
  }
}
