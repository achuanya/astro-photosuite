import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { createGzip, constants as zlibConstants } from 'node:zlib'
import { brotliCompress } from 'node:zlib'

const DIST_DIR = join(process.cwd(), 'dist')

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else yield p
  }
}

function isCompressible(file) {
  if (!/\.(css|js)$/i.test(file)) return false
  if (/\.d\.ts$/i.test(file)) return false
  if (/\.map$/i.test(file)) return false
  return true
}

async function gzipFile(inputPath) {
  const outputPath = inputPath + '.gz'
  const data = await fs.readFile(inputPath)
  const gzip = createGzip({ level: zlibConstants.Z_BEST_COMPRESSION })
  const chunks = []
  return new Promise((resolve, reject) => {
    gzip.on('data', (c) => chunks.push(c))
    gzip.on('error', reject)
    gzip.on('end', async () => {
      await fs.writeFile(outputPath, Buffer.concat(chunks))
      resolve()
    })
    gzip.end(data)
  })
}

async function brotliFile(inputPath) {
  const outputPath = inputPath + '.br'
  const data = await fs.readFile(inputPath)
  const options = {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
    },
  }
  return new Promise((resolve, reject) => {
    brotliCompress(data, options, async (err, out) => {
      if (err) return reject(err)
      await fs.writeFile(outputPath, out)
      resolve()
    })
  })
}

async function main() {
  try {
    await fs.access(DIST_DIR)
  } catch {
    console.error('dist folder not found, skipping precompression')
    return
  }

  const files = []
  for await (const p of walk(DIST_DIR)) files.push(p)
  const targets = files.filter(isCompressible)

  await Promise.all(
    targets.flatMap((f) => [gzipFile(f), brotliFile(f)])
  )

  console.log(`Precompressed ${targets.length} asset(s) in dist`)
}

main().catch((e) => {
  console.error('precompression failed:', e)
  process.exitCode = 1
})

