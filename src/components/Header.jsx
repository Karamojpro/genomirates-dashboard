import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Activity, ExternalLink } from 'lucide-react'
import { healthCheck } from '../utils/api'

const PAGE_TITLES = {
  '/': 'Overview',
  '/vcf': 'VCF Analysis',
  '/carrier': 'Carrier Screening',
  '/compatibility': 'Marriage Compatibility',
  '/pharma': 'Pharmacogenomics',
  '/protein': 'Protein Analysis',
  '/simulation': 'Variant Simulation',
  '/sources': 'Data Sources',
}

export default function Header() {
  const location = useLocation()
  const [apiStatus, setApiStatus] = useState('checking') // 'online' | 'offline' | 'checking'
  const title = PAGE_TITLES[location.pathname] || 'Genomirates'

  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        await healthCheck()
        if (mounted) setApiStatus('online')
      } catch {
        if (mounted) setApiStatus('offline')
      }
    }
    check()
    const interval = setInterval(check, 60000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  const statusColor = apiStatus === 'online' ? 'var(--accent-emerald)'
    : apiStatus === 'offline' ? 'var(--accent-rose)'
    : 'var(--accent-amber)'

  const statusLabel = apiStatus === 'online' ? 'API Online'
    : apiStatus === 'offline' ? 'API Offline'
    : 'Checking...'

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* API status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '5px 12px',
          borderRadius: 20,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.775rem',
          color: statusColor,
          fontWeight: 500,
        }}>
          <div style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: statusColor,
            animation: apiStatus === 'online' ? 'pulse-glow 2s infinite' : 'none',
          }} />
          {statusLabel}
        </div>

        {/* API docs link */}
        <a
          href="https://genomirates-v5-1-1.onrender.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
        >
          <Activity size={14} />
          API Docs
          <ExternalLink size={12} />
        </a>
      </div>
    </header>
  )
}
