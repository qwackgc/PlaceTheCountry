import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
// import { geoOrthographic } from 'd3-geo'
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

interface ProjectionConfig {
  rotate: [number, number, number]
  scale: number
  translate: [number, number]
}

const Projection2DGlobe: React.FC = () => {
  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<CountryFeature | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectionConfig, setProjectionConfig] = useState<ProjectionConfig>({
    rotate: [0, 0, 0],
    scale: 200,
    translate: [400, 300]
  })
  const [isRotating, setIsRotating] = useState(false)
  const [zoom, setZoom] = useState(1)
  const mapRef = useRef<HTMLDivElement>(null)

  // Load country data
  useEffect(() => {
    const loadCountryData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Load Natural Earth country boundaries (110m resolution)
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

  // Auto-rotation effect
  useEffect(() => {
    if (!isRotating) return
    
    const interval = setInterval(() => {
      setProjectionConfig(prev => ({
        ...prev,
        rotate: [(prev.rotate[0] + 0.5) % 360, prev.rotate[1], prev.rotate[2]]
      }))
    }, 50)

    return () => clearInterval(interval)
  }, [isRotating])

  // Handle country click
  const handleCountryClick = useCallback((geography: any) => {
    const country = geography as CountryFeature
    setSelectedCountry(country)
    setIsRotating(false) // Stop rotation when user interacts
  }, [])

  // Handle country hover
  const handleCountryHover = useCallback((geography: any | null) => {
    const country = geography as CountryFeature | null
    setHoveredCountry(country)
  }, [])

  // Handle rotation via mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!mapRef.current) return
    
    setIsRotating(false)
    const startX = e.clientX
    const startY = e.clientY
    const startRotate = [...projectionConfig.rotate] as [number, number, number]

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      
      setProjectionConfig(prev => ({
        ...prev,
        rotate: [
          (startRotate[0] + deltaX * 0.5) % 360,
          Math.max(-90, Math.min(90, startRotate[1] - deltaY * 0.5)),
          startRotate[2]
        ]
      }))
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [projectionConfig.rotate])

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)))
  }, [])

  // Create orthographic projection configuration
  const projectionConfigStr = `geoOrthographic().scale(${projectionConfig.scale}).rotate([${projectionConfig.rotate[0]}, ${projectionConfig.rotate[1]}]).translate([${projectionConfig.translate[0]}, ${projectionConfig.translate[1]}])`

  // Geography styling
  const getGeographyStyle = useCallback((geography: any) => {
    const country = geography as CountryFeature
    const isSelected = selectedCountry === country
    const isHovered = hoveredCountry === country
    
    return {
      default: {
        fill: isSelected ? '#5fb399' : isHovered ? '#66c0a8' : '#49ac8f',
        stroke: '#08070e',
        strokeWidth: isSelected ? 1.5 : isHovered ? 1.2 : 0.8,
        outline: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      },
      hover: {
        fill: isSelected ? '#5fb399' : '#66c0a8',
        stroke: '#08070e',
        strokeWidth: 1.5,
        outline: 'none',
        cursor: 'pointer'
      }
    }
  }, [selectedCountry, hoveredCountry])

  // Custom tooltip for countries
  // const getTooltip = useCallback((geography: any) => {
  //   const country = geography as CountryFeature
  //   if (!country.properties) return ''
  //   
  //   const name = country.properties.ADMIN || country.properties.NAME || 'Unknown'
  //   const iso2 = country.properties.ISO_A2 || ''
  //   const population = country.properties.POP_EST
  //   
  //   return (
  //     <div style={{
  //       background: 'rgba(0, 0, 0, 0.9)',
  //       color: 'white',
  //       padding: '8px 12px',
  //       borderRadius: '4px',
  //       fontSize: '12px',
  //       border: '1px solid rgba(255, 255, 255, 0.2)',
  //       backdropFilter: 'blur(4px)',
  //       maxWidth: '200px'
  //     }}>
  //       <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
  //         {name} {iso2 && `(${iso2})`}
  //       </div>
  //       {population && (
  //         <div>Population: {(population / 1_000_000).toFixed(1)}M</div>
  //       )}
  //       {selectedCountry === country && (
  //         <div style={{ color: '#5fb399', marginTop: '4px' }}>✓ Selected</div>
  //       )}
  //     </div>
  //   )
  // }, [selectedCountry])

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
        Loading 2D projection globe...
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
    <div 
      className="projection-2d-globe-container"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#08070e',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button
          onClick={() => setIsRotating(!isRotating)}
          style={{
            padding: '8px 16px',
            background: isRotating ? '#ff6b6b' : '#49ac8f',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isRotating ? 'Stop Rotation' : 'Start Rotation'}
        </button>
        
        <button
          onClick={() => {
            setProjectionConfig({
              rotate: [0, 0, 0],
              scale: 200,
              translate: [400, 300]
            })
            setZoom(1)
          }}
          style={{
            padding: '8px 16px',
            background: '#666',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Reset View
        </button>

        <div style={{
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '4px',
          color: 'white',
          fontSize: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: isRotating ? 'default' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <ComposableMap
          projection={projectionConfigStr}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#08070e'
          }}
        >
          <ZoomableGroup
            zoom={zoom}
            onMoveStart={() => setIsRotating(false)}
          >
            <Geographies geography={countries}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={getGeographyStyle(geo)}
                    onClick={() => handleCountryClick(geo)}
                    onMouseEnter={() => handleCountryHover(geo)}
                    onMouseLeave={() => handleCountryHover(null)}
                  />
                ))
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Selected country info panel */}
      {selectedCountry && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          maxWidth: '250px',
          zIndex: 1000
        }}>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            color: '#5fb399',
            fontSize: '16px'
          }}>
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

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.8)',
        maxWidth: '300px',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#5fb399' }}>
          2D Projection Globe
        </div>
        <div style={{ lineHeight: '1.4' }}>
          • Drag to rotate the globe<br/>
          • Scroll to zoom in/out<br/>
          • Click countries to select<br/>
          • Hover for country details
        </div>
      </div>
    </div>
  )
}

export default Projection2DGlobe