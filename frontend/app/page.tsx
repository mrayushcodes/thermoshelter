"use client";

import { useState } from "react";
import Link from "next/link";
import { Thermometer, Wind, Sun, Home as HomeIcon, LineChart, Settings, BookOpen, Menu, X } from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ThermoShelter</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How It Works</Link>
            <Link href="#demo" className="text-sm font-medium hover:text-primary transition-colors">Demo</Link>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              Start Designing
            </button>
          </div>
          
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t p-4 space-y-4 bg-background">
            <Link href="#features" className="block text-sm font-medium hover:text-primary">Features</Link>
            <Link href="#how-it-works" className="block text-sm font-medium hover:text-primary">How It Works</Link>
            <Link href="#demo" className="block text-sm font-medium hover:text-primary">Demo</Link>
            <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
              Start Designing
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Design Passive Shelters for{" "}
            <span className="text-primary">Extreme Climates</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            ThermoShelter predicts thermal performance and automatically identifies energy-efficient 
            shelter configurations using physics-based simulation and optimization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-md text-base font-medium hover:bg-primary/90 transition-colors"
            >
              Start Designing
            </Link>
            <Link 
              href="#demo"
              className="bg-secondary text-secondary-foreground px-8 py-3 rounded-md text-base font-medium hover:bg-secondary/80 transition-colors"
            >
              Explore Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Capabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Thermometer className="h-8 w-8 text-primary" />}
              title="Thermal Simulation"
              description="Physics-based transient thermal model predicting indoor temperatures over time based on energy balance principles."
            />
            <FeatureCard
              icon={<Sun className="h-8 w-8 text-primary" />}
              title="Solar Analysis"
              description="Time-dependent solar radiation calculations accounting for orientation, location, date, and surface exposure."
            />
            <FeatureCard
              icon={<Wind className="h-8 w-8 text-primary" />}
              title="Heat Loss Breakdown"
              description="Detailed analysis of heat losses through walls, roof, floor, windows, doors, and ventilation."
            />
            <FeatureCard
              icon={<HomeIcon className="h-8 w-8 text-primary" />}
              title="Multi-Layer Construction"
              description="Define complex wall and roof assemblies with multiple material layers and calculate R/U values."
            />
            <FeatureCard
              icon={<LineChart className="h-8 w-8 text-primary" />}
              title="Design Optimization"
              description="Automated optimization finds the best configuration balancing comfort, efficiency, and cost."
            />
            <FeatureCard
              icon={<Settings className="h-8 w-8 text-primary" />}
              title="What-If Analysis"
              description="Quickly test how changes in insulation, orientation, or materials affect thermal performance."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="max-w-4xl mx-auto space-y-8">
            <StepCard
              number="1"
              title="Define Location & Climate"
              description="Select from demo locations like Leh/Ladakh or upload custom weather data. The system uses ambient temperature and solar irradiance profiles."
            />
            <StepCard
              number="2"
              title="Configure Shelter Geometry"
              description="Set dimensions, shape (rectangular, cylindrical, dome), and orientation. Calculate floor area, wall area, and volume automatically."
            />
            <StepCard
              number="3"
              title="Specify Materials & Construction"
              description="Choose from a database of materials or create custom ones. Build multi-layer wall and roof assemblies with specific thicknesses."
            />
            <StepCard
              number="4"
              title="Run Simulation"
              description="The physics engine calculates hourly indoor temperatures using energy balance: solar gain minus heat losses equals net heat flow."
            />
            <StepCard
              number="5"
              title="Analyze & Optimize"
              description="View results, compare designs, and run optimization to find the best configuration for your priorities."
            />
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Try the Ladakh Demo</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Experience ThermoShelter with a pre-configured demonstration for winter conditions in Leh, Ladakh.
          </p>
          <div className="max-w-4xl mx-auto bg-card border rounded-lg p-6 shadow-sm">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Demo Configuration</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>Leh, Ladakh (34.15°N, 77.58°E)</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span>5m × 4m × 3m</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Wall:</span>
                    <span>Brick + 50mm Rock Wool</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Roof:</span>
                    <span>Concrete + 100mm Insulation</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Orientation:</span>
                    <span>South (180°)</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Windows:</span>
                    <span>12% of wall area</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col justify-center items-center text-center">
                <div className="text-5xl font-bold text-primary mb-2">18°C</div>
                <p className="text-muted-foreground mb-4">Target Comfort Temperature</p>
                <Link 
                  href="/dashboard"
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                  Run Demo Simulation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="h-5 w-5 text-primary" />
                <span className="font-bold">ThermoShelter</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A physics-based thermal design platform for passive shelters in extreme climates.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Documentation</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Thermal Model</Link></li>
                <li><Link href="#" className="hover:text-primary">Solar Calculations</Link></li>
                <li><Link href="#" className="hover:text-primary">Optimization Method</Link></li>
                <li><Link href="#" className="hover:text-primary">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Project Info</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">About</Link></li>
                <li><Link href="#" className="hover:text-primary">Limitations</Link></li>
                <li><Link href="#" className="hover:text-primary">GitHub</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2024 ThermoShelter. For educational and research purposes.</p>
            <p className="mt-2">This is a simplified engineering model and not a replacement for full CFD/FEA analysis.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
