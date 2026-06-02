import type { Metadata, Viewport } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kodikz Dubai Mapping",
    template: "%s · Kodikz Dubai Mapping",
  },
  description:
    "24/7 GIS mapping fleet monitor for Dubai Municipality Smart City — Live Map, Routes, Violations, Analytics, and more.",
  applicationName: "Kodikz Dubai Mapping",
  appleWebApp: {
    capable: true,
    title: "Kodikz Dubai Mapping",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Kodikz Dubai Mapping",
    description: "Dubai Municipality Smart City GIS mapping vehicle monitor",
    siteName: "Kodikz Dubai Mapping",
    type: "website",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030712",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#030712] antialiased">{children}</body>
    </html>
  );
}
