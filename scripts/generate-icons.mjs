/**
 * Generates PWA icon files from rocket.svg into public/.
 * Run once with: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const rocketSvg = readFileSync(resolve(root, 'rocket.svg'))

mkdirSync(resolve(root, 'public'), { recursive: true })

const icons = [
  { name: 'favicon.png',          size: 32,  padding: 0.08, transparent: true },
  { name: 'apple-touch-icon.png', size: 180, padding: 0.10 },
  { name: 'icon-192.png',         size: 192, padding: 0.10 },
  { name: 'icon-512.png',         size: 512, padding: 0.10 },
]

for (const { name, size, padding, transparent } of icons) {
  const rocketSize = Math.round(size * (1 - padding * 2))
  const offset = Math.round(size * padding)

  const rocketBuffer = await sharp(rocketSvg)
    .resize(rocketSize, rocketSize)
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: rocketBuffer, top: offset, left: offset }])
    .png()
    .toFile(resolve(root, 'public', name))

  console.log(`✓ public/${name}  (${size}×${size})`)
}
