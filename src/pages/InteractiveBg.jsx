import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

const GAP = 28     // distance between dots
const RADIUS = 100  // how far the cursor affects dots
const PUSH = 30     // how far dots get pushed away

const lerp = (a, b, t) => a + (b - a) * t

export default function InteractiveBg() {
  const canvasRef = useRef(null)
  const reduce = useReducedMotion()

  // glow orb that trails the cursor
  const mx = useMotionValue(-600)
  const my = useMotionValue(-600)
  const x = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.7 })
  const y = useSpring(my, { stiffness: 90, damping: 18, mass: 0.7 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w = 0, h = 0, dots = [], raf = 0
    const mouse = { x: -9999, y: -9999 }

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dots = []
      for (let gx = GAP / 2; gx < w + GAP; gx += GAP) {
        for (let gy = GAP / 2; gy < h + GAP; gy += GAP) {
          dots.push({ hx: gx, hy: gy, x: gx, y: gy, vx: 0, vy: 0 })
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const d of dots) {
        const dx = d.hx - mouse.x
        const dy = d.hy - mouse.y
        const dist = Math.hypot(dx, dy)
        let tx = d.hx
        let ty = d.hy
        let t = 0
        if (dist < RADIUS) {
          t = 1 - dist / RADIUS
          const f = t * t * PUSH
          tx += (dx / (dist || 1)) * f
          ty += (dy / (dist || 1)) * f
        }
        // spring back toward target
        d.vx = (d.vx + (tx - d.x) * 0.14) * 0.76
        d.vy = (d.vy + (ty - d.y) * 0.14) * 0.76
        d.x += d.vx
        d.y += d.vy

        const glow = Math.min(1, t * 1.4)
        // colour sweeps emerald -> blue across the screen
        const k = d.hx / w
        const r = lerp(15, lerp(16, 59, k), glow)
        const g = lerp(40, lerp(185, 130, k), glow)
        const b = lerp(70, lerp(129, 246, k), glow)
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${0.17 + glow * 0.75})`
        ctx.beginPath()
        ctx.arc(d.x, d.y, 1.25 + glow * 2.4, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }

    const onMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mx.set(e.clientX)
      my.set(e.clientY)
    }
    const onLeave = () => { mouse.x = mouse.y = -9999 }
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden && !reduce) raf = requestAnimationFrame(draw)
    }

    build()
    if (reduce) {
      draw()
      cancelAnimationFrame(raf)
    } else {
      raf = requestAnimationFrame(draw)
      window.addEventListener('pointermove', onMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave)
      document.addEventListener('visibilitychange', onVisibility)
    }
    window.addEventListener('resize', build)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', build)
    }
  }, [reduce, mx, my])

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!reduce && (
        <motion.div
          style={{ x, y }}
          className="absolute left-0 top-0 -ml-[230px] -mt-[230px] size-[460px] rounded-full"
        >
          <div
            className="size-full rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(52,211,153,.38) 0%, rgba(56,189,248,.22) 38%, rgba(167,139,250,.10) 60%, transparent 72%)',
              filter: 'blur(10px)',
            }}
          />
        </motion.div>
      )}
    </div>
  )
}