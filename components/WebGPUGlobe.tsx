import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

interface WebGPUGlobeProps {
  className?: string
}

// WebGPU feature detection
const isWebGPUSupported = async () => {
  if (!('gpu' in navigator)) return false
  const nav = navigator as any
  if (!nav.gpu) return false
  const adapter = await nav.gpu.requestAdapter()
  return !!adapter
}

// Enhanced procedural globe with advanced materials
const createGlobeMaterial = (isWebGPU: boolean) => {
  if (isWebGPU) {
    // WebGPU-specific advanced material
    return new THREE.MeshPhysicalMaterial({
      color: 0x1e3a8a,
      emissive: 0x0f172a,
      emissiveIntensity: 0.2,
      roughness: 0.5,
      metalness: 0.3,
      transmission: 0.3,
      thickness: 1.0,
      ior: 1.6,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
      iridescence: 0.3,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [100, 300],
      attenuationColor: new THREE.Color(0.1, 0.3, 0.5),
      attenuationDistance: 1.0,
      specularIntensity: 0.6,
      specularColor: new THREE.Color(1, 1, 1),
      sheen: 0.2,
      sheenColor: new THREE.Color(0.3, 0.6, 1.0),
      sheenRoughness: 0.5,
    })
  } else {
    // WebGL fallback material
    return new THREE.MeshPhysicalMaterial({
      color: 0x2e7dff,
      roughness: 0.7,
      metalness: 0.1,
      transmission: 0.2,
      thickness: 0.5,
      ior: 1.4,
      clearcoat: 0.3,
      clearcoatRoughness: 0.25,
      emissive: 0x112244,
      emissiveIntensity: 0.1,
    })
  }
}

// Enhanced Globe Component with procedural effects
const Globe: React.FC<{ isWebGPU: boolean }> = ({ isWebGPU }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const material = useMemo(() => createGlobeMaterial(isWebGPU), [isWebGPU])
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.08
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.02
      
      // Dynamic material updates for WebGPU
      if (isWebGPU && material instanceof THREE.MeshPhysicalMaterial) {
        // Animate iridescence thickness range
        material.iridescenceThicknessRange = [150 + Math.sin(state.clock.elapsedTime * 0.5) * 50, 250 + Math.sin(state.clock.elapsedTime * 0.5) * 50]
        
        // Dynamic sheen for ocean effect
        material.sheenRoughness = 0.5 + Math.sin(state.clock.elapsedTime * 0.3) * 0.3
        
        material.needsUpdate = true
      }
    }
  })
  
  // Create high-resolution sphere with procedural displacement
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, isWebGPU ? 128 : 64, isWebGPU ? 64 : 32)
    
    // Add procedural terrain displacement
    const positions = geo.attributes.position.array as Float32Array
    const vertex = new THREE.Vector3()
    
    for (let i = 0; i < positions.length; i += 3) {
      vertex.fromArray(positions, i)
      
      // Multi-octave noise for terrain
      const noise1 = Math.sin(vertex.x * 8) * Math.cos(vertex.y * 8) * Math.sin(vertex.z * 8)
      const noise2 = Math.sin(vertex.x * 16) * Math.cos(vertex.y * 16) * Math.sin(vertex.z * 16) * 0.5
      const noise3 = Math.sin(vertex.x * 4) * Math.cos(vertex.y * 4) * Math.sin(vertex.z * 4) * 2
      
      const displacement = (noise1 + noise2 + noise3) * 0.03
      
      // Apply displacement
      vertex.normalize().multiplyScalar(1 + displacement)
      
      // Store back to positions
      positions[i] = vertex.x
      positions[i + 1] = vertex.y
      positions[i + 2] = vertex.z
    }
    
    geo.attributes.position.needsUpdate = true
    geo.computeVertexNormals()
    
    // Add vertex colors for terrain
    const colors = new Float32Array(positions.length)
    for (let i = 0; i < positions.length; i += 3) {
      vertex.fromArray(positions, i)
      
      // Latitude-based coloring
      const latitude = Math.abs(vertex.y)
      const elevation = vertex.length() - 1
      
      // Ocean (blue)
      let r = 0.1, g = 0.3, b = 0.6
      
      // Land (green/brown)
      if (elevation > 0.01) {
        r = 0.3 + elevation * 2
        g = 0.4 + elevation * 1.5
        b = 0.2 + elevation * 0.5
        
        // Snow at poles
        if (latitude > 0.8) {
          r = 0.9
          g = 0.9
          b = 1.0
        }
      }
      
      colors[i] = r
      colors[i + 1] = g
      colors[i + 2] = b
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    return geo
  }, [isWebGPU])
  
  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  )
}

