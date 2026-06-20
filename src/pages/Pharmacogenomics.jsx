import React, { useEffect, useState } from 'react'
import { Pill, Search, AlertCircle, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getPharmaGenes } from '../utils/api'

function MetabolizerBadge({ status }) {
  if (!status) return <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>Unknown</span>
  const s = status.toLowerCase()
  if (s.includes('poor') || s.includes('slow'))
    return <span className="badge badge-rose">Poor</span>
  if (s.includes('rapid') || s.includes('ultra'))
    return <span className="badge badge-amber">Ultra-rapid</span>
  if (s.includes('intermediate'))
    return <span className="badge badge-violet">Intermediate</span>
  return <span className="badge badge-emerald">Normal</span>
}

export default function Pharmacogenomics() {
  const [genes, setGenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [activeGene, setActiveGene] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPharmaGenes()
      const list = Array.isArray(data)
        ? data
        : data.genes || data.results || data.data || []
      setGenes(list)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = genes.filter(g => {
    const q = search.toLowerCase()
    return !q
      || (g.gene || g.gene_name || g.symbol || '').toLowerCase().includes(q)
      || (g.drugs || []).some(d => (typeof d === 'string' ? d : d.name || '').toLowerCase().includes(q))
      || (g.drugs_affected || '').toLowerCase().includes(q)
  })

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2 className="page-title">Pharmacogenomics</h2>
        <p className="page-subtitle">
          Drug-gene interaction panel — 15 genes covering metabolizer phenotypes and clinical dosing guidance
        </p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search gene or drug…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
          <span className="badge badge-emerald">GET /pharma/genes</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
          <div className="spinner" />
          <span style={{ color: 'var(--text-secondary)' }}>Loading pharmacogenomics panel…</span>
        </div>
      ) : error ? (
        <div className="card">
          <div className="alert alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Failed to load</strong><br />
              <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>{error}</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={load} style={{ marginTop: 12 }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : genes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Pill size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-secondary)' }}>No pharmacogenomics data returned.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Gene list */}
          <div className="card" style={{ flex: 1, minWidth: 0 }}>
            <div className="section-header">
              <span className="section-title">PGx Gene Panel</span>
              <span className="badge badge-emerald">
                <Pill size={11} /> {genes.length} genes
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Gene</th>
                    <th>Metabolizer Status</th>
                    <th>Affected Drugs</th>
                    <th>Clinical Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g, i) => {
                    const gname = g.gene || g.gene_name || g.symbol || `Gene ${i + 1}`
                    const drugs = g.drugs || g.drugs_affected || g.affected_drugs || []
                    const drugList = Array.isArray(drugs)
                      ? drugs.map(d => typeof d === 'string' ? d : d.name || d.drug || '').join(', ')
                      : String(drugs)
                    const isActive = activeGene === i
                    return (
                      <tr
                        key={i}
                        onClick={() => setActiveGene(isActive ? null : i)}
                        style={{
                          cursor: 'pointer',
                          background: isActive ? 'var(--accent-emerald-dim)' : undefined,
                        }}
                      >
                        <td>
                          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.9rem' }}>
                            {gname}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-body)' }}>
                          <MetabolizerBadge status={g.metabolizer_status || g.phenotype || g.status} />
                        </td>
                        <td style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', maxWidth: 220, fontSize: '0.8rem' }}>
                          {drugList || '-'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 180 }}>
                          {g.clinical_action || g.recommendation || g.action || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {activeGene !== null && filtered[activeGene] && (
            <div className="card fade-in" style={{ width: 300, flexShrink: 0, alignSelf: 'flex-start', position: 'sticky', top: 80 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 4 }}>
                  {filtered[activeGene].gene || filtered[activeGene].gene_name || filtered[activeGene].symbol}
                </div>
                <MetabolizerBadge status={filtered[activeGene].metabolizer_status || filtered[activeGene].phenotype} />
              </div>
              <div className="divider" />
              <pre className="json-viewer" style={{ fontSize: '0.72rem', maxHeight: 300 }}>
                {JSON.stringify(filtered[activeGene], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
