import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, ChevronDown, ChevronUp, Table } from 'lucide-react'
import { analyzeVCF } from '../utils/api'

// Accepted file types
const ACCEPTED = ['.vcf', '.vcf.gz', '.tsv', '.csv', '.txt']

// Detect file type from name
function getFileType(name) {
  if (name.endsWith('.vcf.gz')) return 'vcf'
  if (name.endsWith('.vcf')) return 'vcf'
  if (name.endsWith('.tsv')) return 'tsv'
  if (name.endsWith('.csv')) return 'csv'
  if (name.endsWith('.txt')) return 'tsv' // treat plain text as tsv
  return null
}

// Parse TSV or CSV text into variant objects
function parseTSVorCSV(text, separator) {
  const lines = text.trim().split('\n').filter(l => l.trim() && !l.startsWith('##'))
  if (lines.length === 0) return []

  // First non-comment line is the header
  const headerLine = lines[0].startsWith('#') ? lines[0].replace(/^#/, '') : lines[0]
  const headers = headerLine.split(separator).map(h => h.trim().toLowerCase())

  // Map common column name variations
  const colMap = {
    chrom: ['chrom', 'chr', 'chromosome'],
    pos:   ['pos', 'position', 'start'],
    ref:   ['ref', 'reference', 'ref_allele'],
    alt:   ['alt', 'alternate', 'alt_allele', 'variant'],
    id:    ['id', 'rsid', 'variant_id'],
  }

  const findCol = (aliases) => {
    for (const alias of aliases) {
      const idx = headers.indexOf(alias)
      if (idx !== -1) return idx
    }
    return -1
  }

  const chromIdx = findCol(colMap.chrom)
  const posIdx   = findCol(colMap.pos)
  const refIdx   = findCol(colMap.ref)
  const altIdx   = findCol(colMap.alt)

  // If we can't find the basic columns return empty
  if (chromIdx === -1 || posIdx === -1) return []

  const dataLines = lines[0].startsWith('#') ? lines.slice(1) : lines.slice(1)

  return dataLines.map(line => {
    const cols = line.split(separator).map(c => c.trim())
    return {
      chr: cols[chromIdx] || '-',
      pos: cols[posIdx] || '-',
      ref: refIdx !== -1 ? (cols[refIdx] || '-') : '-',
      alt: altIdx !== -1 ? (cols[altIdx] || '-') : '-',
      gene: '-',
      clinical_significance: 'Pending annotation',
      _raw: line,
    }
  }).filter(v => v.chr !== '-')
}

// Convert TSV/CSV data into a VCF string for the API
function convertToVCF(variants) {
  const header = `##fileformat=VCFv4.2\n##reference=hg38\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO`
  const rows = variants.map(v =>
    `${v.chr}\t${v.pos}\t.\t${v.ref}\t${v.alt}\t.\t.\t.`
  ).join('\n')
  return header + '\n' + rows
}

function VariantRow({ variant }) {
  const [expanded, setExpanded] = useState(false)
  const sig = variant.clinical_significance || variant.clinvar_significance || 'Unknown'
  const sigClass =
    sig.toLowerCase().includes('pathogenic') && !sig.toLowerCase().includes('likely')
      ? 'severity-pathogenic'
      : sig.toLowerCase().includes('likely') && sig.toLowerCase().includes('pathogenic')
      ? 'severity-likely_pathogenic'
      : sig.toLowerCase().includes('benign')
      ? 'severity-benign'
      : 'severity-uncertain'

  return (
    <>
      <tr onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
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
            <div style={{ background: 'var(--bg-base)', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
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

// Badge showing the detected file type
function TypeBadge({ type }) {
  const map = {
    vcf:  { label: 'VCF',  cls: 'badge-cyan' },
    tsv:  { label: 'TSV',  cls: 'badge-violet' },
    csv:  { label: 'CSV',  cls: 'badge-emerald' },
  }
  const t = map[type] || { label: type?.toUpperCase() || 'FILE', cls: 'badge-cyan' }
  return <span className={`badge ${t.cls}`}>{t.label}</span>
}

export default function VCFAnalysis() {
  const [file, setFile] = useState(null)
  const [fileType, setFileType] = useState(null)
  const [parsedPreview, setParsedPreview] = useState([]) // for TSV/CSV preview
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    const type = getFileType(f.name)
    if (!type) {
      setError(`Unsupported file type. Please upload a VCF, TSV, or CSV file.`)
      return
    }
    setFile(f)
    setFileType(type)
    setError(null)
    setResult(null)
    setParsedPreview([])

    // If TSV or CSV, parse a preview immediately so user can confirm columns
    if (type === 'tsv' || type === 'csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        const sep = type === 'csv' ? ',' : '\t'
        const parsed = parseTSVorCSV(text, sep)
        if (parsed.length === 0) {
          setError('Could not detect columns. Make sure your file has CHROM and POS columns.')
          setFile(null)
          return
        }
        setParsedPreview(parsed.slice(0, 5)) // show first 5 rows as preview
      }
      reader.readAsText(f)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let fd = new FormData()

      if (fileType === 'vcf') {
        // Send directly
        fd.append('file', file)
      } else {
        // TSV/CSV — read, convert to VCF, send as VCF
        const text = await file.text()
        const sep = fileType === 'csv' ? ',' : '\t'
        const parsed = parseTSVorCSV(text, sep)
        if (parsed.length === 0) {
          throw new Error('No valid variants found in the file. Check your column headers.')
        }
        const vcfContent = convertToVCF(parsed)
        const vcfBlob = new Blob([vcfContent], { type: 'text/plain' })
        const vcfFile = new File([vcfBlob], file.name.replace(/\.(tsv|csv|txt)$/, '.vcf'), { type: 'text/plain' })
        fd.append('file', vcfFile)
      }

      const data = await analyzeVCF(fd)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setFileType(null)
    setParsedPreview([])
    setResult(null)
    setError(null)
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

  const downloadCSV = () => {
    if (!variants.length) return
    const headers = ['CHR', 'POS', 'REF', 'ALT', 'GENE', 'CLINICAL_SIGNIFICANCE']
    const rows = variants.map(v => [
      v.chromosome || v.chr || '',
      v.position || v.pos || '',
      v.ref || '',
      v.alt || '',
      v.gene || v.gene_name || '',
      v.clinical_significance || v.clinvar_significance || '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.name || 'annotation'}_results.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2 className="page-title">Variant Analysis</h2>
        <p className="page-subtitle">
          Upload a variant file to annotate against ClinVar 20240611 and refGene hg38
        </p>
      </div>

      {/* Supported formats info bar */}
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
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supported formats:</span>
        <span className="badge badge-cyan">VCF</span>
        <span className="badge badge-cyan">VCF.GZ</span>
        <span className="badge badge-violet">TSV</span>
        <span className="badge badge-emerald">CSV</span>
        <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>TXT</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          TSV and CSV are automatically converted to VCF before annotation
        </span>
      </div>

      {/* Upload zone */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <span className="section-title">Upload File</span>
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
            accept=".vcf,.vcf.gz,.tsv,.csv,.txt"
            onChange={e => handleFile(e.target.files[0])}
          />
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <FileText size={20} color="var(--accent-cyan)" />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{file.name}</span>
              <TypeBadge type={fileType} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 8px' }}
                onClick={(e) => { e.stopPropagation(); reset() }}
              >
                <X size={14} /> Remove
              </button>
            </div>
          ) : (
            <div>
              <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: 6 }}>
                Drop your file here or click to browse
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                VCF, VCF.GZ, TSV, CSV — hg38 chromosome coordinates
              </div>
            </div>
          )}
        </div>

        {/* TSV/CSV column preview */}
        {parsedPreview.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}>
              <Table size={14} color="var(--accent-violet)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Detected {parsedPreview.length}+ variants — preview of first rows:
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Columns mapped ✓</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="result-table" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th>CHR</th>
                    <th>POS</th>
                    <th>REF</th>
                    <th>ALT</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedPreview.map((v, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--accent-cyan)' }}>{v.chr}</td>
                      <td>{v.pos}</td>
                      <td>{v.ref}</td>
                      <td>{v.alt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
              This file will be converted to VCF format before annotation. Click Run Annotation to proceed.
            </div>
          </div>
        )}

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
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Analyzing...</>
              : <><Upload size={15} /> Run Annotation</>
            }
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={downloadCSV} style={{ fontSize: '0.8rem' }}>
                <Download size={14} /> Export CSV
              </button>
              <button className="btn btn-secondary" onClick={downloadJSON} style={{ fontSize: '0.8rem' }}>
                <Download size={14} /> Export JSON
              </button>
            </div>
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
                    <VariantRow key={i} variant={v} />
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

      {/* Format examples */}
      {!result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <div className="card" style={{ opacity: 0.8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              VCF format
            </div>
            <pre className="json-viewer" style={{ fontSize: '0.72rem' }}>{`##fileformat=VCFv4.2
#CHROM  POS        REF  ALT
chr7    117548628  T    A
chr11   5227002    C    T
chr17   43071077   G    A`}</pre>
          </div>
          <div className="card" style={{ opacity: 0.8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TSV / CSV format
            </div>
            <pre className="json-viewer" style={{ fontSize: '0.72rem' }}>{`CHROM   POS        REF  ALT
chr7    117548628  T    A
chr11   5227002    C    T
chr17   43071077   G    A`}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
