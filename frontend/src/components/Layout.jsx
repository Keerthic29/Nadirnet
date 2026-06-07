import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../utils/api'

export default function Layout() {
  const [online, setOnline] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.health()
      .then(() => setOnline(true))
      .catch(() => setOnline(false))
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>
            NADIR<span style={{ color: 'var(--accent)' }}>NET</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 3, letterSpacing: 1 }}>
            DISASTER INTELLIGENCE v2
          </div>
        </div>

        {/* System status */}
        <div style={{
          padding: '10px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: online === null ? 'var(--text3)' : online ? 'var(--accent)' : 'var(--critical)',
            animation: online ? 'pulse-dot 2s infinite' : 'none',
            flexShrink: 0,
          }} />
          <span style={{ color: online === null ? 'var(--text3)' : online ? 'var(--accent)' : 'var(--critical)' }}>
            {online === null ? 'CONNECTING...' : online ? 'API ONLINE' : 'OFFLINE MODE'}
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {[
            { to: '/', label: 'DASHBOARD', icon: '⬡' },
            { to: '/incidents/new', label: 'NEW INCIDENT', icon: '+' },
            { to: '/audit', label: 'AUDIT LOG', icon: '◎' },
          ].map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 20px',
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                background: isActive ? 'rgba(0,212,170,0.06)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: 1,
                transition: 'all 0.15s',
                textDecoration: 'none',
              })}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          fontSize: 10,
          color: 'var(--text3)',
          fontFamily: 'var(--font-mono)',
        }}>
          <div>POWERED BY GEMMA 4</div>
          <div style={{ marginTop: 2, color: 'var(--text3)' }}>LOCAL · OFFLINE-FIRST</div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  )
}
