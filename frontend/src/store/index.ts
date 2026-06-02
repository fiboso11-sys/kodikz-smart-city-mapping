"use client";

import { create } from "zustand";
import { createAppStore, type AppState } from "@/store/app-store";

export const useAppStore = create<AppState>()((set, get) => createAppStore(set, get));
