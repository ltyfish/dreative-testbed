// The fabric stage.
//
// One WebGL surface, drawn from two real captured maps of a technical knit
// (ambientCG Fabric075, CC0 — a multi-angle photographic capture of a
// sportswear jersey). Everything on this page that shows the Contour's cloth is
// this same surface: the masthead, the six dye lots, the opacity test, the
// magnifications, the ground under the bag. One subject, many states.
//
// Four uniforms carry all of it:
//   uDye        the colourway currently selected
//   uScale      magnification, in weave repeats across the frame
//   uStretch    0 relaxed .. 1 at full squat — widens the loops, thins the wale
//   uBack       0 no light behind .. 1 the studio lamp at full

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `
precision highp float;

uniform sampler2D uAlbedo;
uniform sampler2D uNormal;
uniform vec3  uDye;
uniform vec2  uRes;
uniform float uScale;
uniform vec2  uOffset;
uniform vec2  uLight;
uniform float uStretch;
uniform float uBack;
uniform float uGrain;

varying vec2 vUv;

void main() {
  float aspect = uRes.x / max(uRes.y, 1.0);

  vec2 p = vUv;
  vec2 uv = vec2(p.x * aspect, p.y) * uScale + uOffset;

  // A knit under lateral tension: the courses open across the leg and the
  // wales draw in along it. The same cloth deformed, not a different picture.
  uv.x /= (1.0 + 1.90 * uStretch);
  uv.y *= (1.0 + 0.62 * uStretch);

  float lum = texture2D(uAlbedo, uv).r;
  // The capture is an even, low-contrast jersey; open it up so the yarn reads
  // at page size instead of averaging into a flat field.
  lum = clamp((lum - 0.47) * 2.15 + 0.44, 0.0, 1.0);
  // Opening the loops shows more of the shadow between them.
  lum = mix(lum, lum * lum, 0.55 * uStretch);

  vec3 n = texture2D(uNormal, uv).rgb * 2.0 - 1.0;
  n.y = -n.y;
  n = normalize(vec3(n.xy * 3.4 * (1.0 - 0.25 * uStretch), n.z));

  // A long raking light, not a spotlight: it travels across the cloth and
  // picks the relief out of it.
  vec2 lp = vec2(uLight.x * aspect, uLight.y);
  vec2 d = lp - vec2(p.x * aspect, p.y);
  vec3 L = normalize(vec3(d * 1.25, 0.55));
  float diff = max(dot(n, L), 0.0);
  float wash = 0.72 + 0.28 * exp(-2.2 * dot(d, d));

  // Fibre sheen: nylon catches light along the yarn, not as a point highlight.
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float sheen = pow(max(dot(n, H), 0.0), 18.0) * 0.42 * lum;

  vec3 base = uDye * (0.42 + 1.02 * lum);
  vec3 col = base * (0.62 + 0.95 * diff) * wash + sheen * uDye * 0.6 + sheen * 0.40;

  // Light behind the cloth. The thinnest crossings are where a sheer fabric
  // gives way; this one is graded so almost nothing comes through, which is
  // the recorded test result rather than a flattering guess.
  float thin = smoothstep(0.55, 1.0, lum);
  float through = pow(thin, 3.0) * 0.34 * uBack;
  col += uDye * through * 3.0 + vec3(through * 0.80);

  // One grade for every state of this surface.
  col = mix(col, col * vec3(1.04, 1.0, 0.95), 0.6);
  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * uGrain;

  gl_FragColor = vec4(col, 1.0);
}`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s)
    return null
  }
  return s
}

function makeTexture(gl, image) {
  const t = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, t)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.generateMipmap(gl.TEXTURE_2D)
  return t
}

let mapsPromise = null

export function loadMaps() {
  if (mapsPromise) return mapsPromise
  const small = typeof window !== 'undefined' && window.innerWidth < 760
  const load = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('could not load ' + src))
      img.src = src
    })
  mapsPromise = Promise.all([
    load(small ? '/media/fabric-albedo-1024.jpg' : '/media/fabric-albedo-2048.jpg'),
    load('/media/fabric-normal-1024.jpg'),
  ])
  return mapsPromise
}

// One bounded renderer per canvas. Owns its context, its textures and its
// teardown; nothing survives destroy().
export function createFabricSurface(canvas, maps) {
  const gl =
    canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }) ||
    canvas.getContext('experimental-webgl')
  if (!gl) return null

  const prog = gl.createProgram()
  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = {}
  for (const name of ['uAlbedo', 'uNormal', 'uDye', 'uRes', 'uScale', 'uOffset', 'uLight', 'uStretch', 'uBack', 'uGrain']) {
    u[name] = gl.getUniformLocation(prog, name)
  }

  const albedo = makeTexture(gl, maps[0])
  const normal = makeTexture(gl, maps[1])
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, albedo)
  gl.uniform1i(u.uAlbedo, 0)
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, normal)
  gl.uniform1i(u.uNormal, 1)

  let w = 0
  let h = 0

  function resize(cssW, cssH, dpr) {
    const ratio = Math.min(dpr || window.devicePixelRatio || 1, 1.5)
    const nw = Math.max(1, Math.round(cssW * ratio))
    const nh = Math.max(1, Math.round(cssH * ratio))
    if (nw === w && nh === h) return
    w = nw
    h = nh
    canvas.width = w
    canvas.height = h
    gl.viewport(0, 0, w, h)
  }

  function draw(p) {
    if (!w || !h) return
    gl.useProgram(prog)
    gl.uniform3f(u.uDye, p.dye[0], p.dye[1], p.dye[2])
    gl.uniform2f(u.uRes, w, h)
    gl.uniform1f(u.uScale, p.scale)
    gl.uniform2f(u.uOffset, p.offset ? p.offset[0] : 0, p.offset ? p.offset[1] : 0)
    gl.uniform2f(u.uLight, p.light[0], p.light[1])
    gl.uniform1f(u.uStretch, p.stretch || 0)
    gl.uniform1f(u.uBack, p.back || 0)
    gl.uniform1f(u.uGrain, p.grain == null ? 0.035 : p.grain)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function destroy() {
    gl.deleteTexture(albedo)
    gl.deleteTexture(normal)
    gl.deleteBuffer(buf)
    gl.deleteProgram(prog)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    const lose = gl.getExtension('WEBGL_lose_context')
    if (lose) lose.loseContext()
  }

  return { gl, resize, draw, destroy, get canvas() { return canvas } }
}

// Hex to linear-ish 0..1 triple, used for the dye lots.
export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
