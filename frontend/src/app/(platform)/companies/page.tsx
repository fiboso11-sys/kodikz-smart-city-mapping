"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import type { Company } from "@/types";

export default function CompaniesPage() {
  const companies = useAppStore((s) => s.companies);
  const vehicles = useAppStore((s) => s.vehicles);
  const addCompany = useAppStore((s) => s.addCompany);
  const [name, setName] = useState("");

  const create = () => {
    if (!name.trim()) return;
    const co: Company = {
      id: `co-${Date.now()}`,
      name: name.trim(),
      tradeLicense: `TL-${Math.floor(Math.random() * 90000 + 10000)}`,
      contactEmail: `contact@${name.toLowerCase().replace(/\s+/g, "")}.ae`,
      status: "active",
    };
    addCompany(co);
    setName("");
  };

  return (
    <section className="min-h-screen p-4">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <article>
          <h1 className="text-2xl font-semibold text-white">Company Management</h1>
          <p className="text-sm text-slate-500">{companies.length} registered fleet operators</p>
        </article>
        <fieldset className="flex gap-2 border-0 p-0">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New company name"
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <Button onClick={create} className="gap-2">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </fieldset>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((c, i) => (
          <motion.article
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="glass-panel rounded-xl p-5"
          >
            <h3 className="text-lg font-semibold text-white">{c.name}</h3>
            <p className="text-xs text-slate-500">{c.tradeLicense}</p>
            <p className="mt-2 text-sm text-slate-400">{c.contactEmail}</p>
            <p className="mt-3 text-sm font-medium text-blue-400">
              {vehicles.filter((v) => v.companyId === c.id).length} vehicles
            </p>
          </motion.article>
        ))}
      </section>
    </section>
  );
}
