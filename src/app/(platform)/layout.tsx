import { PlatformShell } from "@/components/layout/platform-shell";
import { QueryProvider } from "@/lib/providers/query-provider";
import { LiveGpsProvider } from "@/services/socket/live-gps";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <LiveGpsProvider>
        <PlatformShell>{children}</PlatformShell>
      </LiveGpsProvider>
    </QueryProvider>
  );
}
