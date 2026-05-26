import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Kodikz Dubai Mapping",
  description:
    "24/7 monitoring for Dubai Municipality Smart City GIS mapping vehicles. Live Map, Routes, Violations, Analytics, Companies, Vehicles, and Playback.",
};

export default function HomePage() {
  return <LandingPage />;
}
