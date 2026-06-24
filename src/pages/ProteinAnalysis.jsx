import React, { useState, useRef } from 'react'
import { FlaskConical, AlertCircle, CheckCircle, RotateCcw, Upload, FileText, X } from 'lucide-react'
import { analyzeProtein } from '../utils/api'

const EXAMPLE_SHORT = 'MKTIIALSYIFCLVFA'
const EXAMPLE_HBB = `MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR`

// Parse a FASTA file — returns { header, sequence }
function parseFASTA(text) {
  const lines = text.trim().split('\n')
  const results = []
  let currentHeader = null
  let currentSeq = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('>')) {
      if (currentHeader !== null) {
        results.push({ header: currentHeader, sequence: currentSeq.join('') })
      }
      currentHeader = trimmed.slice(1).trim()
      currentSeq = []
    } else if (trimmed && currentHeader !== null) {
      // Remove numbers and spaces (some FASTA formats include them)
      currentSeq.push(trimmed.replace(/[^A-Za-z]/g, ''))
    }
  }
  if (currentHeader !== null) {
    results.push({ header: currentHeader, sequence: currentSeq.join('') })
  }
  return results
}

export default function ProteinAnalysis() {
  const [sequence, setSequence] = useState('')
  const [proteinId, setProteinId] = useState('')
  const [mode, setMode] = useState('sequence') // 'sequence' | 'id' | 'fasta'
  const [fastaFile, setFastaFile] = useState(null)
  const [fastaEntries, setFastaEntries] = useState([]) // parsed entries from FASTA
  const [selectedEntry, setSelectedEntry] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()

  const handleFASTAFile = (f) => {
    if (!f) return
    const name = f.name.toLowerCase()
    if (!name.endsWith('.fasta') && !name.endsWith('.fa') && !name.endsWith('.fas') && !name.endsWith('.faa') && !name.endsWith('.txt')) {
      setError('Please upload a .fasta, .fa, .fas, or .faa file')
      return
    }
    setError(null)
    setFastaFile(f)
    setFastaEntries([])
    setSelectedEntry(0)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const entries = parseFASTA(e.target.result)
      if (entries.length === 0) {
        setError('No sequences found in this file. Make sure it starts with a > header line.')
        setFastaFile(null)
        return
      }
      setFastaEntries(entries)
      // Auto-load first sequence into the sequence field
      setSequence(entries[0].sequence)
    }
    reader.readAsText(f)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      let payload
      if (mode === 'id') {
        payload = { protein_id: proteinId.trim() }
      } else {
        // sequence or fasta — both end up in sequence field
        const seq = sequence.trim().replace(/\s/g, '').toUpperCase()
        if (seq.length < 4) throw new Error('Sequence is too short — minimum 4 amino acids')
        payload = { sequence: seq }
      }
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
    setFastaFile(null)
    setFastaEntries([])
    setSelectedEntry(0)
    setResult(null)
    setError(null)
  }

  const seqLen = sequence.replace(/\s/g, '').length

  // When user picks a different entry from the FASTA file
  const handleEntryChange = (idx) => {
    setSelectedEntry(idx)
    setSequence(fastaEntries[idx].sequence)
    setResult(null)
  }

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2 className="page-title">Protein Analysis</h2>
        <p className="page-subtitle">
          Submit a protein sequence, FASTA file, or UniProt ID for structural, domain, and functional annotation
        </p>
      </div>

      {/* Supported formats bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supported inputs:</span>
        <span className="badge badge-amber">FASTA</span>
        <span className="badge badge-amber">FA</span>
        <span className="badge badge-amber">FAA</span>
        <span className="badge badge-cyan">Raw sequence</span>
        <span className="badge badge-violet">UniProt ID</span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <span className="section-title">Input</span>
          <span className="badge badge-amber">POST /protein/analyze</span>
        </div>

        {/* Mode tabs */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={`tab ${mode === 'sequence' ? 'active' : ''}`} onClick={() => { setMode('sequence'); setFastaFile(null); setFastaEntries([]) }}>
            Paste Sequence
          </button>
          <button className={`tab ${mode === 'fasta' ? 'active' : ''}`} onClick={() => setMode('fasta')}>
            Upload FASTA
          </button>
          <button className={`tab ${mode === 'id' ? 'active' : ''}`} onClick={() => { setMode('id'); setFastaFile(null); setFastaEntries([]) }}>
            Protein ID
          </button>
        </div>

        {/* PASTE SEQUENCE MODE */}
        {mode === 'sequence' && (
          <div className="form-group">
            <label className="label">Amino Acid Sequence — single-letter IUPAC code</label>
            <div style={{ position: 'relative' }}>
              <textarea
                className="input"
                style={{ minHeight: 120, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.05em' }}
                placeholder={`e.g. ${EXAMPLE_SHORT}…`}
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
              <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setSequence(EXAMPLE_SHORT)}>
                Short example
              </button>
              <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setSequence(EXAMPLE_HBB)}>
                Hemoglobin β (HBB)
              </button>
            </div>
          </div>
        )}

        {/* FASTA UPLOAD MODE */}
        {mode === 'fasta' && (
          <div>
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFASTAFile(e.dataTransfer.files[0]) }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              style={{ marginBottom: fastaEntries.length ? 16 : 0 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".fasta,.fa,.fas,.faa,.txt"
                onChange={e => handleFASTAFile(e.target.files[0])}
              />
              {fastaFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <FileText size={20} color="var(--accent-amber)" />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{fastaFile.name}</span>
                  <span className="badge badge-amber">{fastaEntries.length} sequence{fastaEntries.length !== 1 ? 's' : ''}</span>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px' }}
                    onClick={(e) => { e.stopPropagation(); setFastaFile(null); setFastaEntries([]); setSequence(''); setResult(null) }}
                  >
                    <X size={14} /> Remove
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: 6 }}>
                    Drop a FASTA file here or click to browse
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Supports .fasta .fa .fas .faa — single or multi-sequence files
                  </div>
                </div>
              )}
            </div>

            {/* Multi-sequence selector */}
            {fastaEntries.length > 1 && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">Select sequence to analyze</label>
                <select
                  className="input"
                  value={selectedEntry}
                  onChange={e => handleEntryChange(Number(e.target.value))}
                >
                  {fastaEntries.map((entry, i) => (
                    <option key={i} value={i}>
                      {i + 1}. {entry.header.slice(0, 60)}{entry.header.length > 60 ? '…' : ''} ({entry.sequence.length} aa)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sequence preview */}
            {fastaEntries.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">
                  {fastaEntries[selectedEntry]?.header || 'Sequence'}
                  <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontWeight: 400 }}>
                    — {sequence.length} amino acids
                  </span>
                </label>
                <div style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: 'var(--accent-cyan)',
                  wordBreak: 'break-all',
                  lineHeight: 1.8,
                  maxHeight: 120,
                  overflowY: 'auto',
                }}>
                  {sequence}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROTEIN ID MODE */}
        {mode === 'id' && (
          <div className="form-group">
            <label className="label">UniProt Accession or Protein ID</label>
            <input
              className="input"
              placeholder="e.g. P68871 (HBB human hemoglobin beta)"
              value={proteinId}
              onChange={e => setProteinId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
              UniProt accession (P68871), RefSeq protein (NP_000509), or internal protein ID
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setProteinId('P68871')}>
                P68871 — HBB
              </button>
              <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setProteinId('P00533')}>
                P00533 — EGFR
              </button>
              <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setProteinId('P38398')}>
                P38398 — BRCA1
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || (
              mode === 'id' ? !proteinId.trim() :
              seqLen < 4
            )}
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Analyzing…</>
              : <><FlaskConical size={15} /> Analyze Protein</>
            }
          </button>
          {(result || error || fastaFile || sequence || proteinId) && (
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

            <div className="grid-3" style={{ marginBottom: 20 }}>
              {[
                ['Protein Name', result.protein_name || result.name || result.gene_name || '-'],
                ['Length', result.length ? `${result.length} aa` : result.sequence_length ? `${result.sequence_length} aa` : seqLen ? `${seqLen} aa` : '-'],
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

          <div className="card">
            <div className="section-header">
              <span className="section-title">Full API Response</span>
            </div>
            <pre className="json-viewer">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* FASTA format example */}
      {!result && mode === 'fasta' && !fastaFile && (
        <div className="card" style={{ marginTop: 20, opacity: 0.8 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Expected FASTA format
          </div>
          <pre className="json-viewer" style={{ fontSize: '0.75rem' }}>{`>HBB_HUMAN Hemoglobin subunit beta
MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLS
HGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFK
LLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR

>CFTR_HUMAN Cystic fibrosis transmembrane conductance
MQRSPLEKASVVSKLFFSWTRPILRKGYRQRLELSDIYQIPSVDSADNLSE...`}</pre>
        </div>
      )}
    </div>
  )
}
