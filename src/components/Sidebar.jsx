import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Dna, Upload, Heart, Pill, FlaskConical,
  Database, Home, ChevronLeft, ChevronRight,
  Activity, Atom
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: Home },
  { path: '/vcf', label: 'VCF Analysis', icon: Upload },
  { path: '/carrier', label: 'Carrier Screening', icon: Dna },
  { path: '/compatibility', label: 'Marriage Compatibility', icon: Heart },
  { path: '/pharma', label: 'Pharmacogenomics', icon: Pill },
  { path: '/protein', label: 'Protein Analysis', icon: FlaskConical },
  { path: '/simulation', label: 'Variant Simulation', icon: Atom },
  { path: '/sources', label: 'Data Sources', icon: Database },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      style={{
        width: collapsed ? '64px' : 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 20px' : '0 20px',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '10px',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '1rem',
          fontWeight: '700',
          color: '#070b14',
          fontFamily: 'var(--font-display)',
        }}>G</div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Genomirates
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Decoding Tomorrow
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path)
          return (
            <NavLink
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px 14px' : '10px 12px',
                borderRadius: 8,
                marginBottom: 2,
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-cyan-dim)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border-accent)' : 'transparent'}`,
                transition: 'all 0.15s ease',
                textDecoration: 'none',
                fontWeight: isActive ? 500 : 400,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', gap: '10px', padding: '8px 12px' }}
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <><ChevronLeft size={16} /><span style={{ fontSize: '0.8rem' }}>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  )
}
