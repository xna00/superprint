const fs = require('fs')
const path = require('path')

const RT_ICON = 3
const RT_GROUP_ICON = 14

function align(v, a) { return (v + a - 1) & ~(a - 1) }

function setIcon(exeBuf, icoPath) {
  const icoBuf = fs.readFileSync(icoPath)
  const count = icoBuf.readUInt16LE(4)
  const icoEntries = []
  for (let i = 0; i < count; i++) {
    const off = 6 + i * 16
    const w = icoBuf.readUInt8(off) || 256
    const h = icoBuf.readUInt8(off + 1) || 256
    const size = icoBuf.readUInt32LE(off + 8)
    const dataOff = icoBuf.readUInt32LE(off + 12)
    icoEntries.push({ w, h, size, dataOff })
  }
  const iconData = icoBuf.subarray(6 + icoEntries.length * 16)

  const groupIconBuf = Buffer.alloc(6 + icoEntries.length * 14)
  groupIconBuf.writeUInt16LE(0, 0)
  groupIconBuf.writeUInt16LE(1, 2)
  groupIconBuf.writeUInt16LE(icoEntries.length, 4)
  for (let i = 0; i < icoEntries.length; i++) {
    const e = icoEntries[i]
    const off = 6 + i * 14
    groupIconBuf.writeUInt8(e.w === 256 ? 0 : e.w, off)
    groupIconBuf.writeUInt8(e.h === 256 ? 0 : e.h, off + 1)
    groupIconBuf.writeUInt8(0, off + 2)
    groupIconBuf.writeUInt8(0, off + 3)
    groupIconBuf.writeUInt16LE(1, off + 4)
    groupIconBuf.writeUInt16LE(32, off + 6)
    groupIconBuf.writeUInt32LE(e.size, off + 8)
    groupIconBuf.writeUInt16LE(i + 1, off + 12)
  }

  const e_lfanew = exeBuf.readUInt32LE(0x3C)
  const coff = e_lfanew + 4
  const numSections = exeBuf.readUInt16LE(coff + 2)
  const optHdr = coff + 20
  const magic = exeBuf.readUInt16LE(optHdr)
  const isPE32Plus = magic === 0x20b
  const dataDirStart = optHdr + (isPE32Plus ? 112 : 96)
  const secHdrStart = dataDirStart + 16 * 8
  const fileAlign = exeBuf.readUInt32LE(optHdr + 32)
  const sectionAlign = exeBuf.readUInt32LE(optHdr + 36)

  function readSection(i) {
    const s = secHdrStart + i * 40
    return {
      name: exeBuf.slice(s, s + 8).toString('ascii').replace(/\0+$/, ''),
      vsz: exeBuf.readUInt32LE(s + 8),
      va: exeBuf.readUInt32LE(s + 12),
      rsz: exeBuf.readUInt32LE(s + 16),
      roff: exeBuf.readUInt32LE(s + 20), idx: i
    }
  }
  const sections = []
  for (let i = 0; i < numSections; i++) sections.push(readSection(i))
  const rsrc = sections.find(s => s.name === '.rsrc')
  const reloc = sections.find(s => s.name === '.reloc')
  if (!rsrc || !reloc) throw new Error('.rsrc or .reloc section not found')

  const rsrcData = exeBuf.subarray(rsrc.roff, rsrc.roff + rsrc.rsz)

  function getManifest() {
    const root = (() => {
      const named = rsrcData.readUInt16LE(12)
      const id = rsrcData.readUInt16LE(14)
      for (let i = 0; i < named + id; i++) {
        const eo = 16 + i * 8
        if (rsrcData.readUInt32LE(eo) === 24) {
          return rsrcData.readUInt32LE(eo + 4) & 0x7FFFFFFF
        }
      }
      return null
    })()
    if (root === null) return null
    const named = rsrcData.readUInt16LE(root + 12)
    const id = rsrcData.readUInt16LE(root + 14)
    for (let i = 0; i < named + id; i++) {
      const eo = root + 16 + i * 8
      if (rsrcData.readUInt32LE(eo) === 1) {
        const idOff = rsrcData.readUInt32LE(eo + 4) & 0x7FFFFFFF
        const lnamed = rsrcData.readUInt16LE(idOff + 12)
        const lid = rsrcData.readUInt16LE(idOff + 14)
        for (let j = 0; j < lnamed + lid; j++) {
          const leo = idOff + 16 + j * 8
          if (!(rsrcData.readUInt32LE(leo + 4) & 0x80000000)) {
            const deOff = rsrcData.readUInt32LE(leo + 4) & 0x7FFFFFFF
            const rva = rsrcData.readUInt32LE(deOff)
            const size = rsrcData.readUInt32LE(deOff + 4)
            const fileOff = rva - rsrc.va + rsrc.roff
            return exeBuf.subarray(fileOff, fileOff + size)
          }
        }
      }
    }
    return null
  }

  const manifestData = getManifest()
  if (!manifestData) throw new Error('manifest not found')

  const rsrcVa = rsrc.va

  const dataBlocks = [
    { name: 'manifest', data: manifestData },
    { name: 'icon', data: iconData },
    { name: 'groupIcon', data: groupIconBuf },
  ]

  const typeIds = [24, RT_ICON, RT_GROUP_ICON]

  let dirCount = 0
  let dataEntryCount = 0
  for (const tid of typeIds) {
    dirCount += 2
    dataEntryCount += 1
  }
  dirCount += 1

  const dirSizes = []
  const dataEntrySizes = []
  dirSizes.push(16 + typeIds.length * 8)
  for (const tid of typeIds) {
    dirSizes.push(16 + 1 * 8)
    dirSizes.push(16 + 1 * 8)
    dataEntrySizes.push(16)
  }

  let dirsEnd = 0
  for (const s of dirSizes) dirsEnd += s
  for (const s of dataEntrySizes) dirsEnd += s
  dirsEnd = align(dirsEnd, 4)

  let dataStart = dirsEnd
  const dataSizes = []
  for (const db of dataBlocks) {
    dataSizes.push(dataStart)
    dataStart += db.data.length
  }

  const info = []
  let cur = 0
  const rootDirOff = cur
  info.push({ off: cur, size: dirSizes[0], isDir: true, name: 'root' })
  cur += dirSizes[0]

  const typeOffs = []
  const idOffs = []
  const dataEntryOffs = []
  for (let i = 0; i < typeIds.length; i++) {
    const typeOff = cur
    typeOffs.push(typeOff)
    info.push({ off: cur, size: dirSizes[1 + i * 2], isDir: true, name: `type${typeIds[i]}` })
    cur += dirSizes[1 + i * 2]

    const idOff = cur
    idOffs.push(idOff)
    info.push({ off: cur, size: dirSizes[1 + i * 2 + 1], isDir: true, name: `id${typeIds[i]}` })
    cur += dirSizes[1 + i * 2 + 1]

    const deOff = cur
    dataEntryOffs.push(deOff)
    info.push({ off: cur, size: dataEntrySizes[i], isDir: false, name: `de${typeIds[i]}` })
    cur += dataEntrySizes[i]
  }

  cur = align(cur, 4)
  const newRsrc = Buffer.alloc(cur + dataStart - dirsEnd, 0)

  function writeDir(off, entries) {
    const buf = newRsrc
    buf.writeUInt16LE(0, off + 12)
    buf.writeUInt16LE(entries.length, off + 14)
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]
      const eo = off + 16 + i * 8
      buf.writeUInt32LE(e.nameId, eo)
      buf.writeUInt32LE(e.isDir ? (e.offset + 0x80000000) : e.offset, eo + 4)
    }
  }

  writeDir(rootDirOff, [
    { nameId: 24, isDir: true, offset: typeOffs[0] },
    { nameId: RT_ICON, isDir: true, offset: typeOffs[1] },
    { nameId: RT_GROUP_ICON, isDir: true, offset: typeOffs[2] },
  ])

  for (let i = 0; i < typeIds.length; i++) {
    writeDir(typeOffs[i], [
      { nameId: 1, isDir: true, offset: idOffs[i] },
    ])
    writeDir(idOffs[i], [
      { nameId: 0, isDir: false, offset: dataEntryOffs[i] },
    ])
    const deOff = dataEntryOffs[i]
    newRsrc.writeUInt32LE(rsrcVa + dataSizes[i], deOff)
    newRsrc.writeUInt32LE(dataBlocks[i].data.length, deOff + 4)
    dataBlocks[i].data.copy(newRsrc, dataSizes[i])
  }

  const newRsrcVsz = align(newRsrc.length, sectionAlign)
  const newRsrcRsz = align(newRsrc.length, fileAlign)
  const delta = newRsrcRsz - rsrc.rsz
  const newRelocRoff = reloc.roff + delta
  const newRelocVa = rsrc.va + newRsrcVsz
  const newImageSize = align(newRelocVa + reloc.vsz, sectionAlign)

  const newBuf = Buffer.alloc(exeBuf.length + delta)
  exeBuf.copy(newBuf, 0, 0, rsrc.roff)
  newRsrc.copy(newBuf, rsrc.roff)
  exeBuf.copy(newBuf, rsrc.roff + newRsrcRsz, reloc.roff, exeBuf.length)

  for (let i = 0; i < numSections; i++) {
    const s = secHdrStart + i * 40
    if (i === rsrc.idx) {
      exeBuf.copy(newBuf, s, s, s + 8)
      newBuf.writeUInt32LE(newRsrcVsz, s + 8)
      newBuf.writeUInt32LE(rsrc.va, s + 12)
      newBuf.writeUInt32LE(newRsrcRsz, s + 16)
      newBuf.writeUInt32LE(rsrc.roff, s + 20)
      exeBuf.copy(newBuf, s + 24, s + 24, s + 40)
    } else if (i === reloc.idx) {
      exeBuf.copy(newBuf, s, s, s + 8)
      newBuf.writeUInt32LE(reloc.vsz, s + 8)
      newBuf.writeUInt32LE(newRelocVa, s + 12)
      newBuf.writeUInt32LE(reloc.rsz, s + 16)
      newBuf.writeUInt32LE(newRelocRoff, s + 20)
      exeBuf.copy(newBuf, s + 24, s + 24, s + 40)
    } else {
      exeBuf.copy(newBuf, s, s, s + 40)
    }
  }

  newBuf.writeUInt32LE(newImageSize, optHdr + 56)

  const rsrcDir = dataDirStart + 2 * 8
  newBuf.writeUInt32LE(rsrc.va, rsrcDir)
  newBuf.writeUInt32LE(newRsrc.length, rsrcDir + 4)

  const relocDir = dataDirStart + 5 * 8
  const relocDataRva = exeBuf.readUInt32LE(relocDir)
  if (relocDataRva) {
    newBuf.writeUInt32LE(newRelocVa, relocDir)
  }

  return newBuf
}

module.exports = { setIcon }

if (require.main === module) {
  const exe = process.argv[2]
  const ico = process.argv[3]
  const out = process.argv[4] || exe
  if (!exe || !ico) {
    console.error('usage: node set-icon.js <exe> <ico> [output]')
    process.exit(1)
  }
  const buf = fs.readFileSync(exe)
  const result = setIcon(buf, ico)
  fs.writeFileSync(out, result)
  console.log('icon set on', path.basename(out))
}