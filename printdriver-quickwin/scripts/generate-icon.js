const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')
const { imagesToIco } = require('png-to-ico')

const svgPath = path.join(__dirname, '..', 'assets', 'icon.svg')
const icoPath = path.join(__dirname, '..', 'assets', 'icon.ico')
const sizes = [16, 32, 48, 64]

function parsePNG(buf) {
  const png = PNG.sync.read(buf)
  return { width: png.width, height: png.height, data: png.data }
}

async function main() {
  const svg = fs.readFileSync(svgPath)

  const pngs = await Promise.all(
    sizes.map(size =>
      sharp(svg)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  )

  const images = pngs.map(parsePNG)
  const ico = imagesToIco(images)
  fs.writeFileSync(icoPath, ico)
  console.log(`Generated ${icoPath} (${sizes.join(', ')}, ${ico.length} bytes)`)
}

main().catch(err => {
  console.error('generate-icon failed:', err)
  process.exit(1)
})