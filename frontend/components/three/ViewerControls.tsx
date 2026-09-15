/**
 * Viewer Controls Component
 * 
 * Provides UI controls for the 3D viewer settings.
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Maximize, 
  Minimize, 
  Grid3X3, 
  Compass, 
  Sun, 
  Moon, 
  Thermometer, 
  ArrowUp, 
  Layers,
  RotateCcw,
  Eye,
  EyeOff,
  ScanLine
} from 'lucide-react';
import { VisualizationConfig } from '@/types/shelter3d';

interface ViewerControlsProps {
  config: VisualizationConfig;
  onConfigChange: (updates: Partial<VisualizationConfig>) => void;
}

export default function ViewerControls({ config, onConfigChange }: ViewerControlsProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  
  const toggleSetting = (key: keyof VisualizationConfig) => {
    onConfigChange({ [key]: !config[key] } as Partial<VisualizationConfig>);
  };
  
  return (
    <div className="bg-background/95 backdrop-blur border rounded-lg shadow-lg p-4 w-64">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">View Options</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>
      
      {isOpen && (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Display Modes */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Display Mode</Label>
            <div className="flex gap-2">
              <Button
                variant={config.dayNightMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onConfigChange({ dayNightMode: 'day' })}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-1" />
                Day
              </Button>
              <Button
                variant={config.dayNightMode === 'night' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onConfigChange({ dayNightMode: 'night' })}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-1" />
                Night
              </Button>
            </div>
          </div>
          
          {/* Overlays */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Overlays</Label>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Grid</span>
              </div>
              <Switch
                checked={config.showGrid}
                onCheckedChange={() => toggleSetting('showGrid')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Compass</span>
              </div>
              <Switch
                checked={config.showCompass}
                onCheckedChange={() => toggleSetting('showCompass')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Solar Direction</span>
              </div>
              <Switch
                checked={config.showSolarDirection}
                onCheckedChange={() => toggleSetting('showSolarDirection')}
              />
            </div>
          </div>
          
          {/* Thermal Visualizations */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Thermal</Label>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Thermal Overlay</span>
              </div>
              <Switch
                checked={config.showThermalOverlay}
                onCheckedChange={() => toggleSetting('showThermalOverlay')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Heat Flow Arrows</span>
              </div>
              <Switch
                checked={config.showHeatFlowArrows}
                onCheckedChange={() => toggleSetting('showHeatFlowArrows')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Heat Loss Overlay</span>
              </div>
              <Switch
                checked={config.showHeatLossOverlay}
                onCheckedChange={() => toggleSetting('showHeatLossOverlay')}
              />
            </div>
          </div>
          
          {/* View Modes */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">View Mode</Label>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Exploded View</span>
              </div>
              <Switch
                checked={config.showExplodedView}
                onCheckedChange={() => toggleSetting('showExplodedView')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Cutaway View</span>
              </div>
              <Switch
                checked={config.showCutawayView}
                onCheckedChange={() => toggleSetting('showCutawayView')}
              />
            </div>
          </div>
          
          {/* Camera */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Camera</Label>
            <div className="flex gap-2">
              <Button
                variant={config.cameraMode === 'perspective' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onConfigChange({ cameraMode: 'perspective' })}
                className="flex-1 text-xs"
              >
                Perspective
              </Button>
              <Button
                variant={config.cameraMode === 'orthographic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onConfigChange({ cameraMode: 'orthographic' })}
                className="flex-1 text-xs"
              >
                Orthographic
              </Button>
            </div>
          </div>
          
          {/* Reset View */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              // Reset to defaults would be handled by parent
              onConfigChange({
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
                dayNightMode: 'day',
                cameraMode: 'perspective',
              });
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset View
          </Button>
        </div>
      )}
    </div>
  );
}
