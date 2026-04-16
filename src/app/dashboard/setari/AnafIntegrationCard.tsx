"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type ClientItem = { id: string; name: string };
type MappingItem = { id: string; clientId: string; taxCode: string; clientName: string };
type Conn = {
  enabled: boolean;
  companyCif: string;
  apiBaseUrl: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  circuitOpenUntil: string | null;
  consecutiveFailures: number;
} | null;

export function AnafIntegrationCard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connection, setConnection] = useState<Conn>(null);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [serverConfigReady, setServerConfigReady] = useState(false);
  const [form, setForm] = useState({
    enabled: true,
    companyCif: "",
  });
  const [mapForm, setMapForm] = useState({ clientId: "", taxCode: "" });

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/anaf", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Nu pot încărca integrarea ANAF.");
      setConnection(data.connection ?? null);
      setClients(data.clients ?? []);
      setMappings(data.mappings ?? []);
      setServerConfigReady(data.serverConfigReady === true);
      if (data.connection) {
        setForm((prev) => ({
          ...prev,
          enabled: data.connection.enabled !== false,
          companyCif: data.connection.companyCif ?? "",
        }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Eroare la încărcare.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusText = useMemo(() => {
    if (!connection) return "Neconfigurat";
    if (connection.circuitOpenUntil) {
      return `Circuit activ până la ${new Date(connection.circuitOpenUntil).toLocaleString("ro-RO")}`;
    }
    if (connection.lastError) {
      return `Ultima eroare: ${connection.lastError}`;
    }
    if (connection.lastSyncedAt) {
      return `Ultimul sync: ${new Date(connection.lastSyncedAt).toLocaleString("ro-RO")}`;
    }
    return "Configurat, fără rulări încă";
  }, [connection]);

  async function handleSave() {
    if (!form.companyCif.trim()) {
      toast.error("Completează CUI-ul firmei.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/integrations/anaf", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Nu pot salva configurația ANAF.");
      toast.success("Integrarea ANAF a fost salvată.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Eroare la salvare.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/anaf/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Sync ANAF eșuat.");
      const msg = `Sync ANAF: ${data.imported ?? 0} importate, ${data.skipped ?? 0} omise.`;
      toast.success(msg);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync eșuat.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleAddMapping() {
    if (!mapForm.clientId || !mapForm.taxCode.trim()) {
      toast.error("Selectează clientul și introdu CUI/CIF.");
      return;
    }
    try {
      const res = await fetch("/api/integrations/anaf/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Nu pot salva maparea.");
      toast.success("Mapare salvată.");
      setMapForm({ clientId: "", taxCode: "" });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Eroare mapare.");
    }
  }

  async function handleDeleteMapping(id: string) {
    try {
      const res = await fetch(`/api/integrations/anaf/mappings?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Nu pot șterge maparea.");
      toast.success("Mapare ștearsă.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Eroare la ștergere.");
    }
  }

  return (
    <div className="dash-card">
      <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">Integrare ANAF e-Factura</h2>
      <p className="text-sm text-[var(--ink-muted)] mb-4">
        Import automat documente din SPV, cu protecție la instabilitate ANAF (retry + circuit breaker).
      </p>

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Se încarcă integrarea...</p>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-[var(--ink-soft)]">{statusText}</div>
          {connection?.lastErrorAt && (
            <div className="text-xs text-[var(--terracotta)]">
              {new Date(connection.lastErrorAt).toLocaleString("ro-RO")}
            </div>
          )}
          {!serverConfigReady && (
            <div className="rounded border border-[var(--terracotta)]/40 bg-[var(--terracotta)]/10 px-3 py-2 text-sm text-[var(--terracotta)]">
              Integrarea ANAF nu este pregătită pe server. Administratorul trebuie să seteze variabilele ANAF în environment.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="dash-input" placeholder="CUI firmă ta (pentru SPV)" value={form.companyCif} onChange={(e) => setForm((f) => ({ ...f, companyCif: e.target.value }))} />
            <input className="dash-input bg-[var(--paper)] cursor-not-allowed" value={connection?.apiBaseUrl ?? "https://api.anaf.ro/prod/FCTEL/rest"} readOnly />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-[var(--ink)]">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
            Activează sincronizarea ANAF
          </label>

          <div className="flex gap-2">
            <button type="button" className="btn btn-primary" disabled={saving || !serverConfigReady} onClick={handleSave}>
              {saving ? "Se salvează..." : "Salvează integrarea"}
            </button>
            <button type="button" className="btn btn-secondary" disabled={syncing || !connection || !serverConfigReady} onClick={handleSyncNow}>
              {syncing ? "Sincronizare..." : "Rulează sync acum"}
            </button>
          </div>

          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <h3 className="text-sm font-semibold text-[var(--ink)]">Mapare CUI/CIF partener → Client Vello</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select className="dash-input" value={mapForm.clientId} onChange={(e) => setMapForm((m) => ({ ...m, clientId: e.target.value }))}>
                <option value="">Alege client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input className="dash-input" placeholder="CUI/CIF partener ANAF" value={mapForm.taxCode} onChange={(e) => setMapForm((m) => ({ ...m, taxCode: e.target.value }))} />
              <button type="button" className="btn btn-secondary" onClick={handleAddMapping}>Adaugă mapare</button>
            </div>

            {mappings.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">Nu există mapări încă.</p>
            ) : (
              <ul className="space-y-2">
                {mappings.map((m) => (
                  <li key={m.id} className="text-sm flex items-center justify-between rounded border border-[var(--paper-3)] bg-[var(--paper-2)] px-3 py-2">
                    <span>{m.taxCode} → {m.clientName}</span>
                    <button type="button" className="text-[var(--terracotta)] underline" onClick={() => handleDeleteMapping(m.id)}>
                      Șterge
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
