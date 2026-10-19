import { WCHAR } from 'quickwin/lib/ffi/bind.js'
import { NULL, PtrArrayBuffer } from 'quickwin/lib/ffi/ctype.js'
import { RegOpenKeyEx, RegCloseKey, RegQueryValueEx } from 'quickwin/lib/windows/advapi32.js'
import { GetComputerName } from 'quickwin/lib/windows/kernel32.js'
import { HKey, RegAccess } from 'quickwin/constants'
import { logger } from './logger.js'
import { readPtr } from './utils.js'

let _deviceId: string | null = null
let _deviceIdCached = false

export function getDeviceId(): string | null {
    if (_deviceIdCached) return _deviceId
    _deviceId = getDeviceIdImpl()
    _deviceIdCached = true
    return _deviceId
}

function getDeviceIdImpl(): string | null {
    const keyBuf = new PtrArrayBuffer(8)
    const ret = RegOpenKeyEx(HKey.LOCAL_MACHINE, 'SOFTWARE\\Microsoft\\Cryptography', 0, RegAccess.READ, keyBuf)
    logger.log('[device] RegOpenKeyEx ret:', ret)
    if (ret !== 0) return null

    // HKEY 是 64 位指针，须跨架构读（getUint32 在 x64 会截断）
    const hKey = readPtr(new DataView(keyBuf), 0)

    const typeBuf = new PtrArrayBuffer(4)
    const sizeBuf = new PtrArrayBuffer(4)
    new Uint32Array(sizeBuf)[0] = 512
    const dataBuf = new PtrArrayBuffer(512)

    const ret2 = RegQueryValueEx(hKey, 'MachineGuid', NULL, typeBuf, dataBuf, sizeBuf)
    logger.log('[device] RegQueryValueEx ret:', ret2)
    RegCloseKey(hKey)

    if (ret2 !== 0) return null

    const result = WCHAR.decode(dataBuf)
    logger.log('[device] result:', result)
    return result
}

export function getComputerName(): string | null {
    const sizeBuf = new PtrArrayBuffer(4)
    new Uint32Array(sizeBuf)[0] = 256
    const nameBuf = new PtrArrayBuffer(512)

    if (GetComputerName(nameBuf, sizeBuf) === 0) return null
    return WCHAR.decode(nameBuf) || null
}
