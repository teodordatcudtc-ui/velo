"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_CLIENT, DemoClientiScene } from "./DemoClientiScene";
import { DemoUploadScene } from "./DemoUploadScene";
import demoStyles from "./demo-video.module.css";

type Scene = "clienti" | "upload";
type Cursor = { x: number; y: number; clicking: boolean };

declare global {
  interface Window {
    __DEMO_VIDEO_DONE__?: boolean;
    __DEMO_VIDEO_READY__?: boolean;
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Multiplicator global — mărește pentru animație mai lentă. */
const PACE = 1.9;
const wait = (ms: number) => sleep(Math.round(ms * PACE));

function getFrameCenter(el: Element, frame: HTMLElement) {
  const r = el.getBoundingClientRect();
  const f = frame.getBoundingClientRect();
  return {
    x: r.left - f.left + r.width / 2,
    y: r.top - f.top + r.height / 2,
  };
}

function highlightInFrame(el: Element, frame: HTMLElement) {
  const r = el.getBoundingClientRect();
  const f = frame.getBoundingClientRect();
  return {
    top: r.top - f.top - 5,
    left: r.left - f.left - 5,
    width: r.width + 10,
    height: r.height + 10,
  };
}

/** Luna următoare — ziua 25 e mereu în viitor pentru demo. */
function demoScheduleMonth() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function scheduleIso25(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-25`;
}

type Props = { autoplay?: boolean; fillScreen?: boolean };

export function DemoVideoPlayer({ autoplay = false, fillScreen = false }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<Scene>("clienti");
  const [cursor, setCursor] = useState<Cursor>({ x: 200, y: 400, clicking: false });
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);
  const [highlight, setHighlight] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sceneLabel, setSceneLabel] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [clientNameInput, setClientNameInput] = useState("");
  const [clientEmailInput, setClientEmailInput] = useState("");
  const [clients, setClients] = useState<typeof DEMO_CLIENT[]>([]);
  const [programeazaOpen, setProgrameazaOpen] = useState(false);
  const [progSendMode, setProgSendMode] = useState<"now" | "scheduled">("now");
  const [progSendDate, setProgSendDate] = useState("");
  const [progCalendarMonth, setProgCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [uploadCount, setUploadCount] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [spvPhase, setSpvPhase] = useState<"idle" | "typing" | "connecting" | "connected">("idle");
  const [spvCif, setSpvCif] = useState("");

  const runningRef = useRef(false);
  const [started, setStarted] = useState(autoplay);
  const [finished, setFinished] = useState(false);

  const queryInFrame = useCallback((selector: string) => {
    return frameRef.current?.querySelector(selector) ?? null;
  }, []);

  const moveCursor = useCallback(async (x: number, y: number, delay = 620) => {
    setCursor((c) => ({ ...c, x, y, clicking: false }));
    await wait(delay);
  }, []);

  const clickAt = useCallback(async (x: number, y: number) => {
    setCursor((c) => ({ ...c, x, y, clicking: true }));
    setRipple({ x, y, key: Date.now() });
    await wait(280);
    setCursor((c) => ({ ...c, clicking: false }));
    await wait(140);
  }, []);

  const pointAt = useCallback(
    async (selector: string, delay = 520) => {
      const frame = frameRef.current;
      const el = queryInFrame(selector);
      if (!frame || !el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      await wait(420);
      setHighlight(highlightInFrame(el, frame));
      const c = getFrameCenter(el, frame);
      await moveCursor(c.x, c.y, delay);
    },
    [moveCursor, queryInFrame]
  );

  const tap = useCallback(
    async (selector: string) => {
      const frame = frameRef.current;
      const el = queryInFrame(selector);
      if (!frame || !el) return;
      await pointAt(selector, 480);
      const c = getFrameCenter(el, frame);
      await clickAt(c.x, c.y);
    },
    [clickAt, pointAt, queryInFrame]
  );

  const runTimeline = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    window.__DEMO_VIDEO_DONE__ = false;

    const CLIENT_NAME = "Demo Construct SRL";
    const CLIENT_EMAIL = "contact@democonstruct.ro";
    const schedMonth = demoScheduleMonth();

    setScene("clienti");
    setSceneLabel("Contabilul");
    setShowAddModal(false);
    setClientNameInput("");
    setClientEmailInput("");
    setClients([]);
    setProgrameazaOpen(false);
    setProgSendMode("now");
    setProgSendDate("");
    setProgCalendarMonth(schedMonth);
    setUploadCount(0);
    setUploadedFiles([]);
    setSpvPhase("idle");
    setSpvCif("");
    setToast(null);
    setHighlight(null);

    await wait(1100);

    await tap('[data-demo="add-client-btn"]');
    setShowAddModal(true);
    await wait(700);

    await pointAt('[data-demo="client-name-input"]', 420);
    for (let i = 1; i <= CLIENT_NAME.length; i++) {
      setClientNameInput(CLIENT_NAME.slice(0, i));
      await wait(62);
    }
    await wait(220);
    for (let i = 1; i <= CLIENT_EMAIL.length; i++) {
      setClientEmailInput(CLIENT_EMAIL.slice(0, i));
      await wait(48);
    }
    await wait(380);

    await tap('[data-demo="add-client-submit"]');
    setShowAddModal(false);
    setClients([{ ...DEMO_CLIENT, name: CLIENT_NAME, email: CLIENT_EMAIL }]);
    setHighlight(null);
    await wait(850);

    await tap('[data-demo="cerere-btn"]');
    setProgrameazaOpen(true);
    setProgSendMode("now");
    setProgCalendarMonth(schedMonth);
    await wait(800);

    await tap('[data-demo="prog-scheduled"]');
    setProgSendMode("scheduled");
    await wait(550);

    await tap('[data-demo="prog-day-25"]');
    setProgSendDate(scheduleIso25(schedMonth.year, schedMonth.month));
    await wait(650);

    await tap('[data-demo="prog-send-email"]');
    setProgrameazaOpen(false);
    setToast("Cerere trimisă pe email.");
    setHighlight(null);
    await wait(1100);

    setSceneLabel("Clientul");
    setScene("upload");
    await wait(950);

    await tap('[data-demo="upload-btn"]');
    await wait(500);

    const fileNames = Array.from({ length: 203 }, (_, i) => {
      const n = i + 1;
      if (n % 3 === 0) return `extras_banca_${n}.pdf`;
      if (n % 3 === 1) return `factura_${String(n).padStart(4, "0")}.pdf`;
      return `bon_fiscal_${n}.jpg`;
    });

    for (let i = 0; i < 203; i++) {
      setUploadCount(i + 1);
      if (i % 4 === 0 || i >= 198) {
        setUploadedFiles((prev) => [...prev, fileNames[i]]);
      }
      if (i % 8 === 0) await wait(22);
    }

    await wait(650);
    setSpvPhase("typing");
    await wait(500);
    await pointAt('[data-demo="spv-cif-input"]', 450);

    const CIF = "RO12345678";
    for (let i = 1; i <= CIF.length; i++) {
      setSpvCif(CIF.slice(0, i));
      await wait(72);
    }
    await wait(380);

    await tap('[data-demo="spv-connect-btn"]');
    setSpvPhase("connecting");
    await wait(1200);
    setSpvPhase("connected");
    setHighlight(null);
    await wait(1100);

    setSceneLabel(null);
    await wait(700);
    window.__DEMO_VIDEO_DONE__ = true;
    setFinished(true);
    runningRef.current = false;
  }, [clickAt, pointAt, tap]);

  const handleStart = useCallback(() => {
    setStarted(true);
    setFinished(false);
    void runTimeline();
  }, [runTimeline]);

  useEffect(() => {
    window.__DEMO_VIDEO_READY__ = true;
    if (autoplay) {
      setStarted(true);
      const t = setTimeout(() => void runTimeline(), 600);
      return () => clearTimeout(t);
    }
  }, [autoplay, runTimeline]);

  const uploadPct = Math.round((uploadCount / 203) * 100);
  const phoneClass = fillScreen ? `${demoStyles.phone} ${demoStyles.phoneFill}` : demoStyles.phone;

  return (
    <div className={fillScreen ? demoStyles.stageFill : demoStyles.stage}>
      <div ref={frameRef} className={phoneClass}>
        <div className={demoStyles.viewport}>
          <div className={demoStyles.sceneLayer} style={{ display: scene === "clienti" ? "block" : "none" }}>
            <DemoClientiScene
              showAddModal={showAddModal}
              clientNameInput={clientNameInput}
              clientEmailInput={clientEmailInput}
              clients={clients}
              programeazaOpen={programeazaOpen}
              progSendMode={progSendMode}
              progSendDate={progSendDate}
              progCalendarMonth={progCalendarMonth}
              onProgSendModeChange={setProgSendMode}
              onProgSendDateChange={setProgSendDate}
              onProgCalendarMonthChange={(year, month) => setProgCalendarMonth({ year, month })}
            />
          </div>
          {scene === "upload" && (
            <div className={demoStyles.sceneLayer}>
              <DemoUploadScene
                uploadCount={uploadCount}
                uploadedFiles={uploadedFiles}
                spvPhase={spvPhase}
                spvCif={spvCif}
              />
            </div>
          )}
        </div>

        {highlight && (
          <div
            className={demoStyles.highlightRing}
            style={{ top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height }}
          />
        )}

        <div
          className={`${demoStyles.demoCursor} ${cursor.clicking ? demoStyles.demoCursorClick : ""}`}
          style={{ left: cursor.x, top: cursor.y }}
        />

        {ripple && (
          <div key={ripple.key} className={demoStyles.clickRipple} style={{ left: ripple.x, top: ripple.y }} />
        )}

        {toast && <div className={demoStyles.toast}>{toast}</div>}

        {scene === "upload" && uploadCount > 0 && uploadCount < 203 && (
          <div className={demoStyles.uploadCounter}>
            {uploadCount} / 203 documente
            <div className={demoStyles.uploadProgressBar}>
              <div className={demoStyles.uploadProgressFill} style={{ width: `${uploadPct}%` }} />
            </div>
          </div>
        )}

        {scene === "upload" && uploadCount >= 203 && spvPhase !== "connected" && (
          <div className={demoStyles.uploadCounter}>✓ 203 documente încărcate</div>
        )}

        <div className={`${demoStyles.sceneLabel} ${sceneLabel ? demoStyles.sceneLabelVisible : ""}`}>
          {sceneLabel === "Contabilul"
            ? "Perspectiva contabilului"
            : sceneLabel === "Clientul"
              ? "Perspectiva clientului"
              : ""}
        </div>

        {!started && (
          <div className={demoStyles.startOverlay}>
            <p className={demoStyles.startKicker}>Demo local · 9:16</p>
            <h1 className={demoStyles.startTitle}>Animație Vello</h1>
            <p className={demoStyles.startSub}>
              Adaugă client → cerere → 203 documente → SPV
            </p>
            <p className={demoStyles.startHint}>
              MP4: rulează <code>npm run demo:record</code> → fișier în <code>public/demo-flow.mp4</code>
            </p>
            <button type="button" className={demoStyles.startBtn} onClick={handleStart}>
              ▶ Rulează animația
            </button>
          </div>
        )}

        {finished && (
          <button type="button" className={demoStyles.replayBtn} onClick={handleStart}>
            ↻ Rulează din nou
          </button>
        )}
      </div>
    </div>
  );
}
