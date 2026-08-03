/**
 * Packs a set of square PNGs into a single multi-resolution .ico file.
 * PNG-compressed ICO entries are understood by every browser we target.
 *
 * Usage: node scripts/build-ico.mjs out.ico in-16.png in-32.png in-48.png
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [out, ...sources] = process.argv.slice(2)

if (!out || sources.length === 0) {
  console.error('usage: node scripts/build-ico.mjs <out.ico> <png...>')
  process.exit(1)
}

/** Reads width/height from a PNG IHDR chunk. */
function pngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

const images = sources.map(file => {
  const data = readFileSync(file)
  return { data, ...pngSize(data) }
})

const HEADER = 6
const ENTRY = 16
const header = Buffer.alloc(HEADER)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(images.length, 4)

let offset = HEADER + ENTRY * images.length
const entries = images.map(({ data, width, height }) => {
  const entry = Buffer.alloc(ENTRY)
  entry.writeUInt8(width >= 256 ? 0 : width, 0)
  entry.writeUInt8(height >= 256 ? 0 : height, 1)
  entry.writeUInt8(0, 2) // palette size
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // colour planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(data.length, 8)
  entry.writeUInt32LE(offset, 12)
  offset += data.length
  return entry
})

writeFileSync(out, Buffer.concat([header, ...entries, ...images.map(i => i.data)]))
console.log(`wrote ${out} (${images.map(i => i.width).join(', ')})`)
