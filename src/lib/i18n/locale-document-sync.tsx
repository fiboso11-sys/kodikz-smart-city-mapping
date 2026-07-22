"use client";

import { useEffect } from "react";
import { applyDocumentLocale } from "@/lib/i18n/messages";
import { useLocaleStore } from "@/lib/i18n";

/** Keeps `<html lang/dir>` aligned with locale store after hydration. */
export function LocaleDocumentSync() {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  return null;
}
