import React, { useEffect, useState } from 'react'
import { Dna, Search, AlertCircle, RefreshCw } from 'lucide-react'
import { getCarrierGenes } from '../utils/api'

export default function CarrierScreening() {
  const [genes, setGenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCarrierGenes()
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

  const categories = [...new Set(genes.map(g => g.category || g.disease_category || g.type || 'Other'))]

  const filtered = genes.filter(g => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || (g.gene || g.gene_name || g.symbol || '').toLowerCase().includes(q)
      || (g.disease || g.disorder || g.condition || '').toLowerCase().includes(q)
      || (g.gene_id || '').toLowerCase().includes(q)
    const matchFilter = filter === 'all'
      || (g.category || g.disease_category || g.type || 'Other') === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2 className="page-title">Carrier Screening Panel</h2>
        <p className="page-subtitle">
          20-gene MENA-specific panel for autosomal recessive conditions prevalent in the Gulf region
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
              placeholder="Search gene or disease…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input"
            style={{ width: 'auto', minWidth: 180 }}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <span className="badge badge-cyan">GET /carrier/genes</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
          <div className="spinner" />
          <span style={{ color: 'var(--text-secondary)' }}>Loading carrier gene panel…</span>
        </div>
      ) : error ? (
        <div className="card">
          <div className="alert alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Failed to load genes</strong><br />
              <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>{error}</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={load} style={{ marginTop: 12 }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : genes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Dna size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-secondary)' }}>No gene data returned from the API.</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 6 }}>Raw response will be shown below.</div>
        </div>
      ) : (
        <div className="card">
          <div className="section-header">
            <span className="section-title">Gene Panel</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{filtered.length} of {genes.length}</span>
              <span className="badge badge-violet">
                <Dna size={11} /> {genes.length} genes
              </span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="result-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Gene</th>
                  <th>Disease / Condition</th>
                  <th>Category</th>
                  <th>Inheritance</th>
                  <th>Prevalence</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {g.gene || g.gene_name || g.symbol || g.gene_id || '-'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
                      {g.disease || g.disorder || g.condition || g.disease_name || '-'}
                    </td>
                    <td>
                      <span className="badge badge-violet" style={{ fontFamily: 'var(--font-body)' }}>
                        {g.category || g.disease_category || g.type || 'Other'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                      {g.inheritance || g.inheritance_pattern || 'AR'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                      {g.mena_prevalence || g.prevalence || g.carrier_frequency || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