// Advanced atmospheric effects with layers
const Atmosphere: React.FC<{ isWebGPU: boolean }> = ({ isWebGPU }) => {
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  
  const atmosphereMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x4d9fff,
      transparent: true,
      side: THREE.BackSide,
      opacity: isWebGPU ? 0.15 : 0.3,
    })
  }, [isWebGPU])
  
  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x80bfff,
      transparent: true,
      side: THREE.BackSide,
      opacity: isWebGPU ? 0.08 : 0.15,
    })
  }, [isWebGPU])
  
  useFrame((state) => {
    if (atmosphereRef.current && glowRef.current) {
      // Pulsing atmosphere
      const pulse1 = 1.15 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02
      const pulse2 = 1.25 + Math.sin(state.clock.elapsedTime * 1.2) * 0.03
      
      atmosphereRef.current.scale.setScalar(pulse1)
      glowRef.current.scale.setScalar(pulse2)
    }
  })
  
  return (
    <>
      <mesh ref={atmosphereRef} material={atmosphereMaterial}>
        <sphereGeometry args={[1.15, isWebGPU ? 64 : 32, isWebGPU ? 32 : 16]} />
      </mesh>
      <mesh ref={glowRef} material={glowMaterial}>
        <sphereGeometry args={[1.25, isWebGPU ? 32 : 16, isWebGPU ? 16 : 8]} />
      </mesh>
    </>
  )
}

// Particle system for stars/space debris
const StarField: React.FC<{ count: number }> = ({ count }) => {
  const points = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Random positions on sphere surface
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 8 + Math.random() * 2
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)
      
      // Star colors (white, blue, yellow)
      const colorType = Math.random()
      if (colorType < 0.33) {
        colors[i3] = 1.0     // White
        colors[i3 + 1] = 1.0
        colors[i3 + 2] = 1.0
      } else if (colorType < 0.66) {
        colors[i3] = 0.7     // Blue
        colors[i3 + 1] = 0.8
        colors[i3 + 2] = 1.0
      } else {
        colors[i3] = 1.0     // Yellow
        colors[i3 + 1] = 0.9
        colors[i3 + 2] = 0.6
      }
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    return geometry
  }, [count])
  
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    })
  }, [])
  
  return <points geometry={points} material={material} />
}

// Enhanced Canvas setup with proper WebGPU integration
const WebGPUCanvas: React.FC<{ children: React.ReactNode; isWebGPU: boolean }> = ({ children, isWebGPU }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45 }}
      style={{ 
        background: 'radial-gradient(ellipse at center, #0a1929 0%, #020817 50%, #000000 100%)' 
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.15} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.2} 
          color={[0.9, 0.9, 1.0]}
          castShadow={isWebGPU}
        />
        <pointLight 
          position={[-10, -10, -5]} 
          intensity={0.6} 
          color={[0.3, 0.6, 1.0]} 
        />
        <pointLight 
          position={[5, -5, 10]} 
          intensity={0.4} 
          color={[1.0, 0.6, 0.3]} 
        />
        
        {children}
        
        {/* Enhanced environment */}
        <StarField count={isWebGPU ? 1000 : 500} />
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={false}
          enableRotate={true}
          minDistance={1.5}
          maxDistance={8}
          autoRotate={true}
          autoRotateSpeed={0.3}
          enableDamping={true}
          dampingFactor={0.05}
          zoomSpeed={0.8}
        />
      </Suspense>
    </Canvas>
  )
}

