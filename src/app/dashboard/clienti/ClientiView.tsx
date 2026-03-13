"use client";

import { useEffect, useState, useMemo, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import {
  addClient,
  importClientsFromCsv,
  removeClient,
  restoreClient,
  sendDocumentRequestNow,
  saveDocumentRequest,
  updateClient,
  updateClientReminder,
} from "@/app/actions/clients";
import { useToast } from "@/app/components/ToastProvider";
import { ConfirmModal } from "@/app/components/ConfirmModal";
import { ProgrameazaModal } from "../ProgrameazaModal";
import { ClientiOnboardingTutorial } from "./ClientiOnboardingTutorial";
import styles from "./clienti.module.css";

type DocType = { id: string; name: string };
type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  unique_token: string;
  created_at: string;
  reminder_enabled?: boolean;
  reminder_day_of_month?: number | null;
  nextRequestAt?: string | null;
  document_types: DocType[] | null;
};
type Upload = {
  id: string;
  client_id: string;
  document_type_id: string;
  file_name: string;
  month: number;
  year: number;
  created_at: string;
};

const MONTH_NAMES = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_NAMES_FULL = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

// Returns "YYYY-MM-DD" string to avoid timezone issues
function nextRecurringDateFromDay(dayOfMonth: number): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based

  // Try current month
  const thisMonthStr = `${y}-${pad(m + 1)}-${pad(dayOfMonth)}`;
  if (thisMonthStr > todayStr) return thisMonthStr;

  // Move to next month
  const nm = m + 1; // 0-based next month
  const nextYear = nm >= 12 ? y + 1 : y;
  const nextMonthNum = nm >= 12 ? 1 : nm + 1; // 1-based
  return `${nextYear}-${pad(nextMonthNum)}-${pad(dayOfMonth)}`;
}

function formatDocDate(createdAt: string): string {
  const d = new Date(createdAt);
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  const h = d.getHours();
  const m = d.getMinutes();
  return `${day} ${month} ${year} ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function fileIcon(fileName: string): { kind: "pdf" | "image" | "sheet" | "doc"; label: string; bg: string } {
  const ext = (fileName.split(".").pop() ?? "").toLowerCase();
  if (ext === "pdf") return { kind: "pdf", label: "PDF", bg: "var(--terra-light)" };
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return { kind: "image", label: "IMG", bg: "#d6eaf4" };
  if (["xlsx", "xls", "csv"].includes(ext)) return { kind: "sheet", label: ext.toUpperCase(), bg: "#dcf5e8" };
  return { kind: "doc", label: ext.toUpperCase() || "DOC", bg: "var(--paper-2)" };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

function avatarColor(index: number): { bg: string; fg: string } {
  const colors = [
    { bg: "var(--sage-light)", fg: "var(--sage)" },
    { bg: "var(--terra-light)", fg: "var(--terra)" },
    { bg: "var(--amber-light)", fg: "#9C6B10" },
    { bg: "#d6eaf4", fg: "var(--sky)" },
    { bg: "var(--paper-2)", fg: "var(--ink-soft)" },
  ];
  return colors[index % colors.length];
}

function sanitizeZipPart(value: string): string {
  return (
    value
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100) || "fisier"
  );
}

type FilterTab = "all" | "ok" | "wait" | "late" | "none" | "archive";
type Status = "ok" | "wait" | "late" | "none";
type SortKey =
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "name_desc"
  | "status"
  | "last_activity_desc";
const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "created_desc", label: "Dată adăugare (noi)" },
  { value: "created_asc", label: "Dată adăugare (vechi)" },
  { value: "name_asc", label: "Nume A–Z" },
  { value: "name_desc", label: "Nume Z–A" },
  { value: "status", label: "Status" },
  { value: "last_activity_desc", label: "Ultima activitate" },
];
type VisibleColumns = {
  client: boolean;
  docs: boolean;
  activity: boolean;
  status: boolean;
  actions: boolean;
};

export function ClientiView({
  clients: initialClients,
  archivedClients = [],
  uploads,
  clientIdsWithRequest = [],
  nextRequestByClient = {},
  currentMonth,
  currentYear,
  isPremium,
  clientLimit,
  userId,
}: {
  clients: Client[];
  archivedClients?: Client[];
  uploads: Upload[];
  clientIdsWithRequest?: string[];
  nextRequestByClient?: Record<string, string>;
  currentMonth: number;
  currentYear: number;
  isPremium: boolean;
  clientLimit: number | null;
  userId?: string;
}) {
  const hasRequestThisMonth = useMemo(
    () => new Set(clientIdsWithRequest),
    [clientIdsWithRequest]
  );
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortKey>("created_desc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerClient, setDrawerClient] = useState<Client | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "docs" | "activity" | "settings">("overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [programeazaClient, setProgrameazaClient] = useState<Client | null>(null);
  const [addPending, setAddPending] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editPending, setEditPending] = useState(false);
  const [restorePendingId, setRestorePendingId] = useState<string | null>(null);
  const [importPending, setImportPending] = useState(false);
  const [bulkRequestOpen, setBulkRequestOpen] = useState(false);
  const [bulkRequestPending, setBulkRequestPending] = useState(false);
  const [bulkExportPending, setBulkExportPending] = useState(false);
  const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);
  const [bulkArchivePending, setBulkArchivePending] = useState(false);
  const [clientLabels, setClientLabels] = useState<Record<string, string>>({});
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  const [tutorialStartSignal, setTutorialStartSignal] = useState(0);
  const [tutorialContinueSignal, setTutorialContinueSignal] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    client: true,
    docs: true,
    activity: true,
    status: true,
    actions: true,
  });
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("velo_client_labels");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed && typeof parsed === "object") setClientLabels(parsed);
    } catch {
      // ignore corrupted local data
    }
  }, []);

  useEffect(() => {
    if (!sortMenuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (!sortMenuRef.current) return;
      if (!sortMenuRef.current.contains(e.target as Node)) {
        setSortMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [sortMenuOpen]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("velo_clienti_visible_columns");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<VisibleColumns>;
      if (!parsed || typeof parsed !== "object") return;
      setVisibleColumns((prev) => ({
        ...prev,
        ...parsed,
      }));
    } catch {
      // ignore corrupted local data
    }
  }, []);

  /* Pe telefon: evită deschiderea tastaturii la intrarea pe pagină (blur primul input) */
  useEffect(() => {
    const t = setTimeout(() => {
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        const el = document.activeElement;
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.blur();
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const clientsWithStatus = useMemo(() => {
    const now = new Date();

    return initialClients.map((client) => {
      const types = client.document_types ?? [];
      const total = types.length;
      const received = new Set(
        uploads
          .filter(
            (u) =>
              u.client_id === client.id &&
              u.month === currentMonth &&
              u.year === currentYear
          )
          .map((u) => u.document_type_id)
      );
      const count = received.size;
      const hasRequest = hasRequestThisMonth.has(client.id);
      let status: Status =
        total === 0
          ? "none"
          : count === total
            ? "ok"
            : count === 0
              ? hasRequest
                ? "wait"
                : "late"
              : "wait";
      const pct = total === 0 ? 0 : Math.round((count / total) * 100);
      const docsLabel = total === 0 ? "—" : `${count}/${total}`;
      const lastUploadAny = uploads
        .filter((u) => u.client_id === client.id)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
      const lastActivityTs = lastUploadAny
        ? new Date(lastUploadAny.created_at).getTime()
        : 0;

      // Compare dates as "YYYY-MM-DD" strings to avoid timezone issues
      const pad2 = (n: number) => String(n).padStart(2, "0");
      const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

      // Recurring monthly date (if enabled)
      let recurringDateStr: string | null = null;
      if (client.reminder_enabled && typeof client.reminder_day_of_month === "number") {
        const day = client.reminder_day_of_month;
        if (day >= 1 && day <= 31) {
          recurringDateStr = nextRecurringDateFromDay(day);
        }
      }

      // Scheduled date from document_requests (take only the YYYY-MM-DD part)
      const scheduledIso = nextRequestByClient[client.id] ?? null;
      const scheduledDateStr = scheduledIso ? scheduledIso.slice(0, 10) : null;

      // Priority: explicit scheduled request > recurring monthly date
      // This avoids showing a recurring date from the same month when the actual
      // scheduled request is months away (e.g. program Sept 20 → reminder_day_of_month=20
      // would otherwise show March 20 as "next" before September).
      let nextRequestAt: string | null = null;
      if (scheduledDateStr && scheduledDateStr > todayStr) {
        nextRequestAt = scheduledDateStr;
      } else if (recurringDateStr && recurringDateStr > todayStr) {
        nextRequestAt = recurringDateStr;
      }
      return {
        ...client,
        status,
        pct,
        docsLabel,
        totalTypes: total,
        receivedCount: count,
        lastActivityTs,
        nextRequestAt,
      };
    });
  }, [initialClients, uploads, currentMonth, currentYear, hasRequestThisMonth, nextRequestByClient]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return clientsWithStatus.filter((c) => {
      const matchFilter =
        filterTab === "all" ||
        c.status === filterTab;
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q);
      return matchFilter && matchSearch;
    });
  }, [clientsWithStatus, filterTab, search]);

  const sortedFiltered = useMemo(() => {
    const statusOrder: Record<Status, number> = {
      late: 0,
      wait: 1,
      none: 2,
      ok: 3,
    };
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "created_asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "created_desc":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "name_asc":
          return a.name.localeCompare(b.name, "ro");
        case "name_desc":
          return b.name.localeCompare(a.name, "ro");
        case "status":
          return statusOrder[a.status] - statusOrder[b.status];
        case "last_activity_desc":
          return (b.lastActivityTs ?? 0) - (a.lastActivityTs ?? 0);
        default:
          return 0;
      }
    });
  }, [filtered, sortBy]);

  const archivedFiltered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return archivedClients;
    return archivedClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q)
    );
  }, [archivedClients, search]);

  const counts = useMemo(() => {
    const all = clientsWithStatus.length;
    const ok = clientsWithStatus.filter((c) => c.status === "ok").length;
    const wait = clientsWithStatus.filter((c) => c.status === "wait").length;
    const late = clientsWithStatus.filter((c) => c.status === "late").length;
    const none = clientsWithStatus.filter((c) => c.status === "none").length;
    const archived = archivedClients.length;
    return { all, ok, wait, late, none, archived };
  }, [clientsWithStatus, archivedClients]);

  const totalClients = initialClients.length;
  const isAtClientLimit =
    !isPremium && totalClients >= (clientLimit ?? 30);
  const overdueCount = counts.late;
  const responseRate =
    totalClients === 0 ? 0 : Math.round((counts.ok / Math.max(totalClients - counts.none, 1)) * 100);

  function openAddClientModal() {
    if (isAtClientLimit) {
      toast.info(
        (clientLimit ?? 40) === 5
          ? "Planul gratuit permite maxim 5 clienți. Alege Standard sau Premium pentru mai mulți."
          : "Ai atins limita de 40 clienți pe Standard. Treci pe Premium pentru clienți nelimitați."
      );
      return;
    }
    setModalOpen(true);
  }

  function openFirstClientRequestModal() {
    const targetClient = drawerClient ?? sortedFiltered[0] ?? initialClients[0] ?? null;
    if (!targetClient) {
      toast.info("Nu există încă un client pentru care să deschizi cererea.");
      return;
    }
    setProgrameazaClient(targetClient);
  }

  function openFirstClientDrawer() {
    const firstClient = sortedFiltered[0] ?? initialClients[0] ?? null;
    if (!firstClient) {
      toast.info("Nu există încă un client pe care să îl deschizi.");
      return;
    }
    setDrawerClient(firstClient);
    setDrawerTab("overview");
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedFiltered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sortedFiltered.map((c) => c.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());
  const selectedClients = useMemo(
    () => initialClients.filter((c) => selectedIds.has(c.id)),
    [initialClients, selectedIds]
  );
  const selectedCount = selectedClients.length;
  const canRunBulk = selectedCount > 0 && filterTab !== "archive";

  function persistLabels(next: Record<string, string>) {
    setClientLabels(next);
    try {
      localStorage.setItem("velo_client_labels", JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  function persistVisibleColumns(next: VisibleColumns) {
    setVisibleColumns(next);
    try {
      localStorage.setItem("velo_clienti_visible_columns", JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  function sanitizeFilePart(value: string): string {
    return value
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "client";
  }

  const openDrawer = (c: Client) => setDrawerClient(c);
  const closeDrawer = () => setDrawerClient(null);

  async function handleCsvSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportPending(true);
      const text = await file.text();
      const result = await importClientsFromCsv(text);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (!result) {
        toast.error("Import eșuat.");
        return;
      }

      const parts: string[] = [];
      parts.push(`Import finalizat: ${result.imported} clienți adăugați`);
      const failed = result.failed ?? 0;
      const skippedByLimit = result.skippedByLimit ?? 0;
      if (failed > 0) parts.push(`${failed} eșuați`);
      if (skippedByLimit > 0) {
        parts.push(`${skippedByLimit} săriți (limită plan)`);
      }
      toast.success(parts.join(" · ") + ".");
      if (result.errors?.length) {
        toast.info(`Exemple erori: ${result.errors.join(" | ")}`);
      }
      router.refresh();
    } catch {
      toast.error("Nu am putut citi fișierul CSV.");
    } finally {
      setImportPending(false);
      e.target.value = "";
    }
  }

  async function handleAddClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData();
    formData.set("name", (form.elements.namedItem("client_name") as HTMLInputElement)?.value ?? "");
    formData.set("email", (form.elements.namedItem("client_email") as HTMLInputElement)?.value ?? "");
    formData.set("phone", (form.elements.namedItem("client_phone") as HTMLInputElement)?.value ?? "");
    setAddPending(true);
    const result = await addClient(formData);
    setAddPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Client adăugat.");
    try {
      localStorage.setItem(
        `velo_onboarding_clienti_continue_${userId ?? "default"}`,
        "1"
      );
    } catch {
      // ignore localStorage errors
    }
    setTutorialContinueSignal((v) => v + 1);
    setModalOpen(false);
    form.reset();
    router.refresh();
  }

  async function handleEditClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editClient) return;
    const form = e.currentTarget;
    const formData = new FormData();
    formData.set("name", (form.elements.namedItem("client_name") as HTMLInputElement)?.value ?? "");
    formData.set("email", (form.elements.namedItem("client_email") as HTMLInputElement)?.value ?? "");
    formData.set("phone", (form.elements.namedItem("client_phone") as HTMLInputElement)?.value ?? "");
    setEditPending(true);
    const result = await updateClient(editClient.id, formData);
    setEditPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Client actualizat.");
    setEditClient(null);
    router.refresh();
  }

  async function handleBulkSendRequest(data: {
    sendMode: "now" | "scheduled";
    sendDate: string;
    delivery: "manual" | "email";
    docTypes: string[];
    message: string;
    reminderAfter3Days: boolean;
  }) {
    if (!canRunBulk) return false;

    if (data.delivery === "email") {
      const missingEmail = selectedClients.filter((c) => !c.email?.trim());
      if (missingEmail.length > 0) {
        toast.error(
          `Setează email pentru: ${missingEmail
            .slice(0, 4)
            .map((c) => c.name)
            .join(", ")}${missingEmail.length > 4 ? "..." : ""}.`
        );
        return false;
      }
    }

    setBulkRequestPending(true);
    let success = 0;
    const errors: string[] = [];

    for (const client of selectedClients) {
      const result =
        data.sendMode === "now"
          ? await sendDocumentRequestNow(client.id, {
              delivery: data.delivery,
              docTypes: data.docTypes,
              message: data.message,
              reminderAfter3Days: data.reminderAfter3Days,
            })
          : await saveDocumentRequest(client.id, {
              ...data,
              methods: [data.delivery],
            });
      if (result?.error) {
        if (errors.length < 5) errors.push(`${client.name}: ${result.error}`);
      } else {
        success++;
      }
    }

    setBulkRequestPending(false);
    if (success === 0) {
      toast.error(errors[0] ?? "Nu am putut trimite cererile.");
      return false;
    }

    if (data.delivery === "manual") {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const links = selectedClients
        .filter((c) => c.unique_token)
        .map((c) => `${c.name}: ${origin}/upload/${c.unique_token}`);
      if (links.length > 0 && typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(links.join("\n"));
          toast.info("Linkurile au fost copiate în clipboard pentru trimitere manuală.");
        } catch {
          toast.info("Nu am putut copia automat linkurile în clipboard.");
        }
      }
    }

    toast.success(
      data.delivery === "email"
        ? `Cerere trimisă pe email pentru ${success} ${success === 1 ? "client" : "clienți"}.`
        : `Cerere pregătită manual pentru ${success} ${success === 1 ? "client" : "clienți"}.`
    );
    if (errors.length > 0) toast.info(`Erori: ${errors.join(" | ")}`);
    clearSelection();
    setBulkRequestOpen(false);
    router.refresh();
    return true;
  }

  async function handleBulkExportZip() {
    if (!canRunBulk) return;
    if (!isPremium) {
      toast.info("Export ZIP lunar este disponibil doar pe Premium.");
      return;
    }

    const monthUploads = uploads.filter(
      (u) =>
        selectedIds.has(u.client_id) &&
        u.month === currentMonth &&
        u.year === currentYear
    );
    if (monthUploads.length === 0) {
      toast.info("Nu există documente de exportat pentru selecția curentă în luna aceasta.");
      return;
    }

    setBulkExportPending(true);
    try {
      const zip = new JSZip();
      const usedPaths = new Set<string>();
      let exportedCount = 0;
      const failed: string[] = [];

      for (const up of monthUploads) {
        const clientName =
          selectedClients.find((c) => c.id === up.client_id)?.name ?? "Client";
        const folder = sanitizeFilePart(clientName);
        const baseName = sanitizeFilePart(up.file_name || "document");
        let filePath = `${folder}/${baseName}`;
        let inc = 1;
        while (usedPaths.has(filePath)) {
          filePath = `${folder}/${baseName}-${inc}`;
          inc++;
        }
        usedPaths.add(filePath);

        const res = await fetch(`/api/uploads/${up.id}?download=1`);
        if (!res.ok) {
          if (failed.length < 5) failed.push(`${clientName}: ${up.file_name}`);
          continue;
        }
        const blob = await res.blob();
        zip.file(filePath, blob);
        exportedCount++;
      }

      if (exportedCount === 0) {
        toast.error("Nu am putut exporta niciun fișier.");
        if (failed.length > 0) toast.info(`Eșecuri: ${failed.join(" | ")}`);
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const month = String(currentMonth).padStart(2, "0");
      const fileName = `documente-${currentYear}-${month}.zip`;
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`ZIP exportat cu ${exportedCount} fișiere.`);
      if (failed.length > 0) toast.info(`Fișiere neexportate: ${failed.join(" | ")}`);
    } catch {
      toast.error("A apărut o eroare la exportul ZIP.");
    } finally {
      setBulkExportPending(false);
    }
  }

  function applyBulkLabel(label: string) {
    const next = { ...clientLabels };
    for (const id of selectedIds) {
      if (!label) delete next[id];
      else next[id] = label;
    }
    persistLabels(next);
    toast.success(
      label
        ? `Eticheta "${label}" a fost aplicată la ${selectedCount} ${selectedCount === 1 ? "client" : "clienți"}.`
        : `Etichetele au fost eliminate pentru ${selectedCount} ${selectedCount === 1 ? "client" : "clienți"}.`
    );
  }

  function handleBulkLabel() {
    if (!canRunBulk) return;
    setLabelInput("");
    setLabelModalOpen(true);
  }

  async function handleBulkArchiveConfirm() {
    if (!canRunBulk) return;
    setBulkArchivePending(true);
    let archived = 0;
    const errors: string[] = [];
    for (const client of selectedClients) {
      const result = await removeClient(client.id);
      if (result?.error) {
        if (errors.length < 5) errors.push(`${client.name}: ${result.error}`);
      } else {
        archived++;
      }
    }
    setBulkArchivePending(false);
    setBulkArchiveOpen(false);
    clearSelection();
    if (archived > 0) toast.success(`${archived} ${archived === 1 ? "client arhivat" : "clienți arhivați"}.`);
    if (errors.length > 0) toast.info(`Erori: ${errors.join(" | ")}`);
    router.refresh();
  }

  const statusBadge = (status: Status) => {
    const cls =
      status === "ok"
        ? styles.badgeOk
        : status === "wait"
          ? styles.badgeWait
          : status === "late"
            ? styles.badgeLate
            : styles.badgeNone;
    const label =
      status === "ok"
        ? "La zi"
        : status === "wait"
          ? "Așteptare"
          : status === "late"
            ? "Restant"
            : "Neinițiat";
    return (
      <span className={`${styles.badge} ${cls}`}>
        <span className={styles.badgeDot} />
        {label}
      </span>
    );
  };

  const progColor = (status: Status) =>
    status === "ok" ? styles.pfSage : status === "wait" ? styles.pfAmber : styles.pfTerra;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* TOP BAR */}
      <div className={styles.topbar}>
        <div className={styles.topbarTitle}>
          Clienții <em>mei</em>
        </div>
        <div style={{ marginLeft: 12, fontSize: 12, color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
          {isPremium
            ? "Plan Premium · clienți nelimitați"
            : (clientLimit ?? 40) === 5
              ? `Plan gratuit · ${initialClients.length}/5 clienți`
              : `Plan Standard · ${initialClients.length}/${clientLimit ?? 40} clienți`}
        </div>
        <div className={styles.topbarSpacer} />
        <div className={styles.topbarSearch}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Caută client, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnIcon}`}
          title="Import CSV"
          disabled={importPending}
          onClick={() => csvInputRef.current?.click()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={handleCsvSelected}
        />
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          data-tutorial="clienti-add-button"
          onClick={openAddClientModal}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Client nou
        </button>
      </div>

      {/* PAGE CONTENT */}
      <div className={styles.pageContent}>
        {/* STATS — pe PC: 4 coloane, mari cu iconițe; pe mobil: 2×2 compact (doar CSS) */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.siSage}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-3-3.87" /><path d="M8 21v-2a4 4 0 0 1 3-3.87" />
                <circle cx="9" cy="7" r="4" /><circle cx="17" cy="7" r="4" />
              </svg>
            </div>
            <div className={styles.statCardInner}>
              <div className={styles.statLabel}>Total clienți</div>
              <div className={styles.statVal}>{totalClients}</div>
              <div className={styles.statDeltaUp}>↑ total în cont</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.siTerra}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8" /><polyline points="12 8 12 12 15 14" />
              </svg>
            </div>
            <div className={styles.statCardInner}>
              <div className={styles.statLabel}>Documente restante</div>
              <div className={styles.statVal} style={{ color: "var(--terra)" }}>{overdueCount}</div>
              <div className={styles.statDeltaDown}>clienți fără documente luna aceasta</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.siAmber}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className={styles.statCardInner}>
              <div className={styles.statLabel}>În așteptare</div>
              <div className={styles.statVal} style={{ color: "var(--amber)" }}>{counts.wait}</div>
              <div className={styles.statDeltaNeutral}>parțial trimise</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.siSky}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div className={styles.statCardInner}>
              <div className={styles.statLabel}>La zi</div>
              <div className={styles.statVal} style={{ color: "var(--sage)" }}>{counts.ok}</div>
              <div className={styles.statDeltaUp}>documente primite</div>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className={styles.filtersBar}>
          <div className={styles.filterTabs}>
            <button
              type="button"
              className={`${styles.filterTab} ${filterTab === "all" ? styles.active : ""}`}
              onClick={() => setFilterTab("all")}
            >
              Toți <span className={styles.filterTabCount}>{counts.all}</span>
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${filterTab === "ok" ? styles.active : ""}`}
              onClick={() => setFilterTab("ok")}
            >
              La zi <span className={styles.filterTabCount}>{counts.ok}</span>
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${filterTab === "wait" ? styles.active : ""}`}
              onClick={() => setFilterTab("wait")}
            >
              Așteptare <span className={styles.filterTabCount}>{counts.wait}</span>
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${filterTab === "late" ? styles.active : ""}`}
              onClick={() => setFilterTab("late")}
            >
              Restanți <span className={styles.filterTabCount}>{counts.late}</span>
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${filterTab === "none" ? styles.active : ""}`}
              onClick={() => setFilterTab("none")}
            >
              Neinițiați <span className={styles.filterTabCount}>{counts.none}</span>
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${filterTab === "archive" ? styles.active : ""}`}
              onClick={() => setFilterTab("archive")}
            >
              Arhivă <span className={styles.filterTabCount}>{counts.archived}</span>
            </button>
          </div>
          <div className={styles.filterSpacer} />
          <div className={styles.filterSortRow}>
          <div className={styles.filterSort}>
            <span>Sortare:</span>
            <div ref={sortMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                className={styles.filterSelect}
                onClick={() => setSortMenuOpen((v) => !v)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 190,
                  justifyContent: "space-between",
                }}
              >
                <span>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sortare"}</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>{sortMenuOpen ? "▲" : "▼"}</span>
              </button>
              {sortMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    minWidth: 220,
                    background: "#fff",
                    border: "1px solid var(--paper-3)",
                    borderRadius: "var(--r-md)",
                    boxShadow: "var(--shadow-md)",
                    zIndex: 40,
                    padding: 6,
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortMenuOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        background: sortBy === opt.value ? "var(--sage-xlight)" : "transparent",
                        color: sortBy === opt.value ? "var(--sage)" : "var(--ink)",
                        fontSize: 12.5,
                        fontWeight: sortBy === opt.value ? 600 : 500,
                        borderRadius: 8,
                        padding: "8px 10px",
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={{ height: 32, fontSize: 12, flexShrink: 0 }}
            onClick={() => setColumnsModalOpen(true)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="20" y2="12" />
              <line x1="12" y1="18" x2="20" y2="18" />
            </svg>
            Coloane
          </button>
          </div>
        </div>

        {/* TABLE */}
        <div className={styles.tableCard}>
          {filterTab === "archive" ? (
            <table>
              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th>CONTACT</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {archivedFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className={styles.emptyState}>
                        <span className={styles.emptyIcon} aria-hidden="true">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73L13 3.18a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4.09a2 2 0 0 0 2 0l7-4.09A2 2 0 0 0 21 16z" />
                            <polyline points="3.3 7 12 12 20.7 7" />
                            <line x1="12" y1="22" x2="12" y2="12" />
                          </svg>
                        </span>
                        <div className={styles.emptyTitle}>Niciun client arhivat</div>
                        <div className={styles.emptySub}>Clienții arhivați vor apărea aici. Poți restaura oricând.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  archivedFiltered.map((client, idx) => {
                    const colors = avatarColor(idx);
                    return (
                      <tr key={client.id}>
                        <td>
                          <div className={styles.clientCell}>
                            <div className={styles.clientAvatar} style={{ background: colors.bg, color: colors.fg }}>
                              {initials(client.name)}
                            </div>
                            <div>
                              <div className={styles.clientName}>{client.name}</div>
                              <div className={styles.clientCui}>{client.email ?? "—"}</div>
                              {clientLabels[client.id] && (
                                <div className={styles.clientCui} style={{ color: "var(--sage)" }}>
                                  #{clientLabels[client.id]}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "var(--ink-muted)", fontSize: 12.5 }}>
                          {client.phone ?? "—"}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            style={{ height: 28, fontSize: 11.5, padding: "0 10px" }}
                            disabled={restorePendingId === client.id}
                            onClick={async () => {
                              setRestorePendingId(client.id);
                              const result = await restoreClient(client.id);
                              setRestorePendingId(null);
                              if (result?.error) toast?.error(result.error);
                              else { toast?.success("Client restaurat."); router.refresh(); }
                            }}
                          >
                            {restorePendingId === client.id ? "Se restaurează…" : "Restaurează"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th className={styles.tdCheck}>
                    <div
                      className={`${styles.cb} ${selectedIds.size === sortedFiltered.length && sortedFiltered.length > 0 ? styles.checked : ""}`}
                      onClick={toggleSelectAll}
                      role="button"
                      tabIndex={0}
                      aria-label="Selectează toți"
                    />
                  </th>
                  {visibleColumns.client && <th>CLIENT</th>}
                  {visibleColumns.docs && <th>DOCUMENTE</th>}
                  {visibleColumns.activity && <th>ULTIMA ACTIVITATE</th>}
                  {visibleColumns.status && <th>STATUS</th>}
                  {visibleColumns.actions && <th></th>}
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        1 +
                        [
                          visibleColumns.client,
                          visibleColumns.docs,
                          visibleColumns.activity,
                          visibleColumns.status,
                          visibleColumns.actions,
                        ].filter(Boolean).length
                      }
                    >
                      <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🔍</span>
                        <div className={styles.emptyTitle}>Niciun client găsit</div>
                        <div className={styles.emptySub}>Încearcă să ajustezi filtrele sau termenul de căutare.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedFiltered.map((client, idx) => {
                  const lastUpload = uploads
                    .filter((u) => u.client_id === client.id)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  const lastStr = lastUpload
                    ? `${new Date(lastUpload.created_at).getDate()} ${MONTH_NAMES[new Date(lastUpload.created_at).getMonth()]}`
                    : "—";
                  const colors = avatarColor(idx);
                  return (
                    <tr
                      key={client.id}
                      className={selectedIds.has(client.id) ? styles.selected : ""}
                      onClick={() => openDrawer(client)}
                    >
                      <td className={styles.tdCheck} onClick={(e) => e.stopPropagation()}>
                        <div
                          className={`${styles.cb} ${selectedIds.has(client.id) ? styles.checked : ""}`}
                          onClick={() => toggleSelect(client.id)}
                        />
                      </td>
                      {visibleColumns.client && <td>
                        <div className={styles.clientCell} data-tutorial={idx === 0 ? "clienti-first-client" : undefined}>
                          <div className={styles.clientAvatar} style={{ background: colors.bg, color: colors.fg }}>
                            {initials(client.name)}
                          </div>
                          <div>
                            <div className={styles.clientName}>{client.name}</div>
                            <div className={styles.clientCui}>{client.email ?? "—"}</div>
                              {clientLabels[client.id] && (
                                <div className={styles.clientCui} style={{ color: "var(--sage)" }}>
                                  #{clientLabels[client.id]}
                                </div>
                              )}
                          </div>
                        </div>
                      </td>}
                      {visibleColumns.docs && <td>
                        <div className={styles.progWrap}>
                          <div className={styles.progBar}>
                            <div className={`${styles.progFill} ${progColor(client.status)}`} style={{ width: `${client.pct}%` }} />
                          </div>
                          <span className={styles.progLabel}>{client.docsLabel}</span>
                        </div>
                      </td>}
                      {visibleColumns.activity && <td style={{ color: "var(--ink-muted)", fontSize: 12.5 }}>{lastStr}</td>}
                      {visibleColumns.status && <td>{statusBadge(client.status)}</td>}
                      {visibleColumns.actions && <td>
                        <div className={styles.tdActions}>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            style={{ height: 28, fontSize: 11.5, padding: "0 10px" }}
                            data-tutorial={idx === 0 ? "clienti-first-request-btn" : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              setProgrameazaClient(client);
                            }}
                          >
                            Cerere
                          </button>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnIcon}`}
                            style={{ width: 28, height: 28 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditClient(client);
                            }}
                            aria-label="Editează client"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>
                        </div>
                      </td>}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* BULK BAR — pe mobil încape în ecran (wrap + width) */}
      <div className={`${styles.bulkBar} ${selectedIds.size > 0 && filterTab !== "archive" ? styles.visible : ""}`}>
        <span className={styles.bulkCount}>
          {selectedCount} {selectedCount === 1 ? "selectat" : "selectați"}
        </span>
        <button
          type="button"
          className={styles.bbPrimary}
          onClick={() => setBulkRequestOpen(true)}
          disabled={!canRunBulk || bulkRequestPending}
        >
          {bulkRequestPending ? "..." : "Cerere"}
        </button>
        <button
          type="button"
          className={styles.bbGhost}
          disabled={!canRunBulk || bulkExportPending}
          onClick={handleBulkExportZip}
        >
          {bulkExportPending ? "..." : "ZIP"}
        </button>
        <button type="button" className={styles.bbGhost} onClick={handleBulkLabel} disabled={!canRunBulk}>
          Etichetă
        </button>
        <button type="button" className={styles.bbDanger} onClick={() => setBulkArchiveOpen(true)} disabled={!canRunBulk || bulkArchivePending}>
          {bulkArchivePending ? "..." : "Arhivă"}
        </button>
        <button type="button" className={styles.bulkClose} onClick={clearSelection} aria-label="Anulează selecția">✕</button>
      </div>

      {/* DRAWER */}
      <div className={`${styles.drawerOverlay} ${drawerClient ? styles.open : ""}`} onClick={closeDrawer} aria-hidden />
      {drawerClient && (
        <div className={`${styles.drawer} ${styles.open}`} onClick={(e) => e.stopPropagation()}>
          <ClientiDrawer
            client={drawerClient}
            uploads={uploads.filter((u) => u.client_id === drawerClient.id)}
            currentMonth={currentMonth}
            currentYear={currentYear}
            isPremium={isPremium}
            onClose={closeDrawer}
            onEdit={() => {
              const found = initialClients.find((c) => c.id === drawerClient.id);
              if (found) setEditClient(found);
            }}
            onCerere={() => setProgrameazaClient(drawerClient)}
            onArchiveSuccess={() => { closeDrawer(); router.refresh(); }}
          />
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      <div className={`${styles.modalOverlay} ${modalOpen ? styles.open : ""}`} onClick={() => modalOpen && setModalOpen(false)}>
        <div className={styles.modal} data-tutorial="clienti-add-modal" onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div>
              <div className={styles.modalTitle}>Client nou</div>
              <div className={styles.modalSub}>Adaugă datele clientului pentru a putea trimite cereri de documente.</div>
            </div>
            <button type="button" className={styles.modalClose} onClick={() => setModalOpen(false)} aria-label="Închide">✕</button>
          </div>
          <form onSubmit={handleAddClient}>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Nume firmă / client *</label>
                <input className={styles.input} name="client_name" data-tutorial="clienti-add-name" type="text" placeholder="ex. Popescu Ion SRL" autoComplete="nope" required />
              </div>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Email</label>
                  <input className={styles.input} name="client_email" type="text" inputMode="email" placeholder="ion@firma.ro" autoComplete="nope" />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Telefon</label>
                  <input className={styles.input} name="client_phone" type="text" inputMode="tel" placeholder="0722 000 000" autoComplete="nope" />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setModalOpen(false)}>Anulează</button>
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                data-tutorial="clienti-add-submit"
                disabled={addPending || isAtClientLimit}
              >
                {addPending ? "Se salvează…" : "Adaugă client"}
              </button>
            </div>
            {isAtClientLimit && (
              <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 8 }}>
                {(clientLimit ?? 40) === 5
                  ? "Planul gratuit permite maxim 5 clienți. Alege Standard sau Premium pentru mai mulți."
                  : "Ai atins limita de 40 clienți pentru planul Standard."}
              </p>
            )}
          </form>
        </div>
      </div>

      <ClientiOnboardingTutorial
        userId={userId}
        hasAnyClients={totalClients > 0}
        modalOpen={modalOpen}
        drawerOpen={!!drawerClient}
        requestModalOpen={!!programeazaClient}
        onOpenAddClient={openAddClientModal}
        onOpenFirstClient={openFirstClientDrawer}
        onOpenFirstRequest={openFirstClientRequestModal}
        startSignal={tutorialStartSignal}
        continueSignal={tutorialContinueSignal}
      />

      {/* EDIT CLIENT MODAL */}
      <div className={`${styles.modalOverlay} ${editClient ? styles.open : ""}`} onClick={() => editClient && setEditClient(null)}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div>
              <div className={styles.modalTitle}>Editează client</div>
              <div className={styles.modalSub}>Modifică datele clientului.</div>
            </div>
            <button type="button" className={styles.modalClose} onClick={() => setEditClient(null)} aria-label="Închide">✕</button>
          </div>
          {editClient && (
            <form key={editClient.id} onSubmit={handleEditClient}>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Nume firmă / client *</label>
                  <input className={styles.input} name="client_name" type="text" placeholder="ex. Popescu Ion SRL" defaultValue={editClient.name} autoComplete="nope" required />
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Email</label>
                    <input className={styles.input} name="client_email" type="text" inputMode="email" placeholder="ion@firma.ro" defaultValue={editClient.email ?? ""} autoComplete="nope" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Telefon</label>
                    <input className={styles.input} name="client_phone" type="text" inputMode="tel" placeholder="0722 000 000" defaultValue={editClient.phone ?? ""} autoComplete="nope" />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setEditClient(null)}>Anulează</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={editPending}>
                  {editPending ? "Se salvează…" : "Salvează"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* PROGRAMEAZĂ MODAL */}
      {bulkRequestOpen && selectedClients.length > 0 && (
        <ProgrameazaModal
          open={bulkRequestOpen}
          onClose={() => {
            if (!bulkRequestPending) setBulkRequestOpen(false);
          }}
          client={{
            id: "bulk",
            name: `${selectedClients.length} clienți selectați`,
            document_types: Array.from(
              new Map(
                selectedClients
                  .flatMap((c) => c.document_types ?? [])
                  .map((d) => [d.id, d])
              ).values()
            ),
          }}
          existingScheduledAt={null}
          onSend={handleBulkSendRequest}
        />
      )}
      {programeazaClient && (
        <ProgrameazaModal
          open={!!programeazaClient}
          onClose={() => setProgrameazaClient(null)}
          client={programeazaClient}
          existingScheduledAt={programeazaClient.nextRequestAt ?? null}
          tutorialTargetId="clienti-request-modal"
          onSend={async (data) => {
            if (data.delivery === "email" && !programeazaClient.email?.trim()) {
              toast.error("Clientul nu are email setat. Editează clientul și adaugă email.");
              return false;
            }

            const result =
              data.sendMode === "now"
                ? await sendDocumentRequestNow(programeazaClient.id, {
                    delivery: data.delivery,
                    docTypes: data.docTypes,
                    message: data.message,
                    reminderAfter3Days: data.reminderAfter3Days,
                  })
                : await saveDocumentRequest(programeazaClient.id, {
                    ...data,
                    methods: [data.delivery],
                  });
            if (result?.error) {
              toast.error(result.error);
              return false;
            }

            if (data.delivery === "manual") {
              const origin =
                typeof window !== "undefined" ? window.location.origin : "";
              const link = `${origin}/upload/${programeazaClient.unique_token}`;
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                try {
                  await navigator.clipboard.writeText(link);
                  toast.success("Link copiat. Poți trimite manual către client.");
                } catch {
                  toast.success("Cerere salvată. Copiază manual linkul clientului.");
                }
              } else {
                toast.success("Cerere salvată. Copiază manual linkul clientului.");
              }
            } else {
              toast.success("Cerere trimisă pe email.");
            }
            setProgrameazaClient(null);
            if (drawerClient?.id === programeazaClient.id) closeDrawer();
            router.refresh();
            return true;
          }}
        />
      )}
      <ConfirmModal
        open={bulkArchiveOpen}
        title="Arhivezi clienții selectați?"
        message={`Vor fi arhivați ${selectedCount} ${selectedCount === 1 ? "client" : "clienți"}. Îi poți restaura ulterior din Arhivă.`}
        variant="danger"
        confirmLabel={bulkArchivePending ? "Se arhivează..." : "Arhivează"}
        loading={bulkArchivePending}
        onCancel={() => {
          if (!bulkArchivePending) setBulkArchiveOpen(false);
        }}
        onConfirm={handleBulkArchiveConfirm}
      />
      <div
        className={`${styles.modalOverlay} ${columnsModalOpen ? styles.open : ""}`}
        onClick={() => setColumnsModalOpen(false)}
      >
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div>
              <div className={styles.modalTitle}>Alege coloanele</div>
              <div className={styles.modalSub}>Configurează ce coloane se afișează în tabel.</div>
            </div>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setColumnsModalOpen(false)}
              aria-label="Închide"
            >
              ✕
            </button>
          </div>
          <div className={styles.modalBody}>
            {([
              { key: "client", label: "Client" },
              { key: "docs", label: "Documente" },
              { key: "activity", label: "Ultima activitate" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Acțiuni" },
            ] as const).map((item) => (
              <label key={item.key} className={styles.notifCard} style={{ cursor: "pointer" }}>
                <span className={styles.notifCardLabel}>{item.label}</span>
                <input
                  type="checkbox"
                  checked={visibleColumns[item.key]}
                  onChange={(e) => {
                    const next = { ...visibleColumns, [item.key]: e.target.checked };
                    const visibleCount = Object.values(next).filter(Boolean).length;
                    if (visibleCount === 0) {
                      toast.info("Trebuie să rămână cel puțin o coloană vizibilă.");
                      return;
                    }
                    persistVisibleColumns(next);
                  }}
                />
              </label>
            ))}
          </div>
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() =>
                persistVisibleColumns({
                  client: true,
                  docs: true,
                  activity: true,
                  status: true,
                  actions: true,
                })
              }
            >
              Resetează
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => setColumnsModalOpen(false)}
            >
              Gata
            </button>
          </div>
        </div>
      </div>
      <div
        className={`${styles.modalOverlay} ${labelModalOpen ? styles.open : ""}`}
        onClick={() => setLabelModalOpen(false)}
      >
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div>
              <div className={styles.modalTitle}>Etichetează clienții selectați</div>
              <div className={styles.modalSub}>
                Aplici aceeași etichetă la {selectedCount} {selectedCount === 1 ? "client" : "clienți"}.
              </div>
            </div>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setLabelModalOpen(false)}
              aria-label="Închide"
            >
              ✕
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Etichetă</label>
              <input
                className={styles.input}
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="Ex: Prioritar, TVA, Restanță"
                maxLength={40}
                autoComplete="off"
              />
            </div>
          </div>
          <div className={styles.modalFooter} style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => {
                applyBulkLabel("");
                setLabelModalOpen(false);
              }}
              style={{ background: "var(--red-xlight)", color: "var(--red)" }}
            >
              Șterge eticheta
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setLabelModalOpen(false)}
              >
                Anulează
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  const value = labelInput.trim();
                  if (!value) {
                    toast.info("Scrie o etichetă sau folosește „Șterge eticheta”.");
                    return;
                  }
                  applyBulkLabel(value);
                  setLabelModalOpen(false);
                }}
              >
                Aplică eticheta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTimeline({ uploads }: { uploads: Upload[] }) {
  const byDay = new Map<string, { count: number; latest: string }>();
  for (const u of uploads) {
    const d = new Date(u.created_at);
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const existing = byDay.get(dayKey);
    const t = u.created_at;
    if (!existing) byDay.set(dayKey, { count: 1, latest: t });
    else byDay.set(dayKey, { count: existing.count + 1, latest: t > existing.latest ? t : existing.latest });
  }
  const entries = Array.from(byDay.entries())
    .map(([dayKey, v]) => ({ dayKey, ...v }))
    .sort((a, b) => b.dayKey.localeCompare(a.dayKey));
  if (entries.length === 0) return <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Nicio activitate încă.</p>;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {entries.map(({ dayKey, count, latest }) => {
        const d = new Date(latest);
        const dateStr = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        return (
          <li key={dayKey} style={{ padding: "12px 0", borderBottom: "1px solid var(--paper-3)", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--sage-xlight)", color: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {count === 1 ? "1 document primit" : `${count} documente primite`} via link unic
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{dateStr}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ClientiDrawer({
  client,
  uploads,
  currentMonth,
  currentYear,
  isPremium,
  onClose,
  onEdit,
  onCerere,
  onArchiveSuccess,
}: {
  client: Client;
  uploads: Upload[];
  currentMonth: number;
  currentYear: number;
  isPremium: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCerere: () => void;
  onArchiveSuccess: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "docs" | "activity" | "settings">("overview");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivePending, setArchivePending] = useState(false);
  const [emailTogglePending, setEmailTogglePending] = useState(false);
  const [exportPending, setExportPending] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const types = client.document_types ?? [];
  const total = types.length;
  const received = new Set(
    uploads.filter((u) => u.month === currentMonth && u.year === currentYear).map((u) => u.document_type_id)
  );
  const pct = total === 0 ? 0 : Math.round((received.size / total) * 100);
  const circ = 2 * Math.PI * 30;
  const offset = circ * (1 - pct / 100);
  const monthName = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"][currentMonth - 1];

  async function handleExportClientZip() {
    if (uploads.length === 0) {
      toast.info("Clientul nu are documente de exportat.");
      return;
    }

    setExportPending(true);
    try {
      const zip = new JSZip();
      const usedPaths = new Set<string>();
      let exported = 0;
      const failed: string[] = [];

      for (const u of uploads) {
        const monthFolder = `${u.year}-${String(u.month).padStart(2, "0")}`;
        const baseName = sanitizeZipPart(u.file_name ?? "document");
        let path = `${monthFolder}/${baseName}`;
        let inc = 1;
        while (usedPaths.has(path)) {
          path = `${monthFolder}/${baseName}-${inc}`;
          inc++;
        }
        usedPaths.add(path);

        const res = await fetch(`/api/uploads/${u.id}?download=1`);
        if (!res.ok) {
          if (failed.length < 5) failed.push(u.file_name ?? "document");
          continue;
        }
        const blob = await res.blob();
        zip.file(path, blob);
        exported++;
      }

      if (exported === 0) {
        toast.error("Nu am putut exporta niciun document pentru acest client.");
        if (failed.length > 0) toast.info(`Eșecuri: ${failed.join(" | ")}`);
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const clientName = sanitizeZipPart(client.name || "client");
      const fileName = `documente-${clientName}.zip`;
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`ZIP exportat cu ${exported} documente.`);
      if (failed.length > 0) toast.info(`Fișiere neexportate: ${failed.join(" | ")}`);
    } catch {
      toast.error("A apărut o eroare la exportul ZIP.");
    } finally {
      setExportPending(false);
    }
  }

  return (
    <>
      <div className={styles.drawerHeader}>
        <div className={styles.drawerAvatar} style={{ background: "var(--sage-light)", color: "var(--sage)" }}>
          {initials(client.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.drawerClientName}>{client.name}</div>
          <div className={styles.drawerMeta}>
            <span className={styles.drawerCui}>{client.email ?? "—"}</span>
            <span className={`${styles.badge} ${styles.badgeOk}`}>
              <span className={styles.badgeDot} />
              {total === 0 ? "Neinițiat" : received.size === total ? "La zi" : received.size === 0 ? "Restant" : "Așteptare"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ height: 32, fontSize: 12 }}
            data-tutorial="clienti-drawer-request-btn"
            onClick={onCerere}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Cerere
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnIcon}`} onClick={onClose} aria-label="Închide">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.drawerTabs}>
        <button type="button" className={`${styles.dtab} ${tab === "overview" ? styles.active : ""}`} onClick={() => setTab("overview")}>Prezentare</button>
        <button type="button" className={`${styles.dtab} ${tab === "docs" ? styles.active : ""}`} onClick={() => setTab("docs")}>Documente</button>
        <button type="button" className={`${styles.dtab} ${tab === "activity" ? styles.active : ""}`} onClick={() => setTab("activity")}>Activitate</button>
        <button type="button" className={`${styles.dtab} ${tab === "settings" ? styles.active : ""}`} onClick={() => setTab("settings")}>Setări</button>
      </div>

      <div className={styles.drawerBody}>
        {tab === "overview" && (
          <>
            <div className={styles.drawerSection}>
              <div className={styles.dsLabel}>Documente {monthName} {currentYear}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                  <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                    <circle fill="none" stroke="var(--paper-2)" strokeWidth="8" cx="40" cy="40" r="30" />
                    <circle fill="none" stroke="var(--sage)" strokeWidth="8" strokeLinecap="round" cx="40" cy="40" r="30" strokeDasharray={circ} strokeDashoffset={offset} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--f-display)", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{pct}%</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--ink-muted)" }}>complet</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--sage)" }} />
                    <strong>{received.size}</strong> documente primite
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)" }} />
                    <strong>{total - received.size}</strong> în așteptare
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.drawerSection}>
              <div className={styles.dsLabel}>Informații client</div>
              <div className={styles.infoGrid}>
                <div>
                  <div className={styles.infoKey}>Email</div>
                  <div className={`${styles.infoVal} ${styles.link}`}>{client.email ?? "—"}</div>
                </div>
                <div>
                  <div className={styles.infoKey}>Telefon</div>
                  <div className={styles.infoVal}>{client.phone ?? "—"}</div>
                </div>
                <div>
                  <div className={styles.infoKey}>Client din</div>
                  <div className={styles.infoVal}>
                    {new Date(client.created_at).toLocaleDateString("ro-RO", { month: "short", year: "numeric" })}
                  </div>
                </div>
                <div>
                  <div className={styles.infoKey}>Cerere programată</div>
                  <div className={styles.infoVal}>
                    {client.nextRequestAt
                      ? (() => {
                          // Parse YYYY-MM-DD directly to avoid timezone shifts
                          const [y, m, d] = client.nextRequestAt!.split("-").map(Number);
                          return new Date(y, m - 1, d).toLocaleDateString("ro-RO", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          });
                        })()
                      : "Nicio cerere programată"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    style={{ height: 30, fontSize: 12, padding: "0 10px" }}
                    onClick={onEdit}
                  >
                    Editează contact
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.drawerSection}>
              <div className={styles.dsLabel}>Cerere rapidă</div>
              <div className={styles.quickSend}>
                <div>
                  <div className={styles.qsTitle}>Ce documente soliciți?</div>
                  <div className={styles.qsSub}>Selectează tipul și programează trimiterea (Email disponibil).</div>
                </div>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: "100%", height: 40, fontSize: 13.5 }} onClick={onCerere}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Programează cerere
                </button>
              </div>
            </div>
          </>
        )}
        {tab === "docs" && (
          <div className={styles.drawerSection}>
            <div className={styles.dsLabel}>DOCUMENTE PRIMITE — {monthName.toUpperCase()} {currentYear}</div>
            {uploads.filter((u) => u.month === currentMonth && u.year === currentYear).length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Niciun document încă pentru luna aceasta.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {uploads
                  .filter((u) => u.month === currentMonth && u.year === currentYear)
                  .map((u) => {
                    const { kind, label, bg } = fileIcon(u.file_name ?? "");
                    return (
                      <li key={u.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--paper-3)", display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
                          {kind === "pdf" && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <path d="M9 13h1v3" />
                              <path d="M13 16h-1a2 2 0 0 1 0-4h1z" />
                              <path d="M15 12h2a1 1 0 0 1 0 2h-2v2" />
                            </svg>
                          )}
                          {kind === "image" && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-4.5-4.5L9 18" />
                            </svg>
                          )}
                          {kind === "sheet" && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="M8 7h8" />
                              <path d="M8 12h8" />
                              <path d="M8 17h4" />
                            </svg>
                          )}
                          {kind === "doc" && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="9" y1="13" x2="15" y2="13" />
                              <line x1="9" y1="17" x2="13" y2="17" />
                            </svg>
                          )}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{u.file_name ?? "Document"}</div>
                          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{label} · {formatDocDate(u.created_at)}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => window.open(`/api/uploads/${u.id}`, "_blank")}
                            className={styles.docDownload}
                            title="Preview"
                            style={{ padding: 8, borderRadius: 8, color: "var(--ink)", border: "none", background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <a
                            href={`/api/uploads/${u.id}?download=1`}
                            download={u.file_name ?? undefined}
                            className={styles.docDownload}
                            title="Descarcă"
                            style={{ padding: 8, borderRadius: 8, color: "var(--ink)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </a>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        )}
        {tab === "activity" && (
          <div className={styles.drawerSection}>
            <div className={styles.dsLabel}>JURNAL ACTIVITATE</div>
            <ActivityTimeline uploads={uploads} />
          </div>
        )}
        {tab === "settings" && (
          <div className={styles.drawerSection}>
            <div className={styles.dsLabel}>PREFERINȚE NOTIFICARE</div>
            <div style={{ marginBottom: 24 }}>
              <div className={styles.notifCard}>
                <div className={styles.notifCardLeft}>
                  <div className={styles.notifCardIcon} style={{ background: "#e8f5e9", color: "#1b5e20" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <div>
                    <div className={styles.notifCardLabel}>WhatsApp Business</div>
                    <div className={styles.notifCardMeta}>Canal primar · Coming soon</div>
                  </div>
                </div>
                <button type="button" disabled className={styles.toggleSwitch} data-active="false" aria-label="Coming soon">
                  <span className={styles.toggleThumb} />
                </button>
              </div>
              <div className={styles.notifCard}>
                <div className={styles.notifCardLeft}>
                  <div className={`${styles.notifCardIcon} ${styles.notifCardIconEmail}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  </div>
                  <div>
                    <div className={styles.notifCardLabel}>Email</div>
                    <div className={styles.notifCardMeta}>{client.email ?? "—"} · Fallback</div>
                  </div>
                </div>
                <EmailToggle
                  clientId={client.id}
                  initialOn={!!client.reminder_enabled}
                  isPremium={isPremium}
                />
              </div>
              {!isPremium && (
                <p style={{ marginTop: 8, fontSize: 12, color: "var(--ink-muted)" }}>
                  Disponibil pe Premium (SMS reminder automat - coming soon).
                </p>
              )}
            </div>
            <div className={styles.dsLabel}>ACȚIUNI</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => {
                  const text = [client.name, client.email ?? "", client.phone ?? ""].filter(Boolean).join("\n");
                  navigator.clipboard.writeText(text);
                  toast?.success("Date copiate în clipboard.");
                }}
              >
                Copiază date client
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleExportClientZip}
                disabled={exportPending}
              >
                {exportPending ? "Se exportă..." : "Exportă documente client (ZIP)"}
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                style={{ width: "100%", justifyContent: "center", background: "var(--red-xlight)", color: "var(--red)" }}
                onClick={() => setArchiveOpen(true)}
              >
                Arhivează client
              </button>
            </div>
            <ConfirmModal
              open={archiveOpen}
              title="Arhivezi clientul?"
              message="Clientul va fi mutat în arhivă. Poți restaura mai târziu din setări."
              variant="danger"
              loading={archivePending}
              onCancel={() => {
                if (!archivePending) setArchiveOpen(false);
              }}
              onConfirm={async () => {
                setArchivePending(true);
                await removeClient(client.id);
                setArchivePending(false);
                setArchiveOpen(false);
                onArchiveSuccess();
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

function EmailToggle({
  clientId,
  initialOn,
  isPremium,
}: {
  clientId: string;
  initialOn: boolean;
  isPremium: boolean;
}) {
  const [on, setOn] = useState(initialOn);
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    setOn(initialOn);
  }, [initialOn, clientId]);

  return (
    <button
      type="button"
      disabled={!isPremium || pending}
      className={styles.toggleSwitch}
      data-active={on ? "true" : "false"}
      onClick={async () => {
        if (!isPremium) {
          toast.info("Reminder automat este disponibil doar pe Premium.");
          return;
        }
        const next = !on;
        setOn(next); // actualizare optimistă pentru animație live
        setPending(true);
        const fd = new FormData();
        fd.set("reminder_enabled", next ? "true" : "false");
        if (next) {
          // când activăm, setăm o zi de lună implicită (1)
          fd.set("reminder_day_of_month", "1");
        }
        const result = await updateClientReminder(clientId, fd);
        setPending(false);
        if (result?.error) {
          // revenim la starea anterioară dacă a eșuat
          setOn(!next);
          toast.error(result.error);
        } else {
          router.refresh();
        }
      }}
      aria-label={on ? "Dezactivează" : "Activează"}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}
