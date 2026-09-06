import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const modulePath = process.env.DREATIVE_DIST
  ? path.join(path.dirname(path.resolve(process.env.DREATIVE_DIST)), 'motionCapture.js')
  : path.resolve('C:/Users/lty/Downloads/Dreative/dist/cli/motionCapture.js')

// Post-build measurement is identical for all arms. It does not enter the prompt.
export async function capturePlayback(url, outDir) {
  if (!fs.existsSync(modulePath)) throw new Error(`motion capture unavailable: build Dreative at ${modulePath}`)
  const { runMotionCapture } = await import(pathToFileURL(modulePath).href)
  return runMotionCapture(url, outDir)
}
