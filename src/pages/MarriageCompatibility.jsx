import React, { useState } from 'react'
import { Heart, AlertCircle, CheckCircle, AlertTriangle, User } from 'lucide-react'
import { checkMarriageCompatibility } from '../utils/api'

function RiskBadge({ risk }) {
  if (!risk) return null
  const r = risk.toLowerCase()
  if (r.includes('high') || r.includes('incompatible'))
    return <span className="badge badge-rose">⚠ High Risk</span>
  if (r.includes('moderate') || r.includes('medium'))
    return <span className="badge badge-amber">⚡ Moderate Risk</span>
  return <span className="badge badge-emerald">✓ Low Risk</span>
}

export default function MarriageCompatibility() {
  const [partner1, setPartner1] = useState('')
  const [partner2, setPartner2] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!partner1.trim() || !partner2.trim()) {
      setError('Both partner IDs are required')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await checkMarriageCompatibility(partner1.trim(), partner2.trim())
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const sharedGenes = result
    ? (result.shared_carrier_genes || result.at_risk_genes || result.common_genes || result.risk_genes || [])
    : []

  const riskLevel = result
    ? (result.risk_level || result.compatibility_risk || result.overall_risk || result.status || '')
    : ''

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2 className="page-title">Marriage Compatibility</h2>
        <p className="page-subtitle">
          Evaluate shared carrier risk between two individuals — designed for consanguineous populations in the Gulf region
        </p>
      </div>

      {/* Input form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <span className="section-title">Partner IDs</span>
          <span className="badge badge-rose">POST /carrier/marriage-compatibility</span>
        </div>

        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="label">
              <User size={11} style={{ display: 'inline', marginRight: 4 }} />
              Partner 1 ID
            </label>
            <input
              className="input"
              placeholder="e.g. patient_001"
              value={partner1}
              onChange={e => setPartner1(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="label">
              <User size={11} style={{ display: 'inline', marginRight: 4 }} />
              Partner 2 ID
            </label>
            <input
              className="input"
              placeholder="e.g. patient_002"
              value={partner2}
              onChange={e => setPartner2(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !partner1 || !partner2}
          style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
        >
          {loading
            ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Checking…</>
            : <><Heart size={15} /> Check Compatibility</>
          }
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="fade-in">
          {/* Summary card */}
          <div className="card" style={{
            marginBottom: 16,
            borderColor: riskLevel.toLowerCase().includes('high')
              ? 'rgba(244,63,94,0.4)'
              : riskLevel.toLowerCase().includes('moderate')
              ? 'rgba(245,158,11,0.4)'
              : 'rgba(16,185,129,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: riskLevel.toLowerCase().includes('high')
                  ? 'var(--accent-rose-dim)'
                  : riskLevel.toLowerCase().includes('moderate')
                  ? 'var(--accent-amber-dim)'
                  : 'var(--accent-emerald-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {riskLevel.toLowerCase().includes('high')
                  ? <AlertTriangle size={24} color="var(--accent-rose)" />
                  : riskLevel.toLowerCase().includes('moderate')
                  ? <AlertCircle size={24} color="var(--accent-amber)" />
                  : <CheckCircle size={24} color="var(--accent-emerald)" />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
                    Compatibility Assessment
                  </span>
                  <RiskBadge risk={riskLevel} />
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {partner1} × {partner2}
                  {result.risk_percentage !== undefined && (
                    <span style={{ marginLeft: 12, color: 'var(--accent-amber)', fontWeight: 600 }}>
                      {result.risk_percentage}% offspring risk
                    </span>
                  )}
                </div>
              </div>
            </div>

            {result.summary && (
              <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--bg-base)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                {result.summary}
              </div>
            )}
          </div>

          {/* Shared risk genes */}
          {sharedGenes.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-header">
                <span className="section-title">Shared Carrier Genes</span>
                <span className="badge badge-rose">{sharedGenes.length} gene{sharedGenes.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>Gene</th>
                      <th>Disease</th>
                      <th>Offspring Risk</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedGenes.map((g, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          {typeof g === 'string' ? g : (g.gene || g.gene_name || g.symbol || '-')}
                        </td>
                        <td style={{ fontFamily: 'var(--font-body)' }}>
                          {typeof g === 'object' ? (g.disease || g.condition || g.disorder || '-') : '-'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-body)', color: 'var(--accent-amber)' }}>
                          {typeof g === 'object' ? (g.offspring_risk || g.risk || '25%') : '25%'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {typeof g === 'object' ? (g.recommendation || 'Genetic counselling advised') : 'Genetic counselling advised'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw JSON */}
          <div className="card">
            <div className="section-header">
              <span className="section-title">Full API Response</span>
            </div>
            <pre className="json-viewer">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Info box */}
      {!result && (
        <div className="card" style={{ opacity: 0.75 }}>
          <div className="alert alert-info">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.875rem' }}>
              <strong>How it works:</strong> Enter two patient/sample IDs that exist in the carrier screening database.
              The API checks their carrier status across the 20-gene MENA panel and returns shared risk genes,
              estimated offspring risk, and clinical recommendations.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
