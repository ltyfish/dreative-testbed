// Authored garment "flats" — technical drawings of the nine styles.
// Drawn, not photographed: they never imply a verified photograph of inventory.
// viewBox 0 0 200 300. c = { cloth, shade, ink }

const P = (d, extra = '') => `<path d="${d}" ${extra}/>`

// shared geometry -------------------------------------------------------
const BODY = 'M58 52 L66 104 L63 212 L137 212 L134 104 L142 52 Z'
const SLEEVE_L_LONG = 'M58 52 L30 66 L20 168 L50 178 L66 104 Z'
const SLEEVE_R_LONG = 'M142 52 L170 66 L180 168 L150 178 L134 104 Z'
const SLEEVE_L_SHORT = 'M58 52 L32 66 L24 122 L64 132 L66 104 Z'
const SLEEVE_R_SHORT = 'M142 52 L168 66 L176 122 L136 132 L134 104 Z'
const CUFF_L = 'M22 150 L51 160'
const CUFF_R = 'M178 150 L149 160'

const top = (c, { sleeves = 'long', body = BODY, neck = '', front = '', detail = '', buttons = [] } = {}) => `
  <g fill="${c.cloth}" stroke="${c.ink}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">
    ${P(sleeves === 'long' ? SLEEVE_L_LONG : SLEEVE_L_SHORT)}
    ${P(sleeves === 'long' ? SLEEVE_R_LONG : SLEEVE_R_SHORT)}
    ${P(body)}
    ${neck}
    ${front}
    <g fill="none">${sleeves === 'long' ? P(CUFF_L) + P(CUFF_R) : ''}${detail}</g>
    <g fill="${c.ink}" stroke="none">${buttons.map((y) => `<circle cx="95" cy="${y}" r="2.4"/>`).join('')}</g>
  </g>`

const placket = `<g fill="none"><path d="M100 62 L100 212"/><path d="M90 64 L90 212"/></g>`

