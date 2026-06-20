import React, { useState } from 'react'
import { Atom, AlertCircle, CheckCircle, RotateCcw, Zap } from 'lucide-react'
import { simulateVariant } from '../utils/api'

const AMINO_ACIDS = [
  'A','C','D','E','F','G','H','I','K','L',
  'M','N','P','Q','R','S','T','V','W','Y'
]

function ImpactBadge({ impact }) {
  if (!impact) return null
  const s = impact.toLowerCase()
  if (s.includes('damaging') || s.includes('deleterious') || s.includes('high'))
    return <span className="badge badge-rose">Damaging</span>
  if (s.includes('tolerated') || s.includes('benign') || s.includes('low'))
    return <span className="badge badge-emerald">Tolerated</span>
  if (s.includes('moderate'))
    return <span className="badge badge-amber">Moderate</span>
  return <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>{impact}</span>
}

export default function VariantSimulation() {
  const [form, setForm] = useState({
    protein_id: '',
    position: '',
    wild_type: '',
    mutant: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.protein_id || !form.position || !form.wild_type || !form.mutant) {
      setError('All fields are required')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = {
        protein_id: form.protein_id.trim(),
        position: parseInt(form.position),
        wild_type: form.wild_type.trim().toUpperCase(),
        mutant: form.mutant.trim().toUpperCase(),
      }
      const data = await simulateVariant(payload)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setForm({ protein_id: '', position: '', wild_type: '', mutant: '' })
    setResult(null)
    setError(null)
  }

  const exampleFill = () => {
    setForm({ protein_id: 'P68871', position: '6', wild_type: 'E', mutant: 'V' })
  }

  const impact = result
    ? (result.predicted_impact || result.impact || result.sift_prediction || result.polyphen_prediction || result.functional_impact || '')
    : ''

  const score = result
    ? (result.impact_score ?? result.sift_score ?? result.polyphen_score ?? result.score ?? null)
    : null

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2 className="page-title">Variant Simulation</h2>
        <p className="page-subtitle">
          Predict the structural and functional consequence of a single amino acid substitution
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <span className="section-title">Substitution Parameters</span>
          <span className="badge badge-cyan">POST /protein/simulate-variant</span>
        </div>

        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="label">Protein ID</label>
            <input
              className="input"
              placeholder="e.g. P68871"
              value={form.protein_id}
              onChange={e => set('protein_id', e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="label">Position (residue number)</label>
            <input
              className="input"
              type="number"
              min="1"
              placeholder="e.g. 6"
              value={form.position}
              onChange={e => set('position', e.target.value)}
            />
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="label">Wild-type Amino Acid</label>
            <select className="input" value={form.wild_type} onChange={e => set('wild_type', e.target.value)}>
              <option value="">Select…</option>
              {AMINO_ACIDS.map(aa => <option key={aa} value={aa}>{aa}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="label">Mutant Amino Acid</label>
            <select className="input" value={form.mutant} onChange={e => set('mutant', e.target.value)}>
              <option value="">Select…</option>
              {AMINO_ACIDS.map(aa => <option key={aa} value={aa}>{aa}</option>)}
            </select>
          </div>
        </div>

        {/* Variant notation preview */}
        {form.protein_id && form.position && form.wild_type && form.mutant && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-accent)',
            borderRadius: 8,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Zap size={14} color="var(--accent-cyan)" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Variant: </span>
            <code style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600 }}>
              {form.protein_id} p.{form.wild_type}{form.position}{form.mutant}
            </code>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !form.protein_id || !form.position || !form.wild_type || !form.mutant}
          >
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Simulating…</>
              : <><Atom size={15} /> Simulate Variant</>
            }
          </button>
          <button className="btn btn-ghost" onClick={exampleFill}>
            HBB p.E6V (Sickle cell)
          </button>
          {(result || error) && (
            <button className="btn btn-ghost" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="fade-in">
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={16} color="var(--accent-emerald)" />
                <span className="section-title">Simulation Result</span>
              </div>
            </div>

            {/* Impact summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '16px 20px',
              background: 'var(--bg-base)',
              borderRadius: 10,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Variant</div>
                <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: '1rem', fontWeight: 700 }}>
                  p.{form.wild_type}{form.position}{form.mutant}
                </code>
              </div>
              {score !== null && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Score</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {typeof score === 'number' ? score.toFixed(3) : score}
                  </div>
                </div>
              )}
              {impact && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Predicted Impact</div>
                  <ImpactBadge impact={impact} />
                </div>
              )}
              {result.conservation_score !== undefined && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Conservation</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--accent-violet)' }}>
                    {result.conservation_score}
                  </div>
                </div>
              )}
            </div>

            {/* Detail fields */}
            {result.structural_impact && (
              <div style={{ marginBottom: 12, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Structural Impact</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{result.structural_impact}</div>
              </div>
            )}

            {result.clinical_relevance && (
              <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Clinical Relevance</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{result.clinical_relevance}</div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-header">
              <span className="section-title">Full API Response</span>
            </div>
            <pre className="json-viewer">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
