import chokidar from 'chokidar'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { build } from 'tsup'
import sass from 'sass'

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'src')
const STYLES_ALTS_ENTRY = path.join(SRC_DIR, 'styles', 'image-alts.scss')
const STYLES_EXIF_ENTRY = path.join(SRC_DIR, 'styles', 'exif.scss')
const DIST_DIR = path.join(ROOT, 'dist')

async function ensureDist() {
  try {
    await fs.mkdir(DIST_DIR, { recursive: true })
  } catch {}
}

async function compileTS() {
  await ensureDist()
  try {
    await build({
      entry: ['src/photosuite.ts'],
      dts: true,
      format: ['esm'],
      outDir: 'dist',
      minify: true,
      clean: false,
      splitting: false,
    })
    console.log('[ts] Built dist/photosuite.js')
  } catch (e) {
    console.error('[ts] Build error:', e && e.message ? e.message : e)
  }
}

async function compileSCSS() {
  await ensureDist()
  try {
    const resAlts = sass.compile(STYLES_ALTS_ENTRY, { style: 'compressed' })
    const outAlts = path.join(DIST_DIR, 'image-alts.css')
    await fs.writeFile(outAlts, resAlts.css)
    console.log('[scss] Compiled dist/image-alts.css')

    const resExif = sass.compile(STYLES_EXIF_ENTRY, { style: 'compressed' })
    const outExif = path.join(DIST_DIR, 'exif.css')
    await fs.writeFile(outExif, resExif.css)
    console.log('[scss] Compiled dist/exif.css')
  } catch (e) {
    console.error('[scss] Compile error:', e && e.message ? e.message : e)
  }
}

function debounce(fn, ms = 200) {
  let t = null
  return (...args) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

const onTsChange = debounce(() => compileTS(), 300)
const onScssChange = debounce(() => compileSCSS(), 300)

async function main() {
  await compileTS()
  await compileSCSS()

  const watcher = chokidar.watch('src', {
    ignored: ['**/*.d.ts', '**/.DS_Store'],
    persistent: true,
    depth: 5,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 300 },
  })

  watcher.on('change', (p) => {
    if (p.endsWith('.ts')) return onTsChange()
    if (p.endsWith('.scss')) return onScssChange()
  })

  watcher.on('ready', () => console.log('[watch] Ready — watching src for changes'))
}

main().catch((e) => {
  console.error('[watch] fatal:', e)
  process.exitCode = 1
})
