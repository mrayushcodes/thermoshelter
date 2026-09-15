/**
 * Solar visualization utilities for 3D scene
 */

import * as THREE from 'three';
import { SolarPosition } from '@/types/shelter3d';

export interface SunVisualizationOptions {
  showSunIcon?: boolean;
  showLightRays?: boolean;
  sunSize?: number;
  rayLength?: number;
}

/**
 * Create a sun visualization object
 */
export function createSunVisualization(
  solarPosition: SolarPosition,
  options: SunVisualizationOptions = {}
): THREE.Group {
  const {
    showSunIcon = true,
    showLightRays = true,
    sunSize = 2,
    rayLength = 50,
  } = options;
  
  const group = new THREE.Group();
  
  // Calculate sun position based on azimuth and elevation
  const azimuthRad = solarPosition.azimuth * (Math.PI / 180);
  const elevationRad = solarPosition.elevation * (Math.PI / 180);
  
  // Position the sun at a distance based on elevation and azimuth
  const distance = 100;
  const x = distance * Math.sin(azimuthRad) * Math.cos(elevationRad);
  const z = distance * Math.cos(azimuthRad) * Math.cos(elevationRad);
  const y = distance * Math.sin(elevationRad);
  
  group.position.set(x, y, z);
  group.lookAt(0, 0, 0);
  
  if (showSunIcon) {
    // Sun sphere
    const sunGeo = new THREE.SphereGeometry(sunSize, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      emissive: 0xFFA500,
      emissiveIntensity: 2,
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.name = 'sunIcon';
    group.add(sun);
    
    // Sun glow (simple halo)
    const glowGeo = new THREE.SphereGeometry(sunSize * 1.5, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xFFA500,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.name = 'sunGlow';
    group.add(glow);
  }
  
  if (showLightRays) {
    // Create light rays pointing toward origin
    const rayCount = 8;
    const rayMaterial = new THREE.LineBasicMaterial({ 
      color: 0xFFFF00, 
      transparent: true, 
      opacity: 0.5 
    });
    
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const radius = sunSize * 2;
      
      const points = [];
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
      points.push(new THREE.Vector3(0, 0, -rayLength));
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const ray = new THREE.Line(geometry, rayMaterial);
      ray.rotation.x = Math.PI / 2;
      ray.name = `sunRay_${i}`;
      group.add(ray);
    }
  }
  
  return group;
}

/**
 * Update sun position based on solar position data
 */
export function updateSunPosition(
  sunGroup: THREE.Group,
  solarPosition: SolarPosition,
  distance: number = 100
): void {
  const azimuthRad = solarPosition.azimuth * (Math.PI / 180);
  const elevationRad = solarPosition.elevation * (Math.PI / 180);
  
  const x = distance * Math.sin(azimuthRad) * Math.cos(elevationRad);
  const z = distance * Math.cos(azimuthRad) * Math.cos(elevationRad);
  const y = distance * Math.sin(elevationRad);
  
  sunGroup.position.set(x, y, z);
  sunGroup.lookAt(0, 0, 0);
}

/**
 * Create directional light representing solar radiation
 */
export function createSolarLight(intensity: number = 1.0): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(0xFFFFFF, intensity);
  light.position.set(50, 100, 50);
  light.castShadow = true;
  light.name = 'solarLight';
  return light;
}

/**
 * Update directional light to match solar position
 */
export function updateSolarLight(
  light: THREE.DirectionalLight,
  solarPosition: SolarPosition,
  intensity?: number
): void {
  const azimuthRad = solarPosition.azimuth * (Math.PI / 180);
  const elevationRad = solarPosition.elevation * (Math.PI / 180);
  
  const distance = 100;
  const x = distance * Math.sin(azimuthRad) * Math.cos(elevationRad);
  const z = distance * Math.cos(azimuthRad) * Math.cos(elevationRad);
  const y = distance * Math.sin(elevationRad);
  
  light.position.set(x, y, z);
  light.target.position.set(0, 0, 0);
  light.target.updateMatrixWorld();
  
  if (intensity !== undefined) {
    light.intensity = intensity;
  }
}

/**
 * Get sky color based on sun elevation
 */
export function getSkyColor(elevation: number): THREE.Color {
  if (elevation <= 0) {
    // Night sky
    return new THREE.Color(0x000011);
  } else if (elevation < 10) {
    // Dawn/dusk - orange/pink
    return new THREE.Color(0xFF7F50);
  } else if (elevation < 45) {
    // Morning/afternoon - light blue
    return new THREE.Color(0x87CEEB);
  } else {
    // Midday - bright blue
    return new THREE.Color(0x4A90E2);
  }
}

/**
 * Create a simple compass rose for orientation reference
 */
export function createCompass(size: number = 10): THREE.Group {
  const group = new THREE.Group();
  
  const arrowLength = size / 2;
  const arrowColor = {
    north: 0xFF0000,
    south: 0x0000FF,
    east: 0x00FF00,
    west: 0xFFFF00,
  };
  
  // North arrow (positive Z)
  const northArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 0),
    arrowLength,
    arrowColor.north,
    arrowLength * 0.3,
    arrowLength * 0.2
  );
  northArrow.name = 'northArrow';
  group.add(northArrow);
  
  // South arrow (negative Z)
  const southArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 0, 0),
    arrowLength,
    arrowColor.south,
    arrowLength * 0.3,
    arrowLength * 0.2
  );
  southArrow.name = 'southArrow';
  group.add(southArrow);
  
  // East arrow (positive X)
  const eastArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    arrowLength,
    arrowColor.east,
    arrowLength * 0.3,
    arrowLength * 0.2
  );
  eastArrow.name = 'eastArrow';
  group.add(eastArrow);
  
  // West arrow (negative X)
  const westArrow = new THREE.ArrowHelper(
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    arrowLength,
    arrowColor.west,
    arrowLength * 0.3,
    arrowLength * 0.2
  );
  westArrow.name = 'westArrow';
  group.add(westArrow);
  
  // Labels (using sprites would be better, but keeping it simple)
  // In a full implementation, you'd add text labels using CSS2DRenderer or SpriteText
  
  return group;
}
