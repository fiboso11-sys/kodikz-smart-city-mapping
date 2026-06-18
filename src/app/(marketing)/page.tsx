import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

export default function HomePage() {
  return <LandingPage />;
}
