/**
 * The resolution model behind the config workbench: the same four steps the
 * CLI documents — take root, expand include, subtract exclude, write output.
 */

export const SAMPLE_TREE = [
  { path: 'index.md' },
  { path: 'guide/install.md', warning: 'link → ./missing.md' },
  { path: 'guide/config.md' },
  { path: 'guide/_partial.md' },
  { path: 'notes/scratch.mdx' },
  { path: 'node_modules/marked/README.md' },
  { path: 'assets/logo.svg' },
]

export const INCLUDE_CHOICES = ['**/*.md', '**/*.mdx']
export const EXCLUDE_CHOICES = ['node_modules/**', '**/_*.md']
export const ROOT_CHOICES = ['.', 'guide']
export const OUTPUT_CHOICES = ['./dist', './build']

function globToRegExp(glob) {
  let out = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') {
          out += '(?:.*/)?'
          i += 2
        } else {
          out += '.*'
          i += 1
        }
      } else {
        out += '[^/]*'
      }
    } else if (c === '?') {
      out += '[^/]'
    } else if ('.+^${}()|[]\\'.includes(c)) {
      out += '\\' + c
    } else {
      out += c
    }
  }
  return new RegExp('^' + out + '$')
}

const cache = new Map()
function match(pattern, path) {
  if (!cache.has(pattern)) cache.set(pattern, globToRegExp(pattern))
  return cache.get(pattern).test(path)
}

/**
 * Returns one row per file in the sample tree, in tree order, plus the summary
 * line the status strip reads. Handles both degenerate cases: every file
 * matching, and none matching at all.
 */
export function resolve(config) {
  const { root, include, exclude, output, strict } = config
  const prefix = root === '.' ? '' : root + '/'

  const rows = SAMPLE_TREE.map((file) => {
    if (!file.path.startsWith(prefix)) {
      return { ...file, state: 'outside', detail: `outside ${root}/` }
    }
    const rel = file.path.slice(prefix.length)
    const included = include.some((p) => match(p, rel))
    if (!included) {
      return { ...file, rel, state: 'unmatched', detail: 'no include pattern' }
    }
    const hit = exclude.find((p) => match(p, rel))
    if (hit) return { ...file, rel, state: 'excluded', detail: `exclude ${hit}` }

    const target = `${output.replace(/^\.\//, '')}/${rel.replace(/\.mdx?$/, '.html')}`
    const failing = strict && Boolean(file.warning)
    return {
      ...file,
      rel,
      state: failing ? 'failing' : 'built',
      detail: failing ? `error ${file.warning}` : target,
    }
  })

  const built = rows.filter((r) => r.state === 'built').length
  const failed = rows.filter((r) => r.state === 'failing').length
  const warnings = rows.filter(
    (r) => (r.state === 'built' || r.state === 'failing') && r.warning,
  ).length

  return { rows, built, failed, warnings }
}
