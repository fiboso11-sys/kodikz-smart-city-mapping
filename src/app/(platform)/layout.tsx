import { PlatformShell } from "@/components/layout/platform-shell";
import { QueryProvider } from "@/lib/providers/query-provider";
import { LiveGpsProvider } from "@/services/socket/live-gps";
import { SgeProvider } from "@/components/sge/sge-provider";
import { LocaleDocumentSync } from "@/lib/i18n/locale-document-sync";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <LocaleDocumentSync />
      <LiveGpsProvider>
        <SgeProvider>
          <PlatformShell>{children}</PlatformShell>
        </SgeProvider>
      </LiveGpsProvider>
    </QueryProvider>
  );
}
