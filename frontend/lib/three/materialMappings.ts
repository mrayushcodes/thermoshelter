/**
 * Material mappings for 3D visualization
 * Maps material names/colors to Three.js materials
 */

import * as THREE from 'three';

export interface MaterialAppearance {
  color: string;
  roughness: number;
  metalness: number;
  transparent: boolean;
  opacity: number;
}

/**
 * Default material appearances for common building materials
 * Note: These are visual approximations for identification purposes only
 */
export const MATERIAL_APPEARANCES: Record<string, MaterialAppearance> = {
  // Structural materials
  brick: {
    color: '#B24A30',
    roughness: 0.9,
    metalness: 0.0,
    transparent: false,
    opacity: 1.0,
  },
  concrete: {
    color: '#8C8C8C',
    roughness: 0.8,
    metalness: 0.1,
    transparent: false,
    opacity: 1.0,
  },
  stone: {
    color: '#6B6B6B',
    roughness: 0.85,
    metalness: 0.05,
    transparent: false,
    opacity: 1.0,
  },
  wood: {
    color: '#8B5A2B',
    roughness: 0.7,
    metalness: 0.0,
    transparent: false,
    opacity: 1.0,
  },
  
  // Insulation materials
  rockWool: {
    color: '#D4C5A3',
    roughness: 0.95,
    metalness: 0.0,
    transparent: false,
    opacity: 1.0,
  },
  eps: {
    color: '#F5F5DC',
    roughness: 0.9,
    metalness: 0.0,
    transparent: false,
    opacity: 1.0,
  },
  xps: {
    color: '#FFE4B5',
    roughness: 0.85,
    metalness: 0.0,
    transparent: false,
    opacity: 1.0,
  },
  polyurethane: {
    color: '#FFF8DC',
    roughness: 0.8,
    metalness: 0.0,
    transparent: false,
    opacity: 1.0,
  },
  
  // Finish materials
  gypsum: {
    color: '#F8F8FF',
    roughness: 0.7,
    metalness: 0.0,
    transparent: false,
    opacity: 1.0,
  },
  plaster: {
    color: '#FAF0E6',
    roughness: 0.75,
    metalness: 0.0,
    transparent: false,
    opacity: 1.0,
  },
  
  // Glazing
  glass: {
    color: '#ADD8E6',
    roughness: 0.1,
    metalness: 0.0,
    transparent: true,
    opacity: 0.3,
  },
  doubleGlazing: {
    color: '#B0E0E6',
    roughness: 0.1,
    metalness: 0.0,
    transparent: true,
    opacity: 0.25,
  },
  
  // Other
  airGap: {
    color: '#E0E0E0',
    roughness: 1.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.5,
  },
  metal: {
    color: '#708090',
    roughness: 0.3,
    metalness: 0.8,
    transparent: false,
    opacity: 1.0,
  },
};

/**
 * Get material appearance by name with fallback
 */
export function getMaterialAppearance(materialName: string): MaterialAppearance {
  const normalizedName = materialName.toLowerCase().replace(/\s+/g, '');
  
  // Direct match
  if (MATERIAL_APPEARANCES[normalizedName]) {
    return MATERIAL_APPEARANCES[normalizedName];
  }
  
  // Partial match
  for (const [key, appearance] of Object.entries(MATERIAL_APPEARANCES)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return appearance;
    }
  }
  
  // Default fallback - light gray
  return {
    color: '#CCCCCC',
    roughness: 0.8,
    metalness: 0.1,
    transparent: false,
    opacity: 1.0,
  };
}

/**
 * Create Three.js material from appearance
 */
export function createThreeMaterial(appearance: MaterialAppearance): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: appearance.color,
    roughness: appearance.roughness,
    metalness: appearance.metalness,
    transparent: appearance.transparent,
    opacity: appearance.opacity,
    side: THREE.DoubleSide,
  });
}

/**
 * Get thermal overlay color based on temperature
 * Returns a color from blue (cold) to red (hot) scale
 */
export function getThermalColor(temperature: number, minTemp: number = 0, maxTemp: number = 40): string {
  // Clamp temperature to range
  const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temperature));
  const normalized = (clampedTemp - minTemp) / (maxTemp - minTemp);
  
  // Blue (0.0) -> Cyan -> Green -> Yellow -> Red (1.0)
  if (normalized < 0.25) {
    // Blue to Cyan
    const t = normalized / 0.25;
    return `rgb(${Math.round(0 * t)}, ${Math.round(128 + 127 * t)}, ${Math.round(255 * (1 - t))})`;
  } else if (normalized < 0.5) {
    // Cyan to Green
    const t = (normalized - 0.25) / 0.25;
    return `rgb(${Math.round(0 + 128 * t)}, ${Math.round(255 * (1 - t))}, ${Math.round(128 * (1 - t))})`;
  } else if (normalized < 0.75) {
    // Green to Yellow
    const t = (normalized - 0.5) / 0.25;
    return `rgb(${Math.round(128 + 127 * t)}, ${Math.round(255)}, ${Math.round(0)})`;
  } else {
    // Yellow to Red
    const t = (normalized - 0.75) / 0.25;
    return `rgb(${Math.round(255)}, ${Math.round(255 * (1 - t))}, ${Math.round(0)})`;
  }
}

/**
 * Get heat loss intensity color
 * Low loss: green, Medium: yellow, High: red
 */
export function getHeatLossColor(intensity: number, maxIntensity: number = 1): string {
  const normalized = Math.min(1, intensity / maxIntensity);
  
  if (normalized < 0.33) {
    return '#22C55E'; // Green
  } else if (normalized < 0.66) {
    return '#EAB308'; // Yellow
  } else {
    return '#EF4444'; // Red
  }
}