export const FLATS = {
  // ---------- shirts ----------
  oxford: (c) =>
    top(c, {
      neck: P('M82 50 L100 68 L118 50 L122 41 L78 41 Z', `fill="${c.shade}"`),
      front: placket,
      detail: P('M68 122 h26 v28 h-26 z'),
      buttons: [86, 112, 138, 164, 190],
    }),

  tee: (c) =>
    top(c, {
      sleeves: 'short',
      neck: `<g fill="none"><path d="M78 50 Q100 76 122 50"/><path d="M81 55 Q100 79 119 55"/></g>`,
      detail: P('M63 204 L137 204'),
    }),

  // ---------- outerwear ----------
  chore: (c) =>
    top(c, {
      neck: P('M80 48 L100 66 L120 48 L120 37 L80 37 Z', `fill="${c.shade}"`),
      front: placket,
      detail: `${P('M63 92 L137 92')}${P('M68 118 h26 v30 h-26 z')}${P('M106 118 h26 v30 h-26 z')}${P('M72 162 h26 v34 h-26 z')}`,
      buttons: [78, 108, 138, 168, 198],
    }),

  overshirt: (c) =>
    top(c, {
      neck: P('M82 48 L100 66 L118 48 L126 39 L74 39 Z', `fill="${c.shade}"`),
      front: placket,
      detail: `${P('M68 122 h26 v7 h-26 z')}${P('M106 122 h26 v7 h-26 z')}${P('M63 204 L137 204')}`,
      buttons: [84, 114, 144, 174, 202],
    }),

  // ---------- knitwear ----------
  knit: (c) =>
    top(c, {
      body: 'M58 52 L66 104 L64 208 L136 208 L134 104 L142 52 Z',
      neck: P('M78 48 Q100 74 122 48 L122 38 Q100 62 78 38 Z', `fill="${c.shade}"`),
      detail:
        `<g opacity=".55">${P('M74 110 L74 196')}${P('M88 110 L88 196')}${P('M102 110 L102 196')}${P('M116 110 L116 196')}${P('M130 110 L130 196')}</g>` +
        P('M64 192 L136 192'),
    }),

  cardigan: (c) =>
    top(c, {
      neck: P('M76 46 L100 92 L124 46 L136 58 L110 108 L100 212 L90 108 L64 58 Z', `fill="${c.shade}"`),
      detail:
        `<g opacity=".5">${P('M72 118 L72 202')}${P('M82 124 L82 202')}${P('M118 124 L118 202')}${P('M128 118 L128 202')}</g>` +
        P('M63 206 L137 206'),
    }),

  // ---------- trousers ----------
  trouser: (c) => `
    <g fill="${c.cloth}" stroke="${c.ink}" stroke-width="1.7" stroke-linejoin="round">
      ${P('M52 30 L148 30 L146 60 L140 286 L108 286 L100 150 L92 286 L60 286 L54 60 Z')}
      ${P('M52 30 L148 30 L147 48 L53 48 Z', `fill="${c.shade}"`)}
      <g fill="none">
        ${P('M84 48 L90 190')}${P('M116 48 L110 190')}
        ${P('M100 48 L100 150')}
        ${P('M60 276 L92 276')}${P('M108 276 L140 276')}
        ${P('M58 56 q14 12 20 30')}${P('M142 56 q-14 12 -20 30')}
      </g>
      <g fill="${c.ink}" stroke="none"><circle cx="100" cy="39" r="2.4"/></g>
    </g>`,

  jean: (c) => `
    <g fill="${c.cloth}" stroke="${c.ink}" stroke-width="1.7" stroke-linejoin="round">
      ${P('M54 32 L146 32 L144 62 L138 288 L106 288 L100 154 L94 288 L62 288 L56 62 Z')}
      ${P('M54 32 L146 32 L145 50 L55 50 Z', `fill="${c.shade}"`)}
      <g fill="none" stroke-dasharray="4 3" opacity=".85">
        ${P('M68 58 h28 q0 24 -14 28 q-14 -4 -14 -28 z')}
        ${P('M104 58 h28 q0 24 -14 28 q-14 -4 -14 -28 z')}
        ${P('M100 50 L100 154')}
        ${P('M62 278 L94 278')}${P('M106 278 L138 278')}
        ${P('M55 50 L145 50')}
      </g>
      <g fill="${c.ink}" stroke="none"><circle cx="100" cy="41" r="2.3"/></g>
    </g>`,

  shorts: (c) => `
    <g fill="${c.cloth}" stroke="${c.ink}" stroke-width="1.7" stroke-linejoin="round">
      ${P('M52 60 L148 60 L150 92 L156 190 L108 190 L100 150 L92 190 L44 190 L50 92 Z')}
      ${P('M52 60 L148 60 L149 82 L51 82 Z', `fill="${c.shade}"`)}
      <g fill="none">
        ${P('M100 82 L100 150')}
        ${P('M47 180 L92 180')}${P('M108 180 L153 180')}
        ${P('M56 90 q12 10 16 26')}${P('M144 90 q-12 10 -16 26')}
        <g stroke-dasharray="3 3" opacity=".8">${P('M100 62 L100 80')}${P('M112 62 L112 80')}${P('M124 62 L124 80')}${P('M136 62 L136 80')}</g>
      </g>
      <g fill="${c.ink}" stroke="none"><circle cx="76" cy="71" r="2.3"/></g>
    </g>`,
}

export const PALETTES = {
  ink: { cloth: '#ded6c6', shade: '#c7bda9', ink: '#12151a' },
  paper: { cloth: '#f4eee2', shade: '#e3dbca', ink: '#1a1a18' },
}

// Inner SVG markup for one garment. Authored constants only — no user input reaches this.
export function flatMarkup(id, palette = PALETTES.paper) {
  const draw = FLATS[id]
  return draw ? draw(palette) : ''
}
