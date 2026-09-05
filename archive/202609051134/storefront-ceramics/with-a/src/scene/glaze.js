import * as THREE from 'three'

// The three glazes as three materials, not three swatches. Each one implements
// the sentence the studio uses about it:
//   Ash      — "breaks to white where the form turns"      -> driven by aTurn
//   Iron Red — "darker where the glaze pools"              -> driven by aPool
//   Salt     — "a faint orange peel from the salt firing"  -> a real micro-bump
// Every piece also carries an unglazed foot (aFoot), which is the thing that
// marks a soft table, so it had better be visible on the object.

const CLAY = new THREE.Color('#9c7c60') // raw fired stoneware, the unglazed foot

const NOISE = /* glsl */`
float kwHash(vec3 p){ p = fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float kwNoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(kwHash(i+vec3(0,0,0)),kwHash(i+vec3(1,0,0)),f.x),
                 mix(kwHash(i+vec3(0,1,0)),kwHash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(kwHash(i+vec3(0,0,1)),kwHash(i+vec3(1,0,1)),f.x),
                 mix(kwHash(i+vec3(0,1,1)),kwHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float kwFbm(vec3 p){ return 0.55*kwNoise(p) + 0.3*kwNoise(p*2.3) + 0.15*kwNoise(p*5.1); }
`

export const GLAZE_SPEC = {
  ash: {
    swatch: '#8d9a8c',
    base: '#8b9689', broken: '#e2e3d4', pooled: '#4f5d54',
    roughness: [0.38, 0.58], clearcoat: 0.22, sheen: 0.0,
  },
  iron: {
    swatch: '#8a3a1e',
    base: '#7c3418', broken: '#bd7245', pooled: '#1b0e09',
    roughness: [0.30, 0.56], clearcoat: 0.30, sheen: 0.0,
  },
  salt: {
    swatch: '#e6e0d1',
    base: '#ddd0b3', broken: '#efe8d6', pooled: '#bda98a',
    roughness: [0.44, 0.66], clearcoat: 0.16, sheen: 0.25,
  },
}

export function makeGlazeMaterial(glazeId, seed = 0) {
  const spec = GLAZE_SPEC[glazeId]
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(spec.base),
    roughness: spec.roughness[0],
    metalness: 0,
    clearcoat: spec.clearcoat,
    clearcoatRoughness: 0.42,
    sheen: spec.sheen,
    sheenColor: new THREE.Color('#fff6e8'),
    envMapIntensity: 0.95,
  })
  mat.userData.uniforms = {
    uBase: { value: new THREE.Color(spec.base) },
    uBroken: { value: new THREE.Color(spec.broken) },
    uPooled: { value: new THREE.Color(spec.pooled) },
    uClay: { value: CLAY },
    uSeed: { value: seed },
    uPeel: { value: glazeId === 'salt' ? 1.6 : 0.2 },
    uRough: { value: new THREE.Vector2(spec.roughness[0], spec.roughness[1]) },
  }
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aTurn; attribute float aPool; attribute float aFoot;
        varying float vTurn; varying float vPool; varying float vFoot; varying vec3 vLocal;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vTurn = aTurn; vPool = aPool; vFoot = aFoot; vLocal = position;`)

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        ${NOISE}
        uniform vec3 uBase; uniform vec3 uBroken; uniform vec3 uPooled; uniform vec3 uClay;
        uniform float uSeed; uniform float uPeel; uniform vec2 uRough;
        varying float vTurn; varying float vPool; varying float vFoot; varying vec3 vLocal;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        // Glaze runs downward, around a form that is round: so the noise is
        // cylindrical (angle, height), never a cube of xyz. A grid-aligned
        // noise on a pot looks like woven cloth, which is not what fire does.
        float ang = atan(vLocal.z, vLocal.x);
        float hgt = vLocal.y;
        vec3 sp = vec3(cos(ang) * 1.9, sin(ang) * 1.9, uSeed * 9.3);
        float run = kwFbm(sp + vec3(0.0, 0.0, hgt * 0.012))
                  * 0.62 + kwNoise(vec3(sp.xy * 3.4, hgt * 0.05 + uSeed)) * 0.38;
        float pool = clamp(vPool * 1.2 + (run - 0.5) * 0.5, 0.0, 1.0);
        float turn = clamp(vTurn * 1.5 - (run - 0.5) * 0.4, 0.0, 1.0);
        vec3 glaze = uBase;
        glaze = mix(glaze, uPooled, smoothstep(0.26, 0.88, pool));
        glaze = mix(glaze, uBroken, smoothstep(0.10, 0.58, turn));
        float peel = kwNoise(vec3(cos(ang), sin(ang), hgt * 0.09) * 26.0 + uSeed * 5.0);
        glaze *= 1.0 + (peel - 0.5) * 0.07 * uPeel;
        // the foot: bare fired clay, the edge that marks a soft table
        vec3 clay = uClay * (0.88 + 0.22 * kwNoise(vLocal * 0.6 + 3.0));
        diffuseColor.rgb = mix(glaze, clay, vFoot);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        float ang2 = atan(vLocal.z, vLocal.x);
        float peelR = kwNoise(vec3(cos(ang2), sin(ang2), vLocal.y * 0.11) * 34.0 + uSeed * 7.0);
        roughnessFactor = mix(uRough.x, uRough.y, clamp(vPool * 0.55 + (peelR - 0.5) * 1.1 * uPeel + 0.22, 0.0, 1.0));
        roughnessFactor = mix(roughnessFactor, 0.95, vFoot);`)
  }
  mat.customProgramCacheKey = () => `kw-glaze-${glazeId}`
  return mat
}
