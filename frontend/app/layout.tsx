import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ThermoShelter - Passive Shelter Thermal Design",
  description: "Design energy-efficient passive shelters for extreme climatic conditions using physics-based simulation and optimization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background">
        {children}
      </body>
    </html>
  );
}
