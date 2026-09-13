import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const DESIGN_PROTOCOL = 'visual-directions-v1'
export const DIRECTIONS_FILE = 'design-directions.json'

// A transport contract for the human selection UI, not a design-quality test.
export function readDirections(runDir) {
  const raw = fs.readFileSync(path.join(runDir, DIRECTIONS_FILE), 'utf8')
  const data = JSON.parse(raw)
  if (data.version !== 1 || !Array.isArray(data.directions) || data.directions.length < 2)
    throw new Error('Provide at least two visual directions in design-directions.json (version 1).')
  const ids = new Set()
  const hash = crypto.createHash('sha256').update(raw)
  const root = fs.realpathSync(runDir)
  const directions = data.directions.map((d) => {
    if (!d || typeof d.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(d.id) || ids.has(d.id))
      throw new Error('Each direction needs a unique lowercase id.')
    ids.add(d.id)
    if (typeof d.title !== 'string' || !d.title.trim() || typeof d.plan !== 'string' || !d.plan.trim())
      throw new Error(`Direction ${d.id} needs a title and implementation plan.`)
    if (!Array.isArray(d.images) || !d.images.length)
      throw new Error(`Direction ${d.id} needs an actual local design image.`)
    const images = d.images.map((relative) => {
      if (typeof relative !== 'string' || !/^design\/[\w./-]+\.(png|jpe?g|webp)$/i.test(relative))
        throw new Error(`Direction ${d.id}: images must be PNG, JPEG or WebP files under design/.`)
      const file = fs.realpathSync(path.resolve(root, relative))
      if (!file.startsWith(root + path.sep) || !file.startsWith(path.join(root, 'design') + path.sep))
        throw new Error('Design image escapes the run design directory.')
      const bytes = fs.readFileSync(file)
      // Reject prompts/HTML renamed to images. Browser decoding is checked in the UI.
      const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
      if (!(png || jpeg || webp)) throw new Error(`Not a recognizable image: ${relative}`)
      hash.update(relative).update(bytes)
      return relative
    })
    return { id: d.id, title: d.title, plan: d.plan, images }
  })
  return { directions, evidenceHash: hash.digest('hex') }
}

export function saveDesignSelection(runDir, { directionId, feedback = '', evidenceHash }) {
  const current = readDirections(runDir)
  if (current.evidenceHash !== evidenceHash) throw new Error('The designs changed. Reload and select the current version.')
  if (!current.directions.some((d) => d.id === directionId)) throw new Error('Select a displayed design direction before continuing.')
  if (typeof feedback !== 'string' || feedback.length > 12000) throw new Error('Selection feedback must be text under 12,000 characters.')
  const file = path.join(runDir, 'run.json')
  const meta = JSON.parse(fs.readFileSync(file, 'utf8'))
  const selection = { directionId, feedback, evidenceHash, selectedAt: new Date().toISOString() }
  fs.writeFileSync(file, JSON.stringify({ ...meta, designSelection: selection }, null, 2), 'utf8')
  return selection
}

export function selectedDesign(runDir) {
  const meta = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'))
  const selection = meta.designSelection
  if (!selection) throw new Error('A visual direction must be selected before implementation.')
  const current = readDirections(runDir)
  const direction = current.directions.find((d) => d.id === selection.directionId)
  if (!direction || current.evidenceHash !== selection.evidenceHash)
    throw new Error('The selected design changed. Return to the design gate before implementation.')
  return { ...direction, feedback: selection.feedback, evidenceHash: selection.evidenceHash }
}

const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function directionCards(runName, study) {
  return `<div class="design-directions" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px">${study.directions.map((d) => `
    <article style="min-width:0;border:1px solid #64748b;padding:16px">
      <label style="display:block;font-size:18px"><input type="radio" name="designDirection" value="${esc(d.id)}"> ${esc(d.title)}</label>
      ${d.images.map((_, i) => {
        const url = `/design-image?run=${encodeURIComponent(runName)}&direction=${encodeURIComponent(d.id)}&image=${i}`
        return `<a href="${esc(url)}" target="_blank" rel="noopener"><img data-design-image src="${esc(url)}" alt="${esc(d.title)} — design image ${i + 1}" style="display:block;width:100%;height:auto;margin:12px 0"></a>`
      }).join('')}
      <p style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(d.plan)}</p>
    </article>`).join('')}</div>
    <label for="designFeedback" style="display:block;margin-top:20px">Changes to include in the selected direction (optional)</label>
    <textarea id="designFeedback" maxlength="12000" rows="3" style="box-sizing:border-box;width:100%"></textarea>`
}
