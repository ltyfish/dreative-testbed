// The loom: samples a garment image on a warp/weft grid whose cell size is the only
// thing that changes. At a coarse cell you are looking at the cloth thread by thread;
// as the cell falls to one pixel the same image resolves into the garment itself.
// Each quad is positioned from a measured DOM rectangle, so the scene lands exactly
// where the shop's markup already is.

const VERT = `#version 300 es
in vec2 a_pos;
uniform vec4 u_rect;      // x, y, w, h in CSS pixels, top-left origin
uniform vec2 u_res;
out vec2 v_a;             // 0..1 within the rect
void main() {
  v_a = a_pos;
  vec2 px = u_rect.xy + a_pos * u_rect.zw;
  vec2 clip = vec2(px.x / u_res.x * 2.0 - 1.0, 1.0 - px.y / u_res.y * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
in vec2 v_a;
out vec4 outColor;

uniform sampler2D u_tex;
uniform vec4 u_rect;
uniform vec2 u_texSize;
uniform vec2 u_focal;
uniform float u_zoom;     // 1.0 = whole garment in frame; higher = into the cloth
uniform float u_cell;     // weave cell, in CSS pixels
uniform float u_amp;      // how much the threads still ride over and under
uniform float u_alpha;
uniform float u_dpr;
uniform float u_grain;

const float PI = 3.14159265;

// uv for a point in the rect, at the current zoom, fitting the garment when zoom = 1
vec2 uvAt(vec2 a) {
  float ra = u_rect.z / u_rect.w;
  float ta = u_texSize.x / u_texSize.y;
  vec2 range = ra > ta ? vec2(ra / ta, 1.0) : vec2(1.0, ta / ra);
  return u_focal + (a - 0.5) * range / u_zoom;
}

void main() {
  vec2 rectPx = u_rect.zw;
  vec2 px = v_a * rectPx;
  float cell = max(u_cell, 0.75);

  // how many texels one screen pixel covers right now: picks the mip that matches
  // the cell, so a coarse weave is a box average of the cloth, never aliased noise
  float ra = u_rect.z / u_rect.w;
  float ta = u_texSize.x / u_texSize.y;
  vec2 range = ra > ta ? vec2(ra / ta, 1.0) : vec2(1.0, ta / ra);
  float texelsPerPx = (u_texSize.x * range.x / u_zoom) / rectPx.x;
  float lodCoarse = max(0.0, log2(max(texelsPerPx * cell, 1.0)));
  float lodSharp = max(0.0, log2(max(texelsPerPx / u_dpr, 1.0)));

  vec2 cellId = floor(px / cell);
  vec2 f = fract(px / cell);

  // warp and weft alternate over and under; each thread also shifts along itself,
  // which is what stops the coarse state reading as a screen of square pixels
  float over = mod(cellId.x + cellId.y, 2.0);
  vec2 shift = over > 0.5
    ? vec2(0.0, sin(cellId.x * 1.73 + 0.7) * 0.42)
    : vec2(sin(cellId.y * 1.31) * 0.42, 0.0);
  // a yarn carries colour continuously along its own length and is quantised only
  // across its width, which is what separates cloth from a grid of squares
  vec2 threadPx = over > 0.5
    ? vec2((cellId.x + 0.5) * cell, px.y)
    : vec2(px.x, (cellId.y + 0.5) * cell);
  vec2 samplePx = mix(px, threadPx + shift * cell, u_amp);

  vec4 coarse = textureLod(u_tex, uvAt(samplePx / rectPx), lodCoarse);

  // the yarn on top is round: it catches light across its width and dips where it
  // crosses under its neighbour
  float across = over > 0.5 ? f.x : f.y;
  float along  = over > 0.5 ? f.y : f.x;
  float roundness = pow(max(sin(across * PI), 0.0), 0.55);
  float dip = 0.90 + 0.16 * sin(along * PI);
  float shade = mix(1.0, (0.52 + 0.72 * roundness) * dip, u_amp);
  // the gap between threads shows the ground through the cloth
  float gap = smoothstep(0.0, 0.13, min(across, 1.0 - across));
  float openness = mix(1.0, 0.52 + 0.48 * gap, u_amp * 0.85);

  vec4 sharp = textureLod(u_tex, uvAt(v_a), lodSharp);

  float toSharp = 1.0 - smoothstep(0.9, 2.6, cell);
  vec4 col = mix(coarse, sharp, toSharp);
  col.rgb *= mix(1.0, shade, 1.0 - toSharp);
  // a cell is cloth or it is not: quantising alpha keeps the coarse state woven
  // instead of hazy where the garment meets the ground
  col.a = mix(smoothstep(0.30, 0.62, col.a), col.a, toSharp);
  col.a *= mix(1.0, openness, 1.0 - toSharp);

  // a little loom dust, strongest while the weave is open
  float g = fract(sin(dot(px + cellId, vec2(12.9898, 78.233))) * 43758.5453);
  col.rgb += (g - 0.5) * 0.05 * u_grain * u_amp;

  outColor = vec4(col.rgb, col.a * u_alpha);
}`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}

export function createLoom(canvas) {
  // one context per canvas: React can mount this effect twice, and a second
  // getContext on the same element would hand back the first, already torn-down one
  const gl = canvas.__loomGl || canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false })
  if (!gl) return null
  canvas.__loomGl = gl

  const prog = gl.createProgram()
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'a_pos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const U = {}
  for (const n of ['u_rect', 'u_res', 'u_texSize', 'u_focal', 'u_zoom', 'u_cell', 'u_amp', 'u_alpha', 'u_dpr', 'u_grain']) {
    U[n] = gl.getUniformLocation(prog, n)
  }

  gl.enable(gl.BLEND)
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  const textures = new Map()
  let dpr = 1, W = 0, H = 0

  function loadTexture(key, image) {
    const t = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    textures.set(key, { tex: t, w: image.width, h: image.height })
  }

  function resize(w, h, ratio) {
    dpr = ratio; W = w; H = h
    canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio)
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
    gl.viewport(0, 0, canvas.width, canvas.height)
  }

  // quads: { key, rect:[x,y,w,h], focal:[u,v], zoom, cell, amp, alpha, grain }
  function render(quads) {
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(U.u_res, W, H)
    gl.uniform1f(U.u_dpr, dpr)
    for (const q of quads) {
      const t = textures.get(q.key)
      if (!t || q.alpha <= 0.002 || q.rect[2] <= 0 || q.rect[3] <= 0) continue
      gl.bindTexture(gl.TEXTURE_2D, t.tex)
      gl.uniform4f(U.u_rect, q.rect[0], q.rect[1], q.rect[2], q.rect[3])
      gl.uniform2f(U.u_texSize, t.w, t.h)
      gl.uniform2f(U.u_focal, q.focal[0], q.focal[1])
      gl.uniform1f(U.u_zoom, q.zoom)
      gl.uniform1f(U.u_cell, q.cell)
      gl.uniform1f(U.u_amp, q.amp)
      gl.uniform1f(U.u_alpha, q.alpha)
      gl.uniform1f(U.u_grain, q.grain ?? 1)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
  }

  function dispose() {
    for (const { tex } of textures.values()) gl.deleteTexture(tex)
    textures.clear()
    gl.deleteBuffer(buf); gl.deleteProgram(prog)
  }

  return { loadTexture, resize, render, dispose }
}