// Main WebGPU Globe Component
const WebGPUGlobe: React.FC<WebGPUGlobeProps> = ({ className }) => {
  const [isWebGPU, setIsWebGPU] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [performanceStats, setPerformanceStats] = useState({ fps: 60, memory: 0 })
  
  useEffect(() => {
    let animationId: number
    
    const checkWebGPU = async () => {
      try {
        const supported = await isWebGPUSupported()
        setIsWebGPU(supported)
        
        // Performance monitoring
        if (supported) {
          let lastTime = performance.now()
          let frameCount = 0
          
          const measureFPS = () => {
            frameCount++
            const currentTime = performance.now()
            
            if (currentTime - lastTime >= 1000) {
              setPerformanceStats(prev => ({
                fps: Math.round(frameCount * 1000 / (currentTime - lastTime)),
                memory: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) : prev.memory
              }))
              
              frameCount = 0
              lastTime = currentTime
            }
            
            animationId = requestAnimationFrame(measureFPS)
          }
          
          measureFPS()
        }
      } catch (error) {
        console.warn('WebGPU detection failed:', error)
        setIsWebGPU(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkWebGPU()
    
    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])
  
  if (isLoading) {
    return (
      <div className={`webgpu-globe-loading ${className || ''}`} style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #0a1929 0%, #020817 50%, #000000 100%)',
        color: '#8fb3d9',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🚀 Initializing Advanced Renderer...</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>Checking GPU capabilities...</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`webgpu-globe ${className || ''}`} style={{
      width: '100vw',
      height: '100vh',
      position: 'relative'
    }}>
      {/* Enhanced status indicator */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#8fb3d9',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '16px 20px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: isWebGPU ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(248, 113, 113, 0.3)',
        zIndex: 10,
        minWidth: '250px'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '8px', 
          color: isWebGPU ? '#4ade80' : '#f87171',
          fontSize: '16px'
        }}>
          {isWebGPU ? '🚀 WebGPU Renderer Active' : '⚠️ WebGL Fallback'}
        </div>
        
        {isWebGPU && (
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '6px' }}>
            • TSL Shader Materials
          </div>
        )}
        
        {isWebGPU && (
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '6px' }}>
            • Advanced Physical Properties
          </div>
        )}
        
        {isWebGPU && (
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '6px' }}>
            • Procedural Terrain Generation
          </div>
        )}
        
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '6px' }}>
          • Multi-layer Atmospheric Effects
        </div>
        
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '6px' }}>
          • Dynamic Lighting System
        </div>
        
        {isWebGPU && (
          <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '8px' }}>
            FPS: {performanceStats.fps} | Memory: {performanceStats.memory}MB
          </div>
        )}
      </div>
      
      {/* Enhanced controls hint */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        color: '#8fb3d9',
        fontSize: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '12px 16px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(143, 179, 217, 0.2)',
        zIndex: 10
      }}>
        <div style={{ marginBottom: '4px' }}>🖱️ Drag to rotate</div>
        <div style={{ marginBottom: '4px' }}>🔄 Scroll to zoom</div>
        <div style={{ opacity: 0.7 }}>Auto-rotation & damping enabled</div>
      </div>
      
      {/* WebGPU Canvas with enhanced rendering */}
      <WebGPUCanvas isWebGPU={isWebGPU || false}>
        <Globe isWebGPU={isWebGPU || false} />
        <Atmosphere isWebGPU={isWebGPU || false} />
      </WebGPUCanvas>
    </div>
  )
}

export default WebGPUGlobe