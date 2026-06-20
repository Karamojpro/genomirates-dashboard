import React, { useState } from 'react'
import { FlaskConical, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react'
import { analyzeProtein } from '../utils/api'

const EXAMPLE_SEQUENCE = 'MKTIIALSYIFCLVFA'
const EXAMPLE_LONG = `MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR`

export default function ProteinAnalysis() {
  const [sequence, setSequence] = useState('')
  const [proteinId, setProteinId] = useState('')
  const [mode, setMode] = useState('sequence') // 'sequence' | 'id'
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = mode === 'sequence'
        ? { sequence: sequence.trim().replace(/\s/g, '').toUpperCase() }
        : { protein_id: proteinId.trim() }
      const data = await analyzeProtein(payload)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setSequence('')
    setProteinId('')
    setResult(null)
    setError(null)
  }

  const seqLen = sequence.replace(/\s/g, '').length

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2 className="page-title">Protein Analysis</h2>
        <p className="page-subtitle">
          Submit a protein sequence or UniProt ID for structural, domain, and functional annotation
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <span className="section-title">Input</span>
          <span className="badge badge-amber">POST /protein/analyze</span>
        </div>

        {/* Mode toggle */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={`tab ${mode === 'sequence' ? 'active' : ''}`} onClick={() => setMode('sequence')}>
            Amino Acid Sequence
          </button>
          <button className={`tab ${mode === 'id' ? 'active' : ''}`} onClick={() => setMode('id')}>
            Protein ID
          </button>
        </div>

        {mode === 'sequence' ? (
          <div className="form-group">
            <label className="label">Protein Sequence (single-letter IUPAC)</label>
            <div style={{ position: 'relative' }}>
              <textarea
                className="input"
                style={{ minHeight: 120, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.05em' }}
                placeholder={`e.g. ${EXAMPLE_SEQUENCE}…`}
                value={sequence}
                onChange={e => setSequence(e.target.value)}
                spellCheck={false}
              />
              {seqLen > 0 && (
                <span style={{ position: 'absolute', bottom: 10, right: 14, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {seqLen} aa
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setSequence(EXAMPLE_SEQUENCE)}>
                Short example
              </button>
              <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setSequence(EXAMPLE_LONG)}>
                Hemoglobin β
              </button>
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label className="label">UniProt / Protein ID</label>
            <input
              className="input"
              placeholder="e.g. P68871 (HBB human)"
              value={proteinId}
              onChange={e => setProteinId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
              UniProt accession (P68871), RefSeq (NP_000509), or custom protein ID
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || (mode === 'sequence' ? seqLen < 4 : !proteinId.trim())}
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Analyzing…</>
              : <><FlaskConical size={15} /> Analyze Protein</>
            }
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
                <span className="section-title">Analysis Results</span>
              </div>
            </div>

            {/* Summary fields */}
            <div className="grid-3" style={{ marginBottom: 20 }}>
              {[
                ['Protein Name', result.protein_name || result.name || result.gene_name || '-'],
                ['Length', result.length ? `${result.length} aa` : (result.sequence_length ? `${result.sequence_length} aa` : '-')],
                ['Molecular Weight', result.molecular_weight || result.mw || '-'],
                ['pI', result.isoelectric_point || result.pi || result.pI || '-'],
                ['Organism', result.organism || result.species || '-'],
                ['Function', result.function || result.protein_function || '-'],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Domains */}
            {(result.domains || result.functional_domains || []).length > 0 && (
              <>
                <div style={{ fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Domains</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {(result.domains || result.functional_domains).map((d, i) => (
                    <span key={i} className="badge badge-amber">
                      {typeof d === 'string' ? d : `${d.name || d.type || 'Domain'} (${d.start || '?'}–${d.end || '?'})`}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Full JSON */}
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
