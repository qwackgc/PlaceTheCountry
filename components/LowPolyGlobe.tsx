import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LowPolyGlobeProps {
  className?: string
}

// Globe component that handles the 3D rendering
function Globe() {
  const meshRef = useRef<THREE.Mesh>(null)
  const wireframeRef = useRef<THREE.Mesh>(null)

  // Artistic color palette - tri-tone ocean colors
  const colorPalette = useMemo(() => ({
    deepOcean: '#1a3a52',
    midOcean: '#2e5f7a', 
    shallowOcean: '#4a90a4',
    lightOcean: '#8fb3d9',
    land: '#4a7c59',
    landLight: '#6fa86f',
    snow: '#f0f4f8'
  }), [])

  // Create gradient map for toon shading
  const gradientMap = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 2
    
    const context = canvas.getContext('2d')!
    
    // Create gradient with clean color transitions
    const gradient = context.createLinearGradient(0, 0, 256, 0)
    gradient.addColorStop(0, '#000000')
    gradient.addColorStop(0.25, '#1a3a52')
    gradient.addColorStop(0.5, '#2e5f7a')
    gradient.addColorStop(0.75, '#4a90a4')
    gradient.addColorStop(1, '#8fb3d9')
    
    context.fillStyle = gradient
    context.fillRect(0, 0, 256, 2)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    return texture
  }, [])

  // Create low-poly sphere geometry with vertex displacement
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(2, 12, 8) // Low poly: 12 width segments, 8 height segments
    
    // Add vertex displacement for terrain variation
    const positions = geo.attributes.position.array as Float32Array
    const vertex = new THREE.Vector3()
    
    for (let i = 0; i < positions.length; i += 3) {
      vertex.fromArray(positions, i)
      
      // Add noise-based displacement
      const noise = Math.sin(vertex.x * 4) * Math.cos(vertex.y * 4) * Math.sin(vertex.z * 4)
      const displacement = noise * 0.08 // Subtle terrain variation
      
      // Add some larger scale variation for landmass-like features
      const largeScaleNoise = Math.sin(vertex.x * 2) * Math.sin(vertex.y * 2)
      const largeDisplacement = largeScaleNoise * 0.12
      
      // Combine noises
      vertex.normalize().multiplyScalar(1 + displacement + largeDisplacement)
      
      // Store back to positions
      positions[i] = vertex.x
      positions[i + 1] = vertex.y
      positions[i + 2] = vertex.z
    }
    
    geo.attributes.position.needsUpdate = true
    geo.computeVertexNormals()
    
    return geo
  }, [])

  // Create toon shader material with clean color transitions
  const material = useMemo(() => {
    return new THREE.MeshToonMaterial({
      color: colorPalette.midOcean,
      gradientMap: gradientMap
    })
  }, [colorPalette.midOcean, gradientMap])

  // Add some wireframe accents for artistic effect
  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: colorPalette.lightOcean,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    })
  }, [colorPalette.lightOcean])

  // Animation frame update
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y += delta * 0.3
      wireframeRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} material={material} />
      <mesh ref={wireframeRef} geometry={geometry} material={wireframeMaterial} />
    </group>
  )
}

const LowPolyGlobe: React.FC<LowPolyGlobeProps> = ({ className }) => {
  // Artistic color palette for UI elements
  const colorPalette = useMemo(() => ({
    deepOcean: '#1a3a52',
    midOcean: '#2e5f7a', 
    shallowOcean: '#4a90a4',
    lightOcean: '#8fb3d9',
    land: '#4a7c59',
    landLight: '#6fa86f',
    snow: '#f0f4f8'
  }), [])

  return (
    <div className={`low-poly-globe ${className || ''}`} style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #0a0e1a 0%, #1a2332 50%, #0f1419 100%)',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: colorPalette.lightOcean,
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '10px 15px',
        borderRadius: '6px',
        backdropFilter: 'blur(10px)',
        zIndex: 10
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Low-Poly Artistic Globe</div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>12×8 geometry • Toon shading</div>
      </div>

      <Canvas
        camera={{ 
          position: [0, 0, 6], 
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Lighting setup for toon shading */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.2}
          castShadow
        />
        <directionalLight 
          position={[-10, -10, -5]} 
          intensity={0.3}
          color={colorPalette.lightOcean}
        />
        
        {/* Main globe component */}
        <Globe />
        
        {/* Optional: Add stars background */}
        <Stars />
      </Canvas>
    </div>
  )
}

// Simple starfield component for background
function Stars() {
  const stars = useMemo(() => {
    const starPositions = []
    const starCount = 500
    
    for (let i = 0; i < starCount; i++) {
      const [x, y, z] = Array.from({ length: 3 }, () => (Math.random() - 0.5) * 100)
      starPositions.push(x, y, z)
    }
    
    return starPositions
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={stars.length / 3}
          array={new Float32Array(stars)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#8fb3d9"
        size={0.05}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

export default LowPolyGlobe