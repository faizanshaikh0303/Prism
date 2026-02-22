import { useRef, useEffect } from 'react'
import * as THREE from 'three'

// ─── Stem Data ────────────────────────────────────────────────────────────────
export const STEMS = [
  { id: 'vocals',  name: 'Vocals',  color: '#F2B8D0', emissive: '#C47090', targetPos: [-1.55,  1.25,  0.15] as [number,number,number], geometry: 'octahedron'  },
  { id: 'bass',    name: 'Bass',    color: '#A8E6E2', emissive: '#4AABA5', targetPos: [ 1.55,  1.25,  0.15] as [number,number,number], geometry: 'torus'       },
  { id: 'guitar',  name: 'Guitar',  color: '#A8D8EA', emissive: '#4A9AB5', targetPos: [-2.10,  0.00,  0.08] as [number,number,number], geometry: 'tetrahedron' },
  { id: 'piano',   name: 'Piano',   color: '#FFF0A8', emissive: '#C0A840', targetPos: [ 2.10,  0.00,  0.08] as [number,number,number], geometry: 'box'         },
  { id: 'drums',   name: 'Drums',   color: '#FFBCB0', emissive: '#C06050', targetPos: [-1.55, -1.28,  0.15] as [number,number,number], geometry: 'cylinder'    },
  { id: 'other',   name: 'Other',   color: '#D4CCFF', emissive: '#7060CC', targetPos: [ 1.55, -1.28,  0.15] as [number,number,number], geometry: 'icosahedron' },
]

// Lineup: tidy 2 × 3 grid the shapes settle into during phase 2
export const LINEUP_POSITIONS: [number, number, number][] = [
  [-1.55,  0.70, 0.30], // vocals
  [ 0.00,  0.70, 0.30], // bass
  [ 1.55,  0.70, 0.30], // guitar
  [-1.55, -0.70, 0.30], // piano
  [ 0.00, -0.70, 0.30], // drums
  [ 1.55, -0.70, 0.30], // other
]
const LINEUP_SCALE = 0.52

// ─── Lerp ─────────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// ─── Background text canvas texture ───────────────────────────────────────────
async function buildTextTexture(): Promise<THREE.CanvasTexture> {
  await Promise.allSettled([
    document.fonts.load('300 120px Poppins'),
    document.fonts.load('400 120px Poppins'),
  ])
  await document.fonts.ready

  const W = 2048
  const H = 1024
  const cv = document.createElement('canvas')
  cv.width  = W
  cv.height = H
  const ctx = cv.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // PRISM — fit to ~36% of canvas width
  let fontSize = 600
  ctx.font = `300 ${fontSize}px Poppins, "Arial Black", Impact, sans-serif`
  const measured = ctx.measureText('PRISM').width
  fontSize = Math.floor(fontSize * (W * 0.36) / measured)
  ctx.font = `300 ${fontSize}px Poppins, "Arial Black", Impact, sans-serif`

  ctx.fillStyle    = '#000000'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('PRISM', W / 2, H * 0.53)

  // Tagline
  const tagSize = Math.floor(H * 0.022)
  ctx.font      = `300 ${tagSize}px Poppins, "Helvetica Neue", Arial, sans-serif`
  ctx.fillStyle = 'rgba(0,0,0,0.72)'
  ctx.letterSpacing = '0.20em'
  ctx.fillText('THE SAME SONG.  A WHOLE NEW DIMENSION.', W / 2, H * 0.66)

  // Linear gradient overlay — bottom-left transparent → top-right pitch black
  const lg = ctx.createLinearGradient(0, H, W, 0)
  lg.addColorStop(0,    'rgba(0,0,0,0)')
  lg.addColorStop(0.45, 'rgba(0,0,0,0.18)')
  lg.addColorStop(0.75, 'rgba(0,0,0,0.58)')
  lg.addColorStop(1,    'rgba(0,0,0,1)')
  ctx.fillStyle = lg
  ctx.fillRect(0, 0, W, H)

  const tex = new THREE.CanvasTexture(cv)
  tex.needsUpdate = true
  return tex
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PrismCanvasProps {
  isHovered:      boolean
  scrollProgress: number   // 0 → 1 over the hero scroll zone
  onHoverChange:  (v: boolean) => void
}
type StemState = {
  mesh: THREE.Mesh
  mat:  THREE.MeshStandardMaterial
  rotY: number
  rotX: number
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PrismCanvas({ isHovered, scrollProgress, onHoverChange }: PrismCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const propsRef  = useRef({ isHovered, scrollProgress, onHoverChange })

  useEffect(() => {
    propsRef.current = { isHovered, scrollProgress, onHoverChange }
  }, [isHovered, scrollProgress, onHoverChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const getSize = () => {
      const p = canvas.parentElement
      return { w: p?.clientWidth || window.innerWidth, h: p?.clientHeight || window.innerHeight }
    }
    const { w: iW, h: iH } = getSize()
    const safeW = iW  > 0 ? iW  : window.innerWidth
    const safeH = iH  > 0 ? iH  : window.innerHeight

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    renderer.setSize(safeW, safeH, false)

    // ── Scene & Camera ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene()
    const FOV    = 48
    const camera = new THREE.PerspectiveCamera(FOV, safeW / safeH, 0.1, 100)
    camera.position.set(0, 0, 4.5)

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.12))

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
    keyLight.position.set(4, 5, 6)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.8)
    fillLight.position.set(-4, -2, 3)
    scene.add(fillLight)

    const orbitCfg = [
      { color: 0xff004d, radius: 2.6, speed: 0.48, phase: 0,    yAmp: 1.0 },
      { color: 0xff8c00, radius: 2.2, speed: 0.38, phase: 1.05, yAmp: 0.7 },
      { color: 0x00ff88, radius: 2.4, speed: 0.55, phase: 2.09, yAmp: 0.9 },
      { color: 0x0088ff, radius: 2.7, speed: 0.42, phase: 3.14, yAmp: 1.1 },
      { color: 0x8800ff, radius: 2.3, speed: 0.50, phase: 4.19, yAmp: 0.8 },
      { color: 0xff00cc, radius: 2.5, speed: 0.44, phase: 5.24, yAmp: 0.9 },
    ]
    const orbitLights = orbitCfg.map(({ color }) => {
      const l = new THREE.PointLight(color, 3.5, 10, 2)
      scene.add(l)
      return l
    })

    // ── Background text plane ─────────────────────────────────────────────────
    const BG_Z   = -2.5
    const bgDist = 4.5 - BG_Z
    const visH   = 2 * bgDist * Math.tan((FOV / 2) * Math.PI / 180)
    const visW   = visH * (safeW / safeH)
    const bgGeo  = new THREE.PlaneGeometry(visW * 1.2, visH * 1.2)
    const bgMat  = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side:  THREE.FrontSide,
      // Do NOT set transparent:true here — the transmission pre-pass only
      // captures opaque objects; making bgMesh transparent would cause the
      // glass sphere to see nothing behind it and render as solid.
    })
    const bgMesh = new THREE.Mesh(bgGeo, bgMat)
    bgMesh.position.z = BG_Z
    scene.add(bgMesh)

    buildTextTexture().then(tex => {
      bgMat.map = tex
      bgMat.color.set(0xffffff)
      bgMat.needsUpdate = true
    })

    // ── Glass Sphere ──────────────────────────────────────────────────────────
    const SPHERE_R  = 0.88
    const sphereGeo = new THREE.SphereGeometry(SPHERE_R, 128, 128)
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color:               new THREE.Color(0xffffff),
      transmission:        1.0,
      roughness:           0.0,
      metalness:           0.0,
      thickness:           4.0,
      ior:                 1.85,
      transparent:         true,
      side:                THREE.FrontSide,
      attenuationColor:    new THREE.Color('#cce4ff'),
      attenuationDistance: 6.0,
      clearcoat:           1.0,
      clearcoatRoughness:  0.02,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    scene.add(sphere)

    // ── Sphere Shadow ─────────────────────────────────────────────────────────
    const shadowCv  = document.createElement('canvas')
    shadowCv.width  = 512
    shadowCv.height = 512
    const sCtx = shadowCv.getContext('2d')!
    const sg = sCtx.createRadialGradient(256, 256, 0, 256, 256, 256)
    sg.addColorStop(0,    'rgba(0,0,0,0.78)')
    sg.addColorStop(0.42, 'rgba(0,0,0,0.48)')
    sg.addColorStop(0.72, 'rgba(0,0,0,0.18)')
    sg.addColorStop(1,    'rgba(0,0,0,0)')
    sCtx.fillStyle = sg
    sCtx.fillRect(0, 0, 512, 512)
    const shadowTex  = new THREE.CanvasTexture(shadowCv)
    const shadowGeo  = new THREE.PlaneGeometry(2.8, 2.8)
    const shadowMat  = new THREE.MeshBasicMaterial({
      map:         shadowTex,
      transparent: true,
      depthWrite:  false,
      opacity:     1,
    })
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
    shadowMesh.position.set(-0.20, -0.18, -0.48)
    scene.add(shadowMesh)

    // ── Stem Shapes ───────────────────────────────────────────────────────────
    const stemStates: StemState[] = STEMS.map(stem => {
      let geo: THREE.BufferGeometry
      switch (stem.geometry) {
        case 'octahedron':  geo = new THREE.OctahedronGeometry(0.62, 0);              break
        case 'torus':       geo = new THREE.TorusGeometry(0.40, 0.17, 32, 64);       break
        case 'tetrahedron': geo = new THREE.TetrahedronGeometry(0.68, 0);            break
        case 'box':         geo = new THREE.BoxGeometry(0.80, 0.62, 0.52);           break
        case 'cylinder':    geo = new THREE.CylinderGeometry(0.31, 0.31, 0.80, 48); break
        case 'icosahedron':
        default:            geo = new THREE.IcosahedronGeometry(0.62, 0);            break
      }
      const mat = new THREE.MeshStandardMaterial({
        color:             new THREE.Color(stem.color),
        emissive:          new THREE.Color(stem.emissive),
        emissiveIntensity: 0.18,
        metalness:         0.30,
        roughness:         0.22,
        transparent:       true,
        opacity:           0,
        side:              THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.scale.setScalar(0.001)
      scene.add(mesh)
      return { mesh, mat, rotY: Math.random() * Math.PI * 2, rotX: Math.random() * Math.PI }
    })

    // ── Particles ─────────────────────────────────────────────────────────────
    const pCount = 50
    const pPos   = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 5
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({ color: 0x888888, size: 0.03, transparent: true, opacity: 0.18 })
    scene.add(new THREE.Points(pGeo, pMat))

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const { w, h } = getSize()
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas.parentElement || canvas)

    // ── Hover / Raycaster ─────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster()
    const mouse     = new THREE.Vector2()
    let lastHover   = false

    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x  =  ((e.clientX - r.left) / r.width)  * 2 - 1
      mouse.y  = -((e.clientY - r.top)  / r.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hit = raycaster.intersectObject(sphere).length > 0
      if (hit !== lastHover) { lastHover = hit; propsRef.current.onHoverChange(hit) }
    }
    const onMouseLeave = () => {
      if (lastHover) { lastHover = false; propsRef.current.onHoverChange(false) }
    }
    canvas.addEventListener('mousemove',  onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    // ── Animation Loop ────────────────────────────────────────────────────────
    let animSplit = 0
    const start   = performance.now()
    let prev      = start
    let rafId: number

    const tick = () => {
      rafId = requestAnimationFrame(tick)

      const now     = performance.now()
      const elapsed = (now - start) / 1000
      const delta   = Math.min(0.05, (now - prev) / 1000)
      prev = now

      const { isHovered, scrollProgress } = propsRef.current

      // ── Phase split ────────────────────────────────────────────────────────
      // Phase 1  scroll 0  → 38 %  sphere splits into 6 shapes
      // Phase 2  scroll 38 → 72 %  shapes migrate into lineup grid
      // Phase 3  scroll 72 → 100%  label reveal (handled in HeroSection HTML)
      const splitPhase  = Math.min(1, scrollProgress / 0.38)
      const lineupPhase = Math.max(0, Math.min(1, (scrollProgress - 0.38) / 0.34))

      // animSplit: smoothly chases the larger of hover (instant full split)
      // and scroll-driven splitPhase
      const targetSplit = Math.max(isHovered ? 1 : 0, splitPhase)
      animSplit = lerp(animSplit, targetSplit, Math.min(1, delta * 16))
      const split = animSplit

      // ── Background plane fade (disappears during lineup) ──────────────────
      // Enable transparency only once lineupPhase kicks in — at that point the
      // sphere (scale ≈ 0) is invisible, so moving bgMesh to the transparent
      // pass no longer breaks the transmission pre-pass.
      if (lineupPhase > 0) {
        if (!bgMat.transparent) { bgMat.transparent = true; bgMat.needsUpdate = true }
        bgMat.opacity = Math.max(0, 1 - lineupPhase)
      } else if (bgMat.transparent) {
        bgMat.transparent = false
        bgMat.opacity     = 1
        bgMat.needsUpdate = true
      }

      // ── Orbit lights ──────────────────────────────────────────────────────
      orbitCfg.forEach(({ radius, speed, phase, yAmp }, i) => {
        orbitLights[i].position.set(
          Math.cos(elapsed * speed + phase) * radius,
          Math.sin(elapsed * speed * 0.6 + phase) * yAmp,
          Math.sin(elapsed * speed + phase) * radius,
        )
      })

      // ── Sphere ────────────────────────────────────────────────────────────
      sphere.rotation.y += isHovered ? 0.012 : 0.003
      sphere.rotation.x  = Math.sin(elapsed * 0.3) * 0.07
      if (isHovered && split < 0.5) {
        sphere.position.x = Math.sin(elapsed * 9)   * 0.018
        sphere.position.y = Math.cos(elapsed * 7.5) * 0.018
      } else {
        sphere.position.x = lerp(sphere.position.x, 0, 0.12)
        sphere.position.y = lerp(sphere.position.y, 0, 0.12)
      }
      sphere.position.y += Math.sin(elapsed * 0.5) * 0.003
      const tSS = Math.max(0.001, 1 - split * 1.55)
      sphere.scale.setScalar(lerp(sphere.scale.x, tSS, 0.1))

      // ── Shadow ────────────────────────────────────────────────────────────
      const shadowScale = sphere.scale.x * 1.18
      shadowMesh.scale.setScalar(lerp(shadowMesh.scale.x, shadowScale, 0.10))
      shadowMesh.position.x = lerp(shadowMesh.position.x, sphere.position.x - 0.20, 0.10)
      shadowMesh.position.y = lerp(shadowMesh.position.y, sphere.position.y - 0.18, 0.10)
      shadowMat.opacity = lerp(shadowMat.opacity, (1 - split) * 0.90, 0.10)

      // ── Stem shapes ───────────────────────────────────────────────────────
      stemStates.forEach((ss, i) => {
        const [tx, ty, tz] = STEMS[i].targetPos
        const [lx, ly, lz] = LINEUP_POSITIONS[i]
        const t = elapsed + i * 1.2

        // Phase 1 target: lerp from origin toward split position
        const splitX = tx * split
        const splitY = ty * split
        const splitZ = tz * split

        // Phase 2 target: lerp from split position toward lineup grid
        const goalX = lerp(splitX, lx, lineupPhase)
        const goalY = lerp(splitY, ly, lineupPhase)
        const goalZ = lerp(splitZ, lz, lineupPhase)

        ss.mesh.position.x = lerp(ss.mesh.position.x, goalX, 0.09)
        ss.mesh.position.y = lerp(ss.mesh.position.y, goalY, 0.09)
        ss.mesh.position.z = lerp(ss.mesh.position.z, goalZ, 0.09)

        // Scale: normal split scale → lineup scale
        const splitScale = 0.68 * split
        const goalScale  = split < 0.05 ? 0.001 : lerp(splitScale, LINEUP_SCALE, lineupPhase)
        ss.mesh.scale.setScalar(lerp(ss.mesh.scale.x, goalScale, 0.09))

        // Rotation: slow and steady during lineup
        const rotSpeed = lerp(0.014, 0.003, lineupPhase)
        ss.rotY += rotSpeed
        ss.rotX  = Math.sin(t * 0.4) * (0.32 * (1 - lineupPhase * 0.85))
        ss.mesh.rotation.y = ss.rotY
        ss.mesh.rotation.x = ss.rotX

        // Bob: damp to near-zero during lineup so shapes appear settled
        const bobAmp = lerp(0.003, 0.0004, lineupPhase)
        ss.mesh.position.y += Math.sin(t * 0.9 + i) * bobAmp

        ss.mat.opacity = lerp(ss.mat.opacity, split > 0.05 ? 1.0 : 0, 0.16)
      })

      renderer.render(scene, camera)
    }

    tick()

    return () => {
      cancelAnimationFrame(rafId)
      canvas.removeEventListener('mousemove',  onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      ro.disconnect()
      renderer.dispose()
      sphereGeo.dispose()
      sphereMat.dispose()
      bgGeo.dispose()
      bgMat.dispose()
      pGeo.dispose()
      pMat.dispose()
      stemStates.forEach(({ mesh, mat }) => { mesh.geometry.dispose(); mat.dispose() })
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}