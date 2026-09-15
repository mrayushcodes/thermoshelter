/**
 * Solar Visualization Component
 * 
 * Renders the sun and solar direction indicators in the 3D scene.
 */

'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SolarPosition } from '@/types/shelter3d';
import { createSunVisualization, updateSunPosition, createSolarLight, updateSolarLight } from '@/lib/three/solarVisualization';

interface SolarVisualizationProps {
  solarPosition: SolarPosition;
  showSunIcon?: boolean;
  showLightRays?: boolean;
}

export default function SolarVisualization({ 
  solarPosition, 
  showSunIcon = true, 
  showLightRays = true 
}: SolarVisualizationProps) {
  const sunGroupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  
  // Create sun visualization only once
  const sunVisualization = useMemo(() => {
    return createSunVisualization(solarPosition, {
      showSunIcon,
      showLightRays,
      sunSize: 2,
      rayLength: 50,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Update sun position on each frame or when solar position changes
  useFrame(() => {
    if (sunGroupRef.current && solarPosition) {
      updateSunPosition(sunGroupRef.current, solarPosition, 100);
    }
    
    if (lightRef.current && solarPosition) {
      updateSolarLight(lightRef.current, solarPosition);
    }
  });
  
  return (
    <>
      {/* Sun visualization group */}
      <primitive 
        ref={sunGroupRef}
        object={sunVisualization} 
      />
      
      {/* Directional light representing solar radiation */}
      <directionalLight
        ref={lightRef}
        position={[50, 100, 50]}
        intensity={solarPosition.elevation > 0 ? solarPosition.irradiance / 1000 : 0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  );
}
