import React, { useEffect, useState } from 'react'
import { Database, RefreshCw, AlertCircle, CheckCircle, ExternalLink, Calendar, Server } from 'lucide-react'
import { getDataSources } from '../utils/api'

const KNOWN_SOURCES = [
  { name: 'ClinVar', version: '20240611', desc: 'Clinical variant interpretations from NCBI', url: 'https://www.ncbi.nlm.nih.gov/clinvar/', color: 'var(--accent-cyan)' },
  { name: 'refGene (hg38)', version: 'GRCh38', desc: 'UCSC reference gene annotations on human genome build 38', url: 'https://genome.ucsc.edu/', color: 'var(--accent-emerald)' },
  { name: 'ANNOVAR', version: '2020-06-08', desc: 'Functional annotation of genetic variants from high-throughput sequencing', url: 'https://annovar.openbioinformatics.org/', color: 'var(--accent-violet)' },
]

export default function DataSources() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDataSources()
      const list = Array.isArray(data)
        ? data
        : data.sources || data.databases || data.data || []
      setSources(list)
    } catch (e) {
      setError(e.message)
      setSources([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const displaySources = sources.length > 0 ? sources : []

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2 className="page-title">Data Sources</h2>
        <p className="page-subtitle">
          Active annotation databases powering the Genomirates API
        </p>
      </div>

      {/* Static known sources — always shown */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Configured Databases
        </div>
        <div className="grid-3">
          {KNOWN_SOURCES.map(src => (
            <div key={src.name} className="card" style={{ borderColor: `${src.color}33` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `${src.color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Database size={18} color={src.color} />
                </div>
                <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                  <CheckCircle size={10} /> Active
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                {src.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Calendar size={11} color="var(--text-muted)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {src.version}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                {src.desc}
              </div>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, color: src.color, fontSize: '0.78rem', fontWeight: 500 }}
              >
                Documentation <ExternalLink size={11} />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Live API response */}
      <div className="card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Server size={16} color="var(--text-secondary)" />
            <span className="section-title">Live API Response</span>
            <span className="badge badge-cyan">GET /info/data-sources</span>
          </div>
          <button className="btn btn-secondary" onClick={load} disabled={loading} style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 0' }}>
            <div className="spinner" />
            <span style={{ color: 'var(--text-secondary)' }}>Fetching data sources…</span>
          </div>
        ) : error ? (
          <div>
            <div className="alert alert-error" style={{ marginBottom: 12 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>
                <strong>Could not reach /info/data-sources</strong><br />
                <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>{error}</span>
              </div>
            </div>
            <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              The configured databases above reflect what is deployed in the Genomirates backend. The API endpoint may need to be implemented.
            </div>
          </div>
        ) : displaySources.length > 0 ? (
          <div>
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Version</th>
                    <th>Type</th>
                    <th>Build</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displaySources.map((s, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {s.name || s.database || s.source || `Source ${i + 1}`}
                      </td>
                      <td>{s.version || s.release || '-'}</td>
                      <td style={{ fontFamily: 'var(--font-body)' }}>{s.type || s.category || '-'}</td>
                      <td>{s.genome_build || s.build || s.reference || '-'}</td>
                      <td>
                        {s.status === 'active' || s.active === true
                          ? <span className="badge badge-emerald"><CheckCircle size={10} /> Active</span>
                          : <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>{s.status || 'Unknown'}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <pre className="json-viewer" style={{ fontSize: '0.75rem' }}>
              {JSON.stringify(displaySources, null, 2)}
            </pre>
          </div>
        ) : (
          <div>
            <div className="alert alert-info" style={{ marginBottom: 12 }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              API returned an empty response — this endpoint may need implementation.
            </div>
            <pre className="json-viewer" style={{ fontSize: '0.75rem' }}>[]</pre>
          </div>
        )}
      </div>
    </div>
  )
}
