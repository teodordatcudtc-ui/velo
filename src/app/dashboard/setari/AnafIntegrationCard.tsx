"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type ClientItem = { id: string; name: string };
type MappingItem = { id: string; clientId: string; taxCode: string; clientName: string };
type Conn = {
  enabled: boolean;
  companyCif: string;
  oauthConnected: boolean;
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
  const [oauthPlatformReady, setOauthPlatformReady] = useState(false);
  const [form, setForm] = useState({ enabled: true, companyCif: "" });
  const [mapForm, setMapForm] = useState({ clientId: "", taxCode: "" });

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/anaf", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Nu pot incarca integrarea ANAF.");
      setConnection(data.connection ?? null);
      setClients(data.clients ?? []);
      setMappings(data.mappings ?? []);
      setOauthPlatformReady(data.oauthPlatformReady === true);
      if (data.connection) {
        setForm((prev) => ({
          ...prev,
          enabled: data.connection.enabled !== false,
          companyCif: data.connection.companyCif ?? "",
        }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Eroare la incarcare.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const ok = p.get("anaf");
    const err = p.get("anaf_error");
    if (ok === "connected") {
      toast.success("Te-ai conectat la e-Factura. Poti rula sincronizarea.");
      p.delete("anaf");
      const next = `${window.location.pathname}${p.toString() ? `?${p.toString()}` : ""}`;
      window.history.replaceState({}, "", next);
    }
    if (err) {
      toast.error(decodeURIComponent(err));
      p.delete("anaf_error");
      const next = `${window.location.pathname}${p.toString() ? `?${p.toString()}` : ""}`;
      window.history.replaceState({}, "", next);
    }
  }, [toast]);

  const connectionStatus = useMemo(() => {
    if (!oauthPlatformReady) return null;
    if (!connection) return "Introdu CUI-ul firmei si conecteaza-te cu e-Factura (autentificare SPV).";
    if (!connection.oauthConnected) return "Finalizeaza conectarea cu e-Factura folosind butonul de mai jos.";
    if (connection.circuitOpenUntil) {
      return `Sincronizarea e oprita temporar pana la ${new Date(connection.circuitOpenUntil).toLocaleString("ro-RO")} (protectie la erori repetate).`;
    }
    if (connection.lastError) return `Ultima eroare: ${connection.lastError}`;
    if (connection.lastSyncedAt) {
      return `Ultimul sync: ${new Date(connection.lastSyncedAt).toLocaleString("ro-RO")}`;
    }
    return "Conectat — poti activa sincronizarea si rula un import.";
  }, [oauthPlatformReady, connection]);

  async function handleSave() {
    if (!form.companyCif.trim()) {
      toast.error("Completeaza CUI-ul firmei.");
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
      if (!res.ok) throw new Error(data?.error ?? "Nu pot salva configuratia ANAF.");
      toast.success("Setarile pentru e-Factura au fost salvate.");
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
      if (!res.ok) throw new Error(data?.error ?? "Sync ANAF esuat.");
      const msg = `Sync e-Factura: ${data.imported ?? 0} importate, ${data.skipped ?? 0} omise.`;
      toast.success(msg);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync esuat.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleAddMapping() {
    if (!mapForm.clientId || !mapForm.taxCode.trim()) {
      toast.error("Selecteaza clientul si introdu CUI/CIF.");
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
      toast.success("Mapare salvata.");
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
      if (!res.ok) throw new Error(data?.error ?? "Nu pot sterge maparea.");
      toast.success("Mapare stearsa.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Eroare la stergere.");
    }
  }

  return (
    <div className="dash-card">
      <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">Integrare ANAF e-Factura</h2>
      <p className="text-sm text-[var(--ink-muted)] mb-4">
        Import automat din SPV, cu reluari automate si pauza temporara daca serviciul ANAF raspunde cu erori repetate.
      </p>

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Se incarca integrarea...</p>
      ) : (
        <div className="space-y-4">
          {!oauthPlatformReady ? (
            <>
              <p className="text-sm font-medium text-[var(--ink)]">Conectarea nu este disponibila momentan</p>
              <div className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm text-[var(--ink)]">
                Fluxul de conectare cu e-Factura nu poate fi pornit din Vello pana cand echipa care administreaza
                aplicatia finalizeaza activarea pe server. Daca mesajul persista, contacteaza suportul Vello.
              </div>
            </>
          ) : (
            <>
              {connectionStatus && (
                <p className="text-sm text-[var(--ink-soft)]">{connectionStatus}</p>
              )}
              {connection?.lastErrorAt && (
                <div className="text-xs text-[var(--terracotta)]">
                  {new Date(connection.lastErrorAt).toLocaleString("ro-RO")}
                </div>
              )}

              {/* CUI input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--ink)]">
                  CUI-ul firmei (pentru citirea mesajelor din SPV)
                </label>
                <input
                  className="dash-input w-full max-w-md"
                  placeholder="ex. 12345678"
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.companyCif}
                  onChange={(e) => setForm((f) => ({ ...f, companyCif: e.target.value }))}
                />
                <p className="text-xs text-[var(--ink-muted)]">
                  CUI-ul firmei pentru care se importa facturile primite prin e-Factura.
                </p>
              </div>

              {/* OAuth connect box */}
              <div className="rounded border border-[var(--border)] bg-[var(--paper-2)] px-4 py-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-[var(--ink)] mb-2">Conectare e-Factura (SPV)</p>
                  <p className="text-sm text-[var(--ink-muted)] mb-3">
                    Vei fi redirectionat la ANAF unde te autentifici cu{" "}
                    <strong className="font-medium text-[var(--ink-soft)]">certificatul digital calificat</strong>.
                    {" "}Chrome va afisa un dialog de selectare a certificatului.
                  </p>

                  {/* Certificate checklist */}
                  <div className="rounded border border-amber-400/40 bg-amber-50/60 px-3 py-3 text-xs text-[var(--ink)]">
                    <p className="font-medium mb-2">Daca primesti eroare imediata fara sa fi cerut certificatul:</p>
                    <p className="text-[var(--ink-soft)] mb-2">
                      Cauza cea mai frecventa: o extensie de browser (uBlock, Privacy Badger, ad blocker) sau
                      o setare Chrome <strong className="font-medium text-[var(--ink)]">blocheaza cookie-urile</strong> pentru
                      {" "}<code>logincert.anaf.ro</code>. Serverul ANAF (BIG-IP) are nevoie de cookie-uri pentru
                      a stabili sesiunea TLS — fara ele, respinge imediat cu &bdquo;access denied&rdquo;.
                    </p>
                    <p className="font-medium mb-1">Rezolvare pas cu pas:</p>
                    <ol className="space-y-1 list-decimal list-inside text-[var(--ink-soft)]">
                      <li>
                        Incearca <strong className="font-medium text-[var(--ink)]">modul incognito</strong> (Ctrl+Shift+N)
                        — extensiile sunt dezactivate, cookie-urile sunt permise
                      </li>
                      <li>
                        Daca in incognito functioneaza: dezactiveaza extensiile de blocare pentru{" "}
                        <code>logincert.anaf.ro</code> in Chrome normal
                      </li>
                      <li>
                        Verifica Chrome → Setari → Confidentialitate → Cookie-uri: <code>logincert.anaf.ro</code>{" "}
                        nu trebuie sa fie in lista &bdquo;Blocate&rdquo;
                      </li>
                      <li>
                        Tokenul USB / certificatul calificat trebuie sa fie{" "}
                        <strong className="font-medium text-[var(--ink)]">introdus si recunoscut</strong>{" "}
                        (apare in certmgr.msc → Personal)
                      </li>
                    </ol>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    window.location.href = "/api/integrations/anaf/oauth/start";
                  }}
                >
                  Conecteaza-te cu e-Factura
                </button>

                {connection?.oauthConnected && (
                  <p className="text-sm text-[var(--sage)] mb-0">Cont e-Factura conectat.</p>
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                />
                Activeaza sincronizarea automata din SPV
              </label>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-secondary" disabled={saving} onClick={handleSave}>
                  {saving ? "Se salveaza..." : "Salveaza setarile"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={syncing || !connection || !connection.oauthConnected}
                  onClick={handleSyncNow}
                >
                  {syncing ? "Sincronizare..." : "Ruleaza sync acum"}
                </button>
              </div>

              {/* Mappings */}
              <div className="pt-3 border-t border-[var(--border)] space-y-2">
                <h3 className="text-sm font-semibold text-[var(--ink)]">Mapare CUI/CIF partener &rarr; Client Vello</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select
                    className="dash-input"
                    value={mapForm.clientId}
                    onChange={(e) => setMapForm((m) => ({ ...m, clientId: e.target.value }))}
                  >
                    <option value="">Alege client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="dash-input"
                    placeholder="CUI/CIF partener ANAF"
                    value={mapForm.taxCode}
                    onChange={(e) => setMapForm((m) => ({ ...m, taxCode: e.target.value }))}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleAddMapping}>
                    Adauga mapare
                  </button>
                </div>

                {mappings.length === 0 ? (
                  <p className="text-sm text-[var(--ink-muted)]">Nu exista mapari inca.</p>
                ) : (
                  <ul className="space-y-2">
                    {mappings.map((m) => (
                      <li
                        key={m.id}
                        className="text-sm flex items-center justify-between rounded border border-[var(--paper-3)] bg-[var(--paper-2)] px-3 py-2"
                      >
                        <span>
                          {m.taxCode} &rarr; {m.clientName}
                        </span>
                        <button
                          type="button"
                          className="text-[var(--terracotta)] underline"
                          onClick={() => handleDeleteMapping(m.id)}
                        >
                          Sterge
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
