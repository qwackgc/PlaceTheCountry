import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Globe from 'react-globe.gl'
import * as THREE from 'three'
import { feature } from 'topojson-client'

// Types for the component
interface CountryFeature {
  type: 'Feature'
  properties: {
    ADMIN?: string
    ISO_A2?: string
    POP_EST?: number
    NAME?: string
    [key: string]: any
  }
  geometry: any
}

// Color palette for countries - diverse, distinct colors
const COUNTRY_COLORS = [
  '#49ac8f', // Shopify green
  '#5fb399', // Light green
  '#4a90a4', // Ocean blue
  '#6fa86f', // Forest green
  '#8fb3d9', // Light blue
  '#7c9a92', // Sage
  '#a3c4bc', // Mint
  '#b8d4be', // Pale green
  '#90be6d', // Lime
  '#43aa8b', // Teal
  '#577590', // Navy
  '#6d597a', // Purple
  '#b56576', // Rose
  '#e09f3e', // Gold
  '#9b5de5', // Violet
  '#00bbf9', // Cyan
  '#fee440', // Yellow
  '#f15bb5', // Pink
  '#00f5d4', // Aquamarine
]

const AccurateGlobe: React.FC = () => {
  const globeEl = useRef<any>()
  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<CountryFeature | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get a consistent color for each country based on ISO code
  const getCountryColor = useCallback((country: CountryFeature) => {
    const isoCode = country.properties?.ISO_A2 || country.properties?.ISO_A3 || 'XX'
    let hash = 0
    for (let i = 0; i < isoCode.length; i++) {
      hash = isoCode.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colorIndex = Math.abs(hash) % COUNTRY_COLORS.length
    return COUNTRY_COLORS[colorIndex]
  }, [])

  // Load country data - using 50m resolution for better coastal detail
  useEffect(() => {
    const loadCountryData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Using 50m resolution for better coastal and state-level detail
        // This provides ~10x more detail than 110m resolution
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const topologyData = await response.json()
        const countries = feature(topologyData, topologyData.objects.countries) as any
        
        // Filter out Antarctica for better visualization
        const filteredCountries = countries.features.filter((feature: CountryFeature) => 
          feature.properties?.ISO_A2 !== 'AQ'
        )
        
        setCountries(filteredCountries)
        setIsLoading(false)
      } catch (err) {
        console.error('Error loading country data:', err)
        setError('Failed to load country data. Please try again.')
        setIsLoading(false)
      }
    }

    loadCountryData()
  }, [])

  // Initialize globe controls and animations
  useEffect(() => {
    if (!globeEl.current) return

    const globe = globeEl.current
    
    // Set up auto-rotation
    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.3
    
    // Set initial camera position for optimal viewing
    setTimeout(() => {
      globe.pointOfView(
        { 
          lat: 20, 
          lng: 0, 
          altitude: 2.0 
        }, 
        1000
      )
    }, 100)

    // Enable smooth interactions
    globe.controls().enableZoom = true
    globe.controls().enablePan = true
    globe.controls().enableRotate = true

  }, [])

  // Handle country selection
  const handleCountryClick = useCallback((polygon: any) => {
    const country = polygon as CountryFeature
    setSelectedCountry(country)
  }, [])

  // Handle country hover
  const handleCountryHover = useCallback((polygon: any | null) => {
    const country = polygon as CountryFeature | null
    setHoveredCountry(country)
  }, [])

  // Country polygon styling
  const getPolygonAltitude = useCallback((polygon: any) => {
    const country = polygon as CountryFeature
    let altitude = 0.01
    if (selectedCountry === country) altitude = 0.05
    else if (hoveredCountry === country) altitude = 0.02
    return altitude
  }, [selectedCountry, hoveredCountry])

  const getPolygonCapColor = useCallback((polygon: any) => {
    const country = polygon as CountryFeature
    if (selectedCountry === country) return '#ffd700' // Gold
    if (hoveredCountry === country) return '#ffffff' // White
    return getCountryColor(country)
  }, [selectedCountry, hoveredCountry, getCountryColor])

  const getPolygonSideColor = useCallback(() => {
    return 'rgba(0, 0, 0, 0)'
  }, [])

  const getPolygonStrokeColor = useCallback((polygon: any) => {
    const country = polygon as CountryFeature
    if (selectedCountry === country) return '#ffd700' // Gold
    if (hoveredCountry === country) return '#ffffff' // White
    return 'rgba(255, 255, 255, 0.5)' // Distinct white border
  }, [selectedCountry, hoveredCountry])

  const getPolygonLabel = useCallback((polygon: any) => {
    const country = polygon as CountryFeature
    if (!country.properties) return ''
    
    const name = country.properties.ADMIN || country.properties.NAME || 'Unknown'
    const iso2 = country.properties.ISO_A2 || ''
    const population = country.properties.POP_EST 
    
    return `
      <div style="
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 13px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(6px);
        min-width: 160px;
      ">
        <div style="font-weight: bold; font-size: 15px; margin-bottom: 6px; color: ${getCountryColor(country)};">
          ${name}
        </div>
        ${iso2 ? `<div style="opacity: 0.8;">ISO: ${iso2}</div>` : ''}
        ${population ? `<div style="opacity: 0.8;">Population: ${(population / 1_000_000).toFixed(1)}M</div>` : ''}
        ${selectedCountry === country ? '<div style="color: #ffd700; margin-top: 6px;">✓ Selected</div>' : ''}
      </div>
    `
  }, [selectedCountry, getCountryColor])

  // Custom globe material
  const globeMaterial = new THREE.MeshPhongMaterial({
    color: '#1a2033',
    opacity: 0.95,
    transparent: true,
    shininess: 10
  })

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontSize: '18px',
        background: '#08070e',
        color: '#5fb399'
      }}>
        Loading globe data...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#ff6b6b',
        background: '#08070e'
      }}>
        {error}
      </div>
    )
  }

  return (
    <div className="accurate-globe-container">
      <Globe
        ref={globeEl}
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg"
        backgroundColor="#08070e"
        globeMaterial={globeMaterial}
        atmosphereColor="#5784a7"
        atmosphereAltitude={0.5}
        
        polygonsData={countries}
        polygonAltitude={getPolygonAltitude}
        polygonCapColor={getPolygonCapColor}
        polygonSideColor={getPolygonSideColor}
        polygonStrokeColor={getPolygonStrokeColor}
        polygonLabel={getPolygonLabel}
        
        onPolygonClick={handleCountryClick}
        onPolygonHover={handleCountryHover}
        
        polygonsTransitionDuration={300}
        
        rendererConfig={{
          antialias: true,
          alpha: true
        }}
        
        animateIn={true}
      />
      
      {/* Selected country info panel */}
      {selectedCountry && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          maxWidth: '250px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ffd700' }}>
            {selectedCountry.properties.ADMIN || selectedCountry.properties.NAME}
          </h3>
          <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
            <div>Code: {selectedCountry.properties.ISO_A2}</div>
            {selectedCountry.properties.POP_EST && (
              <div>Population: {(selectedCountry.properties.POP_EST / 1_000_000).toFixed(1)}M</div>
            )}
            <button 
              onClick={() => setSelectedCountry(null)}
              style={{
                marginTop: '10px',
                padding: '5px 10px',
                background: '#49ac8f',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccurateGlobe
