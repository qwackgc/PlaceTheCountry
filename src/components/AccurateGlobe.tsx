import React, { useRef, useEffect, useState, useCallback } from 'react'
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





const AccurateGlobe: React.FC = () => {
  const globeEl = useRef<any>()
  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<CountryFeature | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load country data
  useEffect(() => {
    const loadCountryData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Load Natural Earth country boundaries (110m resolution)
        // Using the same data source as the react-globe.gl example
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
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
    globe.controls().autoRotateSpeed = 0.5
    
    // Set initial camera position for optimal viewing
    setTimeout(() => {
      globe.pointOfView(
        { 
          lat: 20, 
          lng: 0, 
          altitude: 2.5 
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
    
    // Zoom into selected country - use a simple approximation
    // In production, you'd calculate the actual centroid from the geometry
    if (globeEl.current && country.properties?.NAME) {
      globeEl.current.pointOfView({
        lat: 20, // Default to a nice viewing angle
        lng: 0,
        altitude: 1.5
      }, 1000)
    }
  }, [])

  // Handle country hover
  const handleCountryHover = useCallback((polygon: any | null) => {
    const country = polygon as CountryFeature | null
    setHoveredCountry(country)
  }, [])

  // Country polygon styling functions
  const getPolygonAltitude = useCallback((polygon: any) => {
    const country = polygon as CountryFeature
    // Base altitude with slight elevation for all countries
    let altitude = 0.01
    
    // Higher altitude for selected country
    if (selectedCountry === country) {
      altitude = 0.05
    }
    // Slight elevation for hovered country
    else if (hoveredCountry === country) {
      altitude = 0.02
    }
    
    return altitude
  }, [selectedCountry, hoveredCountry])

  const getPolygonCapColor = useCallback((polygon: any) => {
    const country = polygon as CountryFeature
    // Shopify-inspired color scheme
    const baseColor = '#49ac8f' // Shopify green
    const selectedColor = '#5fb399' // Lighter green for selected
    const hoveredColor = '#66c0a8' // Even lighter for hover
    
    if (selectedCountry === country) return selectedColor
    if (hoveredCountry === country) return hoveredColor
    return baseColor
  }, [selectedCountry, hoveredCountry])

  const getPolygonSideColor = useCallback(() => {
    // Transparent sides for clean look
    return 'rgba(0, 0, 0, 0)'
  }, [])

  // Custom label for countries
  const getPolygonLabel = useCallback((polygon: any) => {
    const country = polygon as CountryFeature
    if (!country.properties) return ''
    
    const name = country.properties.ADMIN || country.properties.NAME || 'Unknown'
    const iso2 = country.properties.ISO_A2 || ''
    const population = country.properties.POP_EST 
    
    return `
      <div style="
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(4px);
      ">
        <div style="font-weight: bold; margin-bottom: 4px;">${name} ${iso2 ? `(${iso2})` : ''}</div>
        ${population ? `<div>Population: ${(population / 1_000_000).toFixed(1)}M</div>` : ''}
        ${selectedCountry === country ? '<div style="color: #5fb399;">✓ Selected</div>' : ''}
      </div>
    `
  }, [selectedCountry])

  // Custom globe material for Shopify-style appearance
  const globeMaterial = new THREE.MeshPhongMaterial({
    color: '#1a2033', // Deep blue base
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
        background: '#08070e'
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
        // Globe appearance
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg"
        backgroundColor="#08070e"
        globeMaterial={globeMaterial}
        
        // Atmosphere effects
        atmosphereColor="#5784a7"
        atmosphereAltitude={0.5}
        
        // Country polygons
        polygonsData={countries}
        polygonAltitude={getPolygonAltitude}
        polygonCapColor={getPolygonCapColor}
        polygonSideColor={getPolygonSideColor}
        polygonLabel={getPolygonLabel}
        
        // Interactions
        onPolygonClick={handleCountryClick}
        onPolygonHover={handleCountryHover}
        
        // Animation and transitions
        polygonsTransitionDuration={300}
        
        // Renderer configuration for better quality
        rendererConfig={{
          antialias: true,
          alpha: true
        }}
        
        // Performance optimizations
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
          <h3 style={{ margin: '0 0 10px 0', color: '#5fb399' }}>
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