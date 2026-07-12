import * as win from 'win'
import * as gui from 'gui'
import { ffiCall, bufferPtr, FFI_TYPE_UINT32, FFI_TYPE_POINTER, FFI_TYPE_SINT32 } from 'ffi'
import { strToWideBuf, decodeWideAtPtr } from './utils.js'

const _advapi32 = win.LoadLibrary('advapi32.dll')
const _kernel32 = win.LoadLibrary('kernel32.dll')

const RegOpenKeyExW = _advapi32 ? win.GetProcAddress(_advapi32, 'RegOpenKeyExW') : null
const RegQueryValueExW = _advapi32 ? win.GetProcAddress(_advapi32, 'RegQueryValueExW') : null
const RegCloseKey = _advapi32 ? win.GetProcAddress(_advapi32, 'RegCloseKey') : null
const GetComputerNameW = _kernel32 ? win.GetProcAddress(_kernel32, 'GetComputerNameW') : null

const HKEY_LOCAL_MACHINE = gui.HKey.LOCAL_MACHINE
const KEY_READ = gui.RegAccess.READ

export function getDeviceId(): string | null {
    if (!RegOpenKeyExW || !RegQueryValueExW || !RegCloseKey) {
        console.log('[device] ffi functions not available')
        return null
    }

    const keyBuf = new ArrayBuffer(8)
    const subKeyBuf = strToWideBuf('SOFTWARE\\Microsoft\\Cryptography')

    const ret = ffiCall(
        RegOpenKeyExW,
        [
            FFI_TYPE_UINT32,
            FFI_TYPE_POINTER,
            FFI_TYPE_UINT32,
            FFI_TYPE_UINT32,
            FFI_TYPE_POINTER,
        ],
        [HKEY_LOCAL_MACHINE, subKeyBuf, 0, KEY_READ, keyBuf],
        FFI_TYPE_SINT32
    )

    console.log('[device] RegOpenKeyExW ret:', ret)
    if (ret !== 0) return null

    const keyDv = new DataView(keyBuf)
    const hKey = keyDv.getUint32(0, true)
    console.log('[device] hKey:', hKey)

    const nameBuf = strToWideBuf('MachineGuid')
    const typeBuf = new ArrayBuffer(4)
    const sizeBuf = new ArrayBuffer(4)
    const sizeDv = new DataView(sizeBuf)
    sizeDv.setUint32(0, 512, true)
    const dataBuf = new ArrayBuffer(512)

    const ret2 = ffiCall(
        RegQueryValueExW,
        [
            FFI_TYPE_UINT32,
            FFI_TYPE_POINTER,
            FFI_TYPE_POINTER,
            FFI_TYPE_POINTER,
            FFI_TYPE_POINTER,
            FFI_TYPE_POINTER,
        ],
        [hKey, nameBuf, null, typeBuf, dataBuf, sizeBuf],
        FFI_TYPE_SINT32
    )

    console.log('[device] RegQueryValueExW ret:', ret2)

    ffiCall(RegCloseKey, [FFI_TYPE_UINT32], [hKey], FFI_TYPE_SINT32)

    if (ret2 !== 0) return null

    const bytesRead = sizeDv.getUint32(0, true)
    console.log('[device] bytesRead:', bytesRead)
    const charCount = Math.floor(bytesRead / 2)
    const result = decodeWideAtPtr(bufferPtr(dataBuf))
    console.log('[device] result:', result)
    return result
}

export function getComputerName(): string | null {
    if (!GetComputerNameW) return null

    const sizeBuf = new ArrayBuffer(4)
    const sizeArr = new Uint32Array(sizeBuf)
    sizeArr[0] = 256
    const nameBuf = new ArrayBuffer(512)

    const ret = ffiCall(
        GetComputerNameW,
        [FFI_TYPE_POINTER, FFI_TYPE_POINTER],
        [nameBuf, sizeBuf],
        FFI_TYPE_SINT32
    )

    if (ret === 0) return null

    return decodeWideAtPtr(bufferPtr(nameBuf))
}
