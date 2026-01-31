import { useState } from 'react'
import AccurateGlobe from './components/AccurateGlobe'
import LowPolyGlobe from './components/LowPolyGlobe'
import Projection2DGlobe from './components/Projection2DGlobe'
import WebGPUGlobe from './components/WebGPUGlobe'
import './App.css'

const App = () => {
  const [globeType, setGlobeType] = useState<'accurate' | 'lowpoly' | 'projection2d' | 'webgpu' | 'placeholder'>('accurate')

  return (
    <div className="app">
      <div className="controls">
        <label htmlFor="globe-select">Globe Type:</label>
        <select 
          id="globe-select" 
          value={globeType} 
          onChange={(e) => setGlobeType(e.target.value as 'accurate' | 'lowpoly' | 'projection2d' | 'webgpu' | 'placeholder')}
        >
          <option value="accurate">Accurate Borders + Stylized</option>
          <option value="lowpoly">Low-Poly Artistic</option>
          <option value="projection2d">2D Projection Globe</option>
          <option value="webgpu">🚀 WebGPU Future-Proof</option>
          <option value="placeholder">Simple Placeholder</option>
        </select>
      </div>
      
      <div className="globe-container">
        {globeType === 'accurate' && <AccurateGlobe />}
        {globeType === 'lowpoly' && <LowPolyGlobe />}
        {globeType === 'projection2d' && <Projection2DGlobe />}
        {globeType === 'webgpu' && <WebGPUGlobe />}
        {globeType === 'placeholder' && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh',
            fontSize: '24px',
            opacity: 0.5
          }}>
            Simple Globe Placeholder
          </div>
        )}
      </div>
    </div>
  )
}

export default App