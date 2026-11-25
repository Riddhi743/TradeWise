import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

/** Soft glow that trails the cursor. Nothing else moves. */
export default function CursorGlow() {
  const reduce = useReducedMotion()
  const mx = useMotionValue(-600)
  const my = useMotionValue(-600)
  const x = useSpring(mx, { stiffness: 120, damping: 22, mass: 0.6 })
  const y = useSpring(my, { stiffness: 120, damping: 22, mass: 0.6 })

  useEffect(() => {
    if (reduce) return
    const move = (e) => { mx.set(e.clientX); my.set(e.clientY) }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [reduce, mx, my])

  if (reduce) return null
  return (
    <motion.div
      style={{ x, y }}
      className="absolute left-0 top-0 -ml-[210px] -mt-[210px] size-[420px] rounded-full"
    >
      <div
        className="size-full rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(52,211,153,.30) 0%, rgba(56,189,248,.16) 40%, rgba(167,139,250,.07) 60%, transparent 72%)',
          filter: 'blur(10px)',
        }}
      />
    </motion.div>
  )
}