const BASE_URL = 'https://genomirates-v5-1-1.onrender.com'

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`
    try {
      const err = await res.json()
      errorMsg = err.detail || err.message || errorMsg
    } catch {}
    throw new Error(errorMsg)
  }
  return res.json()
}

// VCF Analysis
export async function analyzeVCF(formData) {
  const res = await fetch(`${BASE_URL}/vcf/analyze`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`
    try {
      const err = await res.json()
      errorMsg = err.detail || err.message || errorMsg
    } catch {}
    throw new Error(errorMsg)
  }
  return res.json()
}

// Carrier Screening
export async function getCarrierGenes() {
  return request('/carrier/genes')
}

export async function checkMarriageCompatibility(partner1, partner2) {
  return request('/carrier/marriage-compatibility', {
    method: 'POST',
    body: JSON.stringify({ partner1_id: partner1, partner2_id: partner2 }),
  })
}

// Pharmacogenomics
export async function getPharmaGenes() {
  return request('/pharma/genes')
}

// Protein Analysis
export async function analyzeProtein(payload) {
  return request('/protein/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function simulateVariant(payload) {
  return request('/protein/simulate-variant', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Data Sources
export async function getDataSources() {
  return request('/info/data-sources')
}

// Health check
export async function healthCheck() {
  return request('/health')
}
