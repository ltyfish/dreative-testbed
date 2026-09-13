import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

// Observation only. This covers the scaffold's app/build inputs, not external
// services, env secrets, dependencies on disk, or an agent's interpretation.
export function sourceEvidence(runDir) {
  const files = {}
  const visit = (relative) => {
    const file = path.join(runDir, relative)
    if (!fs.existsSync(file)) return
    const stat = fs.lstatSync(file)
    if (stat.isSymbolicLink()) return
    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(file).sort()) visit(`${relative}/${child}`)
    } else if (stat.isFile()) {
      files[relative] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
    }
  }
  const roots = ['src', 'public', ...fs.readdirSync(runDir).filter((name) =>
    /^(index\.html|package(?:-lock)?\.json|vite\.config\.[cm]?[jt]s|tsconfig.*\.json)$/.test(name))]
  for (const root of roots.sort()) visit(root)
  return { inputHash: crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex'), files }
}

export function captureCorrespondence(capture, current) {
  if (!capture?.inputHash || !current?.inputHash) return 'unknown'
  if (capture.sourceChangedDuringCapture) return 'changed-during-capture'
  return capture.inputHash === current.inputHash ? 'matching' : 'different-source'
}
