// import { useLocation } from 'react-router-dom'
// import InteractiveBg from '@/pages/InteractiveBg'
// import '@/pages/landing.css' // provides .aurora, .glass, .glow-border, .tilt etc. app-wide

// /** Aurora + interactive dot grid behind every page except the landing page (it has its own). */
// export default function Backdrop() {
//   const { pathname } = useLocation()
//   if (pathname === '/') return null
//   return (
//     <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
//       <div className="aurora"><i /><i /><i /><i /></div>
//       <InteractiveBg />
//     </div>
//   )
// }
import { useLocation } from 'react-router-dom'
import CursorGlow from './CursorGlow'
import '@/pages/landing.css' // provides .aurora, .glass, .glow-border etc. app-wide

/** Calm static aurora + cursor glow behind every page except the landing page (it has its own). */
export default function Backdrop() {
  const { pathname } = useLocation()
  if (pathname === '/') return null
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <div className="aurora aurora-static"><i /><i /><i /><i /></div>
      <CursorGlow />
    </div>
  )
}