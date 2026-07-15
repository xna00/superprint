import 'quickwin/lib/polyfill.js'
import * as os from 'os'
import * as std from 'std'

const parent = os.Worker.parent
parent.onmessage = async (e) => {
    parent.onmessage = null
    const { filePath } = e.data
    const f = std.open(filePath, 'rb')
    if (!f) { parent.postMessage({ hash: '' }); return }
    try {
        f.seek(0, 2); const size = f.tell(); f.seek(0, 0)
        const buf = new ArrayBuffer(size); f.read(buf, 0, size)
        const hashBuf = await crypto.subtle.digest('SHA-1', buf)
        const hash = Array.from(new Uint8Array(hashBuf))
            .map(b => b.toString(16).padStart(2, '0')).join('')
        parent.postMessage({ hash })
    } catch { parent.postMessage({ hash: '' }) }
}
