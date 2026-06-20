# Genomirates Dashboard

React + Vite dashboard for the [Genomirates](https://genomirates-v5-1-1.onrender.com) clinical genomics API.

## Pages

| Route | Feature | API Endpoint |
|-------|---------|-------------|
| `/` | Overview & navigation | — |
| `/vcf` | VCF file upload & annotation | `POST /vcf/analyze` |
| `/carrier` | Carrier gene panel | `GET /carrier/genes` |
| `/compatibility` | Marriage compatibility check | `POST /carrier/marriage-compatibility` |
| `/pharma` | Pharmacogenomics panel | `GET /pharma/genes` |
| `/protein` | Protein sequence analysis | `POST /protein/analyze` |
| `/simulation` | Amino acid variant simulation | `POST /protein/simulate-variant` |
| `/sources` | Active annotation databases | `GET /info/data-sources` |

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repo (e.g. `genomirates-dashboard`)
2. In Vercel → New Project → Import that repo
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add custom domain: `app.genomirates.com` → point CNAME to `cname.vercel-dns.com`

The `vercel.json` handles SPA routing automatically.

## Stack

- React 18 + React Router v6
- Vite 5
- Lucide React icons
- Recharts (available for future charts)
- Zero external CSS frameworks — all custom CSS variables

## API Base URL

`https://genomirates-v5-1-1.onrender.com`

Change in `src/utils/api.js` if the backend URL changes.
