import { useState, useMemo, useEffect } from "react";
import {
  Link2,
  ClipboardPaste,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import PlatformTabs, {
  type PlatformType,
} from "./PlatformTabs";
import { useLanguage } from "../context/LanguageContext";

interface DownloaderInputProps {
  activePlatform: PlatformType;
  onSelectPlatform: (platform: PlatformType) => void;
  onExtract: (url: string, platform: PlatformType) => Promise<void>;
  loading: boolean;
  error: string | null;
  onClearError: () => void;
}

export function detectUrlPlatform(url: string): PlatformType | null {
  const clean = url.toLowerCase().trim();
  if (clean.includes("instagram.com")) return "instagram";
  if (clean.includes("tiktok.com")) return "tiktok";
  if (clean.includes("youtube.com") || clean.includes("youtu.be")) return "youtube";
  if (clean.includes("facebook.com") || clean.includes("fb.watch") || clean.includes("fb.com")) return "facebook";
  return null;
}

export default function DownloaderInput({
  activePlatform,
  onSelectPlatform,
  onExtract,
  loading,
  error,
  onClearError,
}: DownloaderInputProps) {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl("");
    if (error) onClearError();
  }, [activePlatform]);

  const platformI18n = t.platforms[activePlatform];
  const detectedPlatform = useMemo(() => detectUrlPlatform(url), [url]);
  const isPlatformMismatch =
    detectedPlatform !== null && detectedPlatform !== activePlatform;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        if (error) onClearError();
      }
    } catch {
      // Clipboard API may be denied or not supported
    }
  };

  const handleSwitchToDetected = () => {
    if (detectedPlatform) {
      onSelectPlatform(detectedPlatform);
      if (error) onClearError();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl || loading) return;

    if (detectedPlatform && detectedPlatform !== activePlatform) {
      const detectedName = t.platforms[detectedPlatform].name;
      const activeName = platformI18n.name;
      alert(t.input.mismatchAlert(activeName, detectedName));
      return;
    }

    onExtract(cleanUrl, activePlatform);
  };

  return (
    <section id="downloader" className="mx-auto max-w-2xl px-5 pb-8">
      {/* 3 Platform Menus on Dashboard */}
      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.platforms.selectLabel}
          </span>
          <span className="text-xs font-medium text-ocean-600 dark:text-ocean-400">
            {t.platforms.activeModeLabel} <strong className="font-bold">{platformI18n.name}</strong>
          </span>
        </div>
        <PlatformTabs
          activePlatform={activePlatform}
          onSelectPlatform={(p) => {
            onSelectPlatform(p);
            if (error) onClearError();
          }}
          disabled={loading}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input box */}
        <div
          className={`group relative flex items-center rounded-2xl border bg-white dark:bg-slate-800/90 shadow-lg shadow-slate-900/[0.04] dark:shadow-black/25 transition-all ${
            isPlatformMismatch
              ? "border-amber-400 ring-4 ring-amber-400/10 dark:border-amber-500"
              : "border-slate-200 dark:border-slate-700 focus-within:border-ocean-500 focus-within:ring-4 focus-within:ring-ocean-500/15"
          }`}
        >
          {/* Platform Icon indicator */}
          <div className="pl-4 text-slate-400 dark:text-slate-500">
            <Link2 className="h-5 w-5" />
          </div>

          {/* URL Input */}
          <input
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) onClearError();
            }}
            placeholder={platformI18n.placeholder}
            className="h-14 flex-1 bg-transparent px-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none sm:text-base"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Clear button if URL present */}
          {url && !loading && (
            <button
              type="button"
              onClick={() => {
                setUrl("");
                if (error) onClearError();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              title={t.input.clear}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Paste button */}
          <button
            type="button"
            id="paste-btn"
            onClick={handlePaste}
            className="mr-2 flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/80 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95"
            title={t.input.paste}
          >
            <ClipboardPaste className="h-3.5 w-3.5 text-ocean-500" />
            <span className="hidden sm:inline">{t.input.paste}</span>
          </button>
        </div>

        {/* Smart Platform Mismatch Banner */}
        {isPlatformMismatch && detectedPlatform && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs sm:text-sm text-amber-800 dark:text-amber-200 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>
                {t.input.mismatchText} <strong>{t.platforms[detectedPlatform].name}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSwitchToDetected}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 font-bold shadow-sm transition-transform active:scale-95 shrink-0"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              {t.input.mismatchBtn} {t.platforms[detectedPlatform].name}
            </button>
          </div>
        )}

        {/* Download Action Button */}
        <button
          type="submit"
          id="download-btn"
          disabled={loading || !url.trim()}
          className={`group relative flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r px-6 py-4 text-sm sm:text-base font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${
            activePlatform === "instagram"
              ? "from-pink-500 via-rose-500 to-amber-500 shadow-pink-500/25 hover:shadow-pink-500/35"
              : activePlatform === "tiktok"
              ? "from-cyan-500 to-teal-600 shadow-cyan-500/25 hover:shadow-cyan-500/35"
              : activePlatform === "youtube"
              ? "from-red-500 to-red-600 shadow-red-500/25 hover:shadow-red-500/35"
              : "from-blue-600 to-indigo-700 shadow-blue-500/25 hover:shadow-blue-500/35"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t.input.loadingBtn}
            </>
          ) : (
            <>
              {t.input.downloadBtn} {platformI18n.name}
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* Platform Features Pill Checklist */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
        {platformI18n.supported.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {item}
          </span>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3.5 text-sm text-red-700 dark:text-red-300 animate-fade-in-up">
          <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          <span className="flex-1 leading-relaxed">{error}</span>
          <button
            onClick={onClearError}
            className="shrink-0 rounded-md p-0.5 transition-colors hover:bg-red-100 dark:hover:bg-red-800/40"
            aria-label="Tutup error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
