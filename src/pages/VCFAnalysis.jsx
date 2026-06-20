import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { analyzeVCF } from '../utils/api'

function VariantRow({ variant, index }) {
  const [expanded, setExpanded] = useState(false)
  const sig = variant.clinical_significance || variant.clinvar_significance || 'Unknown'
  const sigClass = sig.toLowerCase().includes('pathogenic') && !sig.toLowerCase().includes('likely')
    ? 'severity-pathogenic'
    : sig.toLowerCase().includes('likely_pathogenic') || (sig.toLowerCase().includes('likely') && sig.toLowerCase().includes('pathogenic'))
    ? 'severity-likely_pathogenic'
    : sig.toLowerCase().includes('benign')
    ? 'severity-benign'
    : 'severity-uncertain'

  return (
    <>
      <tr
        onClick={() => setExpanded(e => !e)}
        style={{ cursor: 'pointer' }}
      >
        <td><span className="mono" style={{ color: 'var(--accent-cyan)' }}>{variant.chromosome || variant.chr || '-'}</span></td>
        <td><span className="mono">{variant.position || variant.pos || '-'}</span></td>
        <td><span className="mono">{variant.ref || '-'}</span></td>
        <td><span className="mono">{variant.alt || '-'}</span></td>
        <td style={{ fontFamily: 'var(--font-body)' }}>{variant.gene || variant.gene_name || '-'}</td>
        <td><span className={sigClass} style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>{sig}</span></td>
        <td style={{ textAlign: 'center' }}>
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <div style={{
              background: 'var(--bg-base)',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <pre className="json-viewer" style={{ maxHeight: 200, fontSize: '0.75rem' }}>
                {JSON.stringify(variant, null, 2)}
              </pre>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function VCFAnalysis() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.vcf') && !f.name.endsWith('.vcf.gz')) {
      setError('Please upload a .vcf or .vcf.gz file')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const data = await analyzeVCF(fd)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const variants = result
    ? (result.variants || result.annotations || result.results || (Array.isArray(result) ? result : []))
    : []

  const downloadJSON = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.name || 'annotation'}_results.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2 className="page-title">VCF Analysis</h2>
        <p className="page-subtitle">
          Upload a VCF file to annotate variants against ClinVar 20240611 and refGene hg38
        </p>
      </div>

      {/* Upload zone */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <span className="section-title">Upload VCF File</span>
          <span className="badge badge-cyan">POST /vcf/analyze</span>
        </div>

        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".vcf,.vcf.gz"
            onChange={e => handleFile(e.target.files[0])}
          />
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color="var(--accent-cyan)" />
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{file.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 8px' }}
                onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setError(null) }}
              >
                <X size={14} /> Remove
              </button>
            </div>
          ) : (
            <div>
              <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: 6 }}>
                Drop a VCF file here or click to browse
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Supports .vcf and .vcf.gz — hg38 chromosome coordinates
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginTop: 12 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!file || loading}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16 }} /> Analyzing...</>
            ) : (
              <><Upload size={15} /> Run Annotation</>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="card fade-in">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={16} color="var(--accent-emerald)" />
              <span className="section-title">Annotation Results</span>
              <span className="badge badge-emerald">{variants.length} variants</span>
            </div>
            <button className="btn btn-secondary" onClick={downloadJSON} style={{ fontSize: '0.8rem' }}>
              <Download size={14} /> Export JSON
            </button>
          </div>

          {variants.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>CHR</th>
                    <th>POS</th>
                    <th>REF</th>
                    <th>ALT</th>
                    <th>GENE</th>
                    <th>CLINICAL SIG.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <VariantRow key={i} variant={v} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <div className="alert alert-info" style={{ marginBottom: 12 }}>
                <AlertCircle size={16} />
                Response received — displaying raw JSON below
              </div>
              <pre className="json-viewer">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Example VCF snippet */}
      {!result && (
        <div className="card" style={{ marginTop: 20, opacity: 0.75 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Expected VCF format (hg38)
          </div>
          <pre className="json-viewer" style={{ fontSize: '0.75rem' }}>{`##fileformat=VCFv4.2
##reference=hg38
#CHROM  POS       ID  REF  ALT  QUAL  FILTER  INFO
chr1    925952    .   G    A    .     .       .
chr7    117548628 .   T    A    .     .       .
chr17   43071077  .   G    A    .     .       .`}</pre>
        </div>
      )}
    </div>
  )
}
