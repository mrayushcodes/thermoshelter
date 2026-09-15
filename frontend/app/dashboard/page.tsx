"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Thermometer, Sun, Wind, Home, LineChart, Settings, BookOpen, ArrowLeft, Play, Save, Download } from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SimulationResult {
  summary: {
    avg_indoor_temp: number;
    min_indoor_temp: number;
    max_indoor_temp: number;
    comfort_hours_percent: number;
    heating_requirement_kwh: number;
    total_solar_gain_kwh: number;
    total_heat_loss_kwh: number;
    efficiency_score: number;
    heat_loss_breakdown: Record<string, number>;
  };
  timeseries: Array<{
    timestamp: string;
    outdoor_temperature: number;
    indoor_temperature: number;
    solar_irradiance: number;
    solar_gain: number;
  }>;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"design" | "results" | "compare">("design");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  // Design parameters
  const [design, setDesign] = useState({
    location: "Leh, Ladakh",
    latitude: 34.1526,
    longitude: 77.5771,
    length: 5.0,
    width: 4.0,
    height: 3.0,
    orientation: 180,
    windowPercentage: 12,
    doorArea: 2.0,
    thermalMassKg: 500,
    ach: 0.5,
    comfortMin: 18,
    comfortMax: 26,
    wallInsulationMm: 50,
    roofInsulationMm: 100,
  });

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    
    try {
      // Create a design first
      const designResponse = await fetch(`${API_URL}/api/designs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My Shelter Design",
          location_name: design.location,
          latitude: design.latitude,
          longitude: design.longitude,
          length: design.length,
          width: design.width,
          height: design.height,
          shape: "rectangular",
          orientation: design.orientation,
          window_percentage: design.windowPercentage,
          door_area: design.doorArea,
          thermal_mass_kg: design.thermalMassKg,
          ach: design.ach,
          comfort_temp_min: design.comfortMin,
          comfort_temp_max: design.comfortMax,
          wall_assembly_json: JSON.stringify([
            { material_id: 1, thickness: 0.23 },
            { material_id: 5, thickness: design.wallInsulationMm / 1000 },
          ]),
          roof_assembly_json: JSON.stringify([
            { material_id: 2, thickness: 0.15 },
            { material_id: 5, thickness: design.roofInsulationMm / 1000 },
          ]),
          floor_assembly_json: JSON.stringify([
            { material_id: 2, thickness: 0.15 },
          ]),
        }),
      });
      
      const designData = await designResponse.json();
      
      // Run simulation
      const simResponse = await fetch(`${API_URL}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          design_id: designData.id,
          timestep_minutes: 30,
          duration_days: 7,
        }),
      });
      
      const result = await simResponse.json();
      
      setSimulationResult({
        summary: {
          avg_indoor_temp: result.avg_indoor_temp,
          min_indoor_temp: result.min_indoor_temp,
          max_indoor_temp: result.max_indoor_temp,
          comfort_hours_percent: result.comfort_hours_percent,
          heating_requirement_kwh: result.heating_requirement_kwh,
          total_solar_gain_kwh: result.total_solar_gain_kwh,
          total_heat_loss_kwh: result.total_heat_loss_kwh,
          efficiency_score: result.efficiency_score,
          heat_loss_breakdown: result.heat_loss_breakdown || {},
        },
        timeseries: result.timeseries || [],
      });
      
      setActiveTab("results");
    } catch (error) {
      console.error("Simulation error:", error);
      alert("Simulation failed. Please check that the backend is running.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-bold">ThermoShelter</span>
            </Link>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium">Dashboard</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab("design")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "design" ? "bg-secondary" : "hover:bg-secondary"
              }`}
            >
              Design
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "results" ? "bg-secondary" : "hover:bg-secondary"
              }`}
            >
              Results
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === "design" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Design Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Location & Climate */}
              <section className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Location & Climate
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <select
                      value={design.location}
                      onChange={(e) => {
                        const loc = e.target.value;
                        let lat = 34.1526, lon = 77.5771;
                        if (loc.includes("Delhi")) { lat = 28.7041; lon = 77.1025; }
                        else if (loc.includes("Chennai")) { lat = 13.0827; lon = 80.2707; }
                        setDesign({ ...design, location: loc, latitude: lat, longitude: lon });
                      }}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="Leh, Ladakh">Leh, Ladakh</option>
                      <option value="Kargil">Kargil</option>
                      <option value="Srinagar">Srinagar</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Jaisalmer">Jaisalmer</option>
                      <option value="Chandigarh">Chandigarh</option>
                      <option value="Chennai">Chennai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Coordinates</label>
                    <div className="text-sm text-muted-foreground px-3 py-2">
                      {design.latitude.toFixed(4)}°N, {design.longitude.toFixed(4)}°E
                    </div>
                  </div>
                </div>
              </section>

              {/* Geometry */}
              <section className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Shelter Geometry
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Length (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={design.length}
                      onChange={(e) => setDesign({ ...design, length: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Width (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={design.width}
                      onChange={(e) => setDesign({ ...design, width: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Height (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={design.height}
                      onChange={(e) => setDesign({ ...design, height: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Orientation (degrees)</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={design.orientation}
                      onChange={(e) => setDesign({ ...design, orientation: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-sm text-muted-foreground text-center mt-1">
                      {design.orientation}° ({getOrientationName(design.orientation)})
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Floor Area</label>
                    <div className="text-sm px-3 py-2 bg-muted rounded-md">
                      {(design.length * design.width).toFixed(1)} m²
                    </div>
                  </div>
                </div>
              </section>

              {/* Construction */}
              <section className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Construction Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Wall Insulation (mm)</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={design.wallInsulationMm}
                      onChange={(e) => setDesign({ ...design, wallInsulationMm: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-sm text-muted-foreground text-center">{design.wallInsulationMm} mm</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Roof Insulation (mm)</label>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      value={design.roofInsulationMm}
                      onChange={(e) => setDesign({ ...design, roofInsulationMm: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-sm text-muted-foreground text-center">{design.roofInsulationMm} mm</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Window Area (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={design.windowPercentage}
                      onChange={(e) => setDesign({ ...design, windowPercentage: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Thermal Mass (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={design.thermalMassKg}
                      onChange={(e) => setDesign({ ...design, thermalMassKg: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Comfort Range */}
              <section className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Comfort Range
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Minimum Comfort (°C)</label>
                    <input
                      type="number"
                      value={design.comfortMin}
                      onChange={(e) => setDesign({ ...design, comfortMin: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Maximum Comfort (°C)</label>
                    <input
                      type="number"
                      value={design.comfortMax}
                      onChange={(e) => setDesign({ ...design, comfortMax: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </section>

              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSimulating ? (
                  <>Running Simulation...</>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Simulation
                  </>
                )}
              </button>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume</span>
                    <span>{(design.length * design.width * design.height).toFixed(1)} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wall Area</span>
                    <span>{(2 * (design.length + design.width) * design.height).toFixed(1)} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Surface/Volume</span>
                    <span>{((2 * (design.length + design.width) * design.height + 2 * design.length * design.width) / (design.length * design.width * design.height)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Model Info</h3>
                <p className="text-sm text-muted-foreground">
                  This simulation uses a physics-based transient thermal model with energy balance calculations. 
                  Results are illustrative and should not be used for final construction design without validation.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "results" && simulationResult && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Avg Indoor Temp"
                value={`${simulationResult.summary.avg_indoor_temp.toFixed(1)}°C`}
                subtitle={`Min: ${simulationResult.summary.min_indoor_temp.toFixed(1)}°C`}
              />
              <KPICard
                title="Comfort Hours"
                value={`${simulationResult.summary.comfort_hours_percent.toFixed(0)}%`}
                subtitle="Within target range"
              />
              <KPICard
                title="Heating Required"
                value={`${simulationResult.summary.heating_requirement_kwh.toFixed(1)} kWh`}
                subtitle="Over simulation period"
              />
              <KPICard
                title="Efficiency Score"
                value={simulationResult.summary.efficiency_score.toFixed(0)}
                subtitle="Out of 100"
                highlight
              />
            </div>

            {/* Temperature Chart */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Indoor vs Outdoor Temperature</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={simulationResult.timeseries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleDateString()} />
                    <YAxis label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="outdoor_temperature" name="Outdoor" stroke="#64748b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="indoor_temperature" name="Indoor" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Heat Loss Breakdown */}
            {Object.keys(simulationResult.summary.heat_loss_breakdown).length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Heat Loss Breakdown</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(simulationResult.summary.heat_loss_breakdown).map(([key, value]) => ({ name: key, value }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Additional Metrics */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Solar Gain</span>
                </div>
                <div className="text-2xl font-bold">{simulationResult.summary.total_solar_gain_kwh.toFixed(1)} kWh</div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Heat Loss</span>
                </div>
                <div className="text-2xl font-bold">{simulationResult.summary.total_heat_loss_kwh.toFixed(1)} kWh</div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Max Indoor</span>
                </div>
                <div className="text-2xl font-bold">{simulationResult.summary.max_indoor_temp.toFixed(1)}°C</div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("design")}
                className="bg-secondary text-secondary-foreground px-6 py-2 rounded-md font-medium hover:bg-secondary/80 transition-colors"
              >
                Back to Design
              </button>
              <button
                onClick={handleRunSimulation}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Re-run Simulation
              </button>
            </div>
          </div>
        )}

        {activeTab === "results" && !simulationResult && (
          <div className="text-center py-12">
            <LineChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Simulation Results</h3>
            <p className="text-muted-foreground mb-4">Configure your shelter design and run a simulation to see results.</p>
            <button
              onClick={() => setActiveTab("design")}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Design
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function KPICard({ title, value, subtitle, highlight }: { title: string; value: string; subtitle?: string; highlight?: boolean }) {
  return (
    <div className={`bg-card border rounded-lg p-4 ${highlight ? 'ring-2 ring-primary' : ''}`}>
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
}

function getOrientationName(degrees: number): string {
  if (degrees >= 337.5 || degrees < 22.5) return "North";
  if (degrees >= 22.5 && degrees < 67.5) return "Northeast";
  if (degrees >= 67.5 && degrees < 112.5) return "East";
  if (degrees >= 112.5 && degrees < 157.5) return "Southeast";
  if (degrees >= 157.5 && degrees < 202.5) return "South";
  if (degrees >= 202.5 && degrees < 247.5) return "Southwest";
  if (degrees >= 247.5 && degrees < 292.5) return "West";
  if (degrees >= 292.5 && degrees < 337.5) return "Northwest";
  return "North";
}
