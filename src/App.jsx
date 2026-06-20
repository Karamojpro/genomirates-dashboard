import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import VCFAnalysis from './pages/VCFAnalysis'
import CarrierScreening from './pages/CarrierScreening'
import MarriageCompatibility from './pages/MarriageCompatibility'
import Pharmacogenomics from './pages/Pharmacogenomics'
import ProteinAnalysis from './pages/ProteinAnalysis'
import VariantSimulation from './pages/VariantSimulation'
import DataSources from './pages/DataSources'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="vcf" element={<VCFAnalysis />} />
          <Route path="carrier" element={<CarrierScreening />} />
          <Route path="compatibility" element={<MarriageCompatibility />} />
          <Route path="pharma" element={<Pharmacogenomics />} />
          <Route path="protein" element={<ProteinAnalysis />} />
          <Route path="simulation" element={<VariantSimulation />} />
          <Route path="sources" element={<DataSources />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
