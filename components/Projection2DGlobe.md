<!-- Context: components/projection-2d-globe | Priority: high | Version: 1.0 | Updated: 2026-01-30 -->

# Projection2DGlobe Component

Interactive 2D globe visualization using orthographic projection with react-simple-maps.

## Overview

The Projection2DGlobe component provides a flat, interactive globe representation using D3's orthographic projection. It features smooth animations, country selection, zoom controls, and auto-rotation capabilities with a modern, dark theme design.

## Key Features

- **2D Orthographic Projection**: Flat globe view using react-simple-maps
- **Interactive Controls**: Drag rotation, scroll zoom, country selection
- **Auto-rotation**: Toggle automatic globe rotation
- **Country Information**: Display ISO codes and population data
- **Responsive Design**: Full viewport coverage with adaptive controls
- **Modern UI**: Dark theme with Shopify-inspired green color scheme

## Installation

The component uses the following dependencies:
```bash
npm install react-simple-maps topojson-client
```

## Quick Start

```typescript
import { Projection2DGlobe } from './components'

function App() {
  return <Projection2DGlobe />
}
```

## Features in Detail

### Interactive Controls
- **Drag Rotation**: Click and drag to rotate the globe manually
- **Scroll Zoom**: Mouse wheel zoom (50% - 300% range)
- **Country Selection**: Click countries to view detailed information
- **Auto-rotation**: Toggle button for continuous rotation

### Visual Design
- **Dark Theme**: Background color #08070e for high contrast
- **Color Scheme**: Shopify-inspired green (#49ac8f, #5fb399, #66c0a8)
- **Smooth Transitions**: CSS transitions for hover and selection states
- **Responsive Layout**: Full viewport coverage with positioned UI elements

### Data Integration
- **Natural Earth Data**: 110m country boundaries from CDN
- **Real-time Loading**: Fetches latest geographic data
- **Country Properties**: ISO_A2 codes, names, population estimates
- **Antarctica Filter**: Excluded for better visualization

## Component Architecture

### State Management
```typescript
const [countries, setCountries] = useState<CountryFeature[]>([])
const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null)
const [hoveredCountry, setHoveredCountry] = useState<CountryFeature | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [isRotating, setIsRotating] = useState(false)
const [zoom, setZoom] = useState(1)
```

### Projection Configuration
```typescript
const [projectionConfig, setProjectionConfig] = useState<ProjectionConfig>({
  rotate: [0, 0, 0],
  scale: 200,
  translate: [400, 300]
})
```

## Customization

### Styling Countries
```typescript
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
```

### Data Source Configuration
The component fetches data from:
```
https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
```

Custom data sources can be implemented by modifying the `loadCountryData` function.

## Performance Optimizations

- **110m Resolution**: Optimal balance between detail and performance
- **Efficient State Updates**: Callback functions prevent unnecessary re-renders
- **CSS Transitions**: Hardware-accelerated animations
- **Conditional Rendering**: Only renders UI elements when needed
- **Debounced Interactions**: Smooth response to user input

## Browser Compatibility

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

No WebGL required - uses SVG/DOM rendering.

## Troubleshooting

### Common Issues

**Countries not loading:**
- Check network connection to CDN
- Verify data URL is accessible
- Monitor browser console for CORS errors

**Rotation not working:**
- Ensure mouse events are not blocked by other elements
- Check if auto-rotation is enabled
- Verify projection configuration

**Performance issues:**
- Reduce zoom level for large datasets
- Consider debasing country resolution
- Monitor memory usage with development tools

### Debug Information

The component includes built-in debug states:
- Loading indicators during data fetch
- Error handling with user-friendly messages
- Console logging for development debugging

## Future Enhancements

- **Custom Data Support**: API for loading custom geographic data
- **Theming System**: Configurable color schemes
- **Accessibility**: Screen reader support and keyboard navigation
- **Animation Presets**: Pre-configured rotation patterns
- **Export Functionality**: Save current view as image

## Dependencies

- **react-simple-maps**: Core mapping functionality
- **topojson-client**: Geographic data processing
- **React 18**: Component framework with hooks
- **TypeScript**: Type safety and development experience