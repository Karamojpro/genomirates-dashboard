import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, Dna, Heart, Pill, FlaskConical,
  Atom, Database, ArrowRight, Zap, Globe, Shield
} from 'lucide-react'

const TOOLS = [
  {
    path: '/vcf',
    icon: Upload,
    label: 'VCF Analysis',
    desc: 'Annotate variant call format files with ClinVar and refGene hg38',
    color: 'var(--accent-cyan)',
    bg: 'var(--accent-cyan-dim)',
  },
  {
    path: '/carrier',
    icon: Dna,
    label: 'Carrier Screening',
    desc: 'Browse autosomal recessive disease genes prevalent in the Gulf region',
    color: 'var(--accent-violet)',
    bg: 'var(--accent-violet-dim)',
  },
  {
    path: '/compatibility',
    icon: Heart,
    label: 'Marriage Compatibility',
    desc: 'Evaluate carrier risk between two individuals for consanguineous populations',
    color: 'var(--accent-rose)',
    bg: 'var(--accent-rose-dim)',
  },
  {
    path: '/pharma',
    icon: Pill,
    label: 'Pharmacogenomics',
    desc: 'Drug-gene interaction panel: gene list, metabolizer status, clinical guidance',
    color: 'var(--accent-emerald)',
    bg: 'var(--accent-emerald-dim)',
  },
  {
    path: '/protein',
    icon: FlaskConical,
    label: 'Protein Analysis',
    desc: 'Submit a protein sequence for structure, domain, and functional annotation',
    color: 'var(--accent-amber)',
    bg: 'var(--accent-amber-dim)',
  },
  {
    path: '/simulation',
    icon: Atom,
    label: 'Variant Simulation',
    desc: 'Predict the structural and functional impact of a single amino acid change',
    color: 'var(--accent-cyan)',
    bg: 'var(--accent-cyan-dim)',
  },
  {
    path: '/sources',
    icon: Database,
    label: 'Data Sources',
    desc: 'Inspect active annotation databases and their version metadata',
    color: 'var(--text-secondary)',
    bg: 'var(--bg-elevated)',
  },
]

const STATS = [
  { value: 'hg38', label: 'Genome Build', icon: Globe, color: 'var(--accent-cyan)' },
  { value: '6', label: 'API Modules', icon: Zap, color: 'var(--accent-violet)' },
  { value: 'ClinVar', label: 'Variant DB', icon: Database, color: 'var(--accent-emerald)' },
  { value: 'MENA', label: 'Region Focus', icon: Shield, color: 'var(--accent-amber)' },
]

export default function Overview() {
  return (
    <div className="page-content fade-in">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(0,102,255,0.04) 100%)',
        border: '1px solid var(--border-accent)',
        borderRadius: 16,
        padding: '32px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <div className="badge badge-cyan" style={{ marginBottom: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)' }} />
            Clinical Genomics Platform — MENA
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 10,
            lineHeight: 1.3,
          }}>
            Genomirates Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 560, fontSize: '0.95rem', lineHeight: 1.7 }}>
            A unified interface for the Genomirates annotation API — VCF analysis, carrier screening,
            marriage compatibility, pharmacogenomics, and protein simulation for the Arabian Gulf region.
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <Link to="/vcf" className="btn btn-primary">
              Start with VCF Analysis <ArrowRight size={15} />
            </Link>
            <a
              href="https://genomirates-v5-1-1.onrender.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              API Reference
            </a>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {STATS.map(({ value, label, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: `${color}22` }}>
              <Icon size={18} color={color} />
            </div>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Tool grid */}
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Platform Tools
        </h3>
        <div className="grid-3" style={{ gap: 12 }}>
          {TOOLS.map(({ path, icon: Icon, label, desc, color, bg }) => (
            <Link
              key={path}
              to={path}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = color
                  e.currentTarget.style.background = 'var(--bg-elevated)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                  e.currentTarget.style.background = 'var(--bg-card)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={18} color={color} />
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    marginBottom: 5,
                  }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {desc}
                  </div>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, color, fontSize: '0.8rem', fontWeight: 500 }}>
                  Open <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
