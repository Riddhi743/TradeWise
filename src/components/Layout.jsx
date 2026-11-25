import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, CandlestickChart, BookOpen, Bot, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo } from './ui'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trade', label: 'Trade', icon: CandlestickChart },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/tutor', label: 'AI Tutor', icon: Bot },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const out = () => { logout(); navigate('/') }

  return (
    <div className="md:flex min-h-screen">
      
      {/* floating glass sidebar */}
      <aside className="hidden md:block w-64 shrink-0 p-4">
        <div className="glass-strong sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-3xl p-4">
          <Logo className="mb-8 px-2 pt-1" />
          <nav className="flex flex-col gap-1 flex-1" aria-label="Main">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 min-h-11 px-3 rounded-xl text-sm font-semibold transition-colors duration-200 ${isActive ? 'text-brand' : 'text-muted hover:text-ink hover:bg-white/50'}`}>
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl bg-white shadow-[0_6px_18px_-8px_rgba(5,150,105,.45)] ring-1 ring-white"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon size={20} className="relative" aria-hidden />
                    <span className="relative">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-line pt-4">
            <div className="mb-2 flex items-center gap-3 px-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-sm font-bold text-white">
                {user?.name?.[0]?.toUpperCase()}
              </span>
              <p className="truncate text-sm font-semibold">{user?.name}</p>
            </div>
            <button onClick={out} className="flex items-center gap-2 min-h-11 px-2 text-sm text-muted hover:text-danger cursor-pointer transition-colors">
              <LogOut size={18} aria-hidden /> Log out
            </button>
          </div>
        </div>
      </aside>

      <main id="content" className="flex-1 min-w-0 p-6 md:p-10 md:pl-4 pb-28 md:pb-10 overflow-y-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* mobile glass tab bar */}
      <nav className="glass-strong md:hidden fixed bottom-3 inset-x-3 z-10 grid grid-cols-4 rounded-2xl p-1" aria-label="Main">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 min-h-14 rounded-xl text-xs font-semibold ${isActive ? 'text-brand' : 'text-muted'}`}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="nav-pill-m" className="absolute inset-0 rounded-xl bg-white shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                <Icon size={20} className="relative" aria-hidden />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}