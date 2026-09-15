/**
 * Main 3D Shelter Scene Component
 * 
 * This is the root component for the 3D visualization.
 * It sets up the Three.js scene, camera, and renderer.
 */

'use client';

import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, AxesHelper, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { VisualizationConfig, DesignState } from '@/types/shelter3d';
import ShelterModel from './ShelterModel';
import SolarVisualization from './SolarVisualization';
import ViewerControls from './ViewerControls';

interface ShelterSceneProps {
  designState: DesignState;
  onComponentClick?: (component: string, data: any) => void;
}

const defaultConfig: VisualizationConfig = {
  showDimensions: true,
  showAxes: false,
  showGrid: true,
  showCompass: true,
  showSolarDirection: true,
  showThermalOverlay: false,
  showHeatFlowArrows: false,
  showHeatLossOverlay: false,
  showSolarExposure: false,
  showExplodedView: false,
  showCutawayView: false,
  cutawayPlane: 'z',
  cutawayPosition: 0,
  explodedOffset: 1,
  dayNightMode: 'day',
  cameraMode: 'perspective',
};

export default function ShelterScene({ designState, onComponentClick }: ShelterSceneProps) {
  const [config, setConfig] = useState<VisualizationConfig>(defaultConfig);
  
  const { geometry, thermalData, solarPosition, isLoading, error } = designState;
  
  // Calculate sky color based on sun elevation
  const skyColor = useMemo(() => {
    if (!solarPosition) return '#87CEEB';
    const elevation = solarPosition.elevation;
    
    if (elevation <= 0) return '#000011'; // Night
    if (elevation < 10) return '#FF7F50'; // Dawn/dusk
    if (elevation < 45) return '#87CEEB'; // Morning/afternoon
    return '#4A90E2'; // Midday
  }, [solarPosition]);
  
  const backgroundColor = useMemo(() => {
    if (config.dayNightMode === 'night') return '#000011';
    return skyColor;
  }, [config.dayNightMode, skyColor]);
  
  const handleConfigChange = (updates: Partial<VisualizationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };
  
  return (
    <div className="w-full h-full relative">
      {/* Control Panel Overlay */}
      <div className="absolute top-4 right-4 z-10">
        <ViewerControls config={config} onConfigChange={handleConfigChange} />
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading 3D model...</p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-md">
            {error}
          </div>
        </div>
      )}
      
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [15, 10, 15], fov: 50 }}
        style={{ background: backgroundColor }}
        gl={{ antialias: true }}
      >
        {/* Camera */}
        <PerspectiveCamera
          makeDefault
          position={[15, 10, 15]}
          fov={config.cameraMode === 'orthographic' ? 50 : 50}
        />
        
        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          target={[0, geometry.height / 2, 0]}
        />
        
        {/* Lighting */}
        <ambientLight intensity={config.dayNightMode === 'night' ? 0.2 : 0.5} />
        <directionalLight
          position={[50, 100, 50]}
          intensity={config.dayNightMode === 'night' ? 0 : 1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* Environment/Sky */}
        {config.dayNightMode === 'night' ? (
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        ) : (
          <>
            <Sky
              sunPosition={
                solarPosition
                  ? [
                      Math.sin(solarPosition.azimuth * Math.PI / 180) * 100,
                      Math.sin(solarPosition.elevation * Math.PI / 180) * 100,
                      Math.cos(solarPosition.azimuth * Math.PI / 180) * 100,
                    ]
                  : [50, 100, 50]
              }
              turbidity={10}
              rayleigh={2}
              mieCoefficient={0.005}
              mieDirectionalG={0.8}
            />
            <Environment preset={config.dayNightMode === 'night' ? 'night' : 'day'} />
          </>
        )}
        
        {/* Grid */}
        {config.showGrid && (
          <Grid
            position={[0, 0, 0]}
            args={[50, 50]}
            cellColor="#6b7280"
            sectionColor="#9ca3af"
            fadeDistance={30}
            fadeStrength={1}
          />
        )}
        
        {/* Axes Helper */}
        {config.showAxes && <AxesHelper args={[5]} />}
        
        {/* Compass */}
        {config.showCompass && (
          <group position={[0, 0, 0]}>
            {/* Simple compass arrows */}
            <arrowHelper
              args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 5, 0xff0000]}
              name="northArrow"
            />
          </group>
        )}
        
        {/* Shelter Model */}
        {!isLoading && !error && geometry && (
          <ShelterModel
            geometry={geometry}
            thermalData={thermalData}
            config={config}
            onClick={onComponentClick}
          />
        )}
        
        {/* Solar Visualization */}
        {config.showSolarDirection && solarPosition && (
          <SolarVisualization
            solarPosition={solarPosition}
            showSunIcon={true}
            showLightRays={config.dayNightMode === 'day'}
          />
        )}
      </Canvas>
      
      {/* Scientific Transparency Note */}
      <div className="absolute bottom-4 left-4 max-w-xs text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-2 rounded-md border">
        <p className="font-medium mb-1">Note:</p>
        <p>3D thermal visualization represents simplified model results, not CFD/FEA temperature fields.</p>
      </div>
    </div>
  );
}
