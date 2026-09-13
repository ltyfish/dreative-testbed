import { DESIGN_PROTOCOL, selectedDesign } from './design-directions.mjs'
import fs from 'node:fs'
import path from 'node:path'

// Identical protocol for all arms. Version it separately from the skill.
export const PROTOTYPE_PHASE = `
VISUAL DIRECTION GATE — phase 1 of 2. Do not implement the website yet.

Generate multiple materially different page design images (normally two or three), each
with a concrete plan. Explore composition, typography, imagery and structure through the
working middle and ending, not palette variants of one hero. Inspect the actual generated
images. Use supplied subject material and preserve the brief's real content and behavior.
For each option explain the primary journey, asset sourcing/generation, mobile adaptation,
implementation approach, motion/scroll ideas where useful, uncertainties and relative cost.
Recommend one with a reason in its plan; do not choose it on the reviewer's behalf.

Save the actual PNG/JPEG/WebP mockups under design/ in this run directory, and write
design-directions.json with this exact transport shape (replace the examples):
{"version":1,"directions":[{"id":"direction-a","title":"First direction","images":["design/a.png"],"plan":"Concrete plan for this direction"},{"id":"direction-b","title":"Second direction","images":["design/b.png"],"plan":"Concrete plan for this direction"}]}
Use multiple related images per direction when necessary. The testbed displays these
files and plans directly; no coded gallery, site build or delivery finalization is needed
in phase one. Do not change src/ to implement a direction. A prompt or source URL is not
a generated mockup. Discover actual image-generation capability. If unavailable, record
the precise blocker in design-blocker.md and end the turn; do not fake images or skip
selection. The reviewer can supply visual alternatives before resuming the gate.

Stop after presenting the direction images and plans. Wait for an explicit selection.
The same session will receive the selected id, image paths, plan and feedback in phase two.`

// Kept for recovery of historical runs made under the coded-slice protocol.
export const CONTINUE_PHASE = `The demonstrated prototype slice was accepted. Complete the route now.
Preserve its accepted visual intent, reuse successful material and implementation, and
complete the primary task, unresolved passages and ending. Inspect the full desktop/mobile
route, normal and reduced motion, fix visible defects, and run the applicable delivery checks.`

export function continuationPrompt(runDir) {
  const meta = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'))
  if (meta.phaseProtocol !== DESIGN_PROTOCOL) return CONTINUE_PHASE
  const d = selectedDesign(runDir)
  return `VISUAL DIRECTION SELECTED — phase 2 of 2. Implement the selected design now.

Selected id: ${d.id}
Title: ${d.title}
Design image paths (open and inspect these actual files): ${d.images.join(', ')}
Plan: ${d.plan}
User changes: ${d.feedback || 'No additional changes.'}
Other direction images and plans remain in design-directions.json. Consult them when the
user's feedback explicitly combines parts of different options; retain the selected base.

Preserve the selected composition, subject scale, typography, structure and visual character.
Source/generate usable separate assets; keep text and controls live. Build in the real app.
Compare a representative composition and its adjacent region with the selected image before
extending the route. Use motion, scroll animation or spatial mechanisms when they serve this
design and the brief. Prototype uncertain mechanisms with real material and destinations;
a still does not demonstrate timing. This is not another automatic approval stop.

Inspect the full route and matching reference states at desktop and mobile, test the primary
task and motion/reduced motion, and correct visible discrepancies. Do not change the reference
images to match weak implementation. Disclose material deviations. Run npm run build and
applicable delivery checks before reporting implementation complete.`
}

export const RETRY_PHASE = `Revise the visual directions using the reviewer's feedback.
Update the affected design images and plans, preserve the requested content and ambition,
then stop again for selection. Do not implement the website before a direction is selected.`
