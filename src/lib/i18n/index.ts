/**
 * Locale store — English / Arabic with RTL support.
 */

"use client";

import { create } from "zustand";
import {
  applyDocumentLocale,
  getMessages,
  type Locale,
  type MessageTree,
} from "@/lib/i18n/messages";
import { loadJson, saveJson } from "@/platform/sge";

const KEY = "kodikz.locale.v1";

interface LocaleState {
  locale: Locale;
  messages: MessageTree;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => {
  const initial = loadJson<Locale>(KEY, "en");
  // Do NOT call applyDocumentLocale here — mutating <html dir/lang> during
  // store init causes a React hydration mismatch against RootLayout.
  // LocaleDocumentSync applies document attributes after mount.
  return {
    locale: initial,
    messages: getMessages(initial),
    setLocale: (locale) => {
      saveJson(KEY, locale);
      applyDocumentLocale(locale);
      set({ locale, messages: getMessages(locale) });
    },
  };
});
