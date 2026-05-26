import { PlatformShell } from "@/components/layout/platform-shell";
import { AppInitializer } from "@/components/app-initializer";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppInitializer>
      <PlatformShell>{children}</PlatformShell>
    </AppInitializer>
  );
}
