import { Loader2, Video, Music, Image as ImageIcon, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface DownloadProgressModalProps {
  isOpen: boolean;
  filename: string;
  formatType: "video" | "audio" | "image";
  quality?: string;
  statusText: string;
  progressPercent: number | null;
  onCancel: () => void;
}

export default function DownloadProgressModal({
  isOpen,
  filename,
  formatType,
  quality,
  statusText,
  progressPercent,
  onCancel,
}: DownloadProgressModalProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const Icon =
    formatType === "video" ? Video : formatType === "audio" ? Music : ImageIcon;

  const accentGradient =
    formatType === "video"
      ? "from-cyan-500 to-ocean-600 shadow-ocean-500/25"
      : formatType === "audio"
      ? "from-emerald-500 to-teal-600 shadow-emerald-500/25"
      : "from-pink-500 to-rose-600 shadow-pink-500/25";

  const badgeColor =
    formatType === "video"
      ? "bg-ocean-50 text-ocean-700 dark:bg-ocean-950/50 dark:text-ocean-300 border-ocean-200 dark:border-ocean-800"
      : formatType === "audio"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
      : "bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300 border-pink-200 dark:border-pink-800";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl shadow-slate-950/30 transition-all animate-scale-in">
        {/* Soft Ambient Glows */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-ocean-500/10 dark:bg-ocean-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-teal-500/10 dark:bg-teal-400/10 blur-3xl" />

        {/* Close / Cancel Button in corner */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={t.modal.cancel}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Animated Spinner and Glowing Icon */}
          <div className="relative mb-4 mt-2 flex h-20 w-20 items-center justify-center">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-ocean-500 dark:border-t-ocean-400 animate-spin" />

            {/* Inner pulsing icon container */}
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${accentGradient} text-white shadow-lg`}
            >
              <Icon className="h-6 w-6 animate-pulse" />
            </div>
          </div>

          {/* Modal Title */}
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {t.modal.title}
          </h3>

          {/* Target File details */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span
              className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold uppercase ${badgeColor}`}
            >
              {formatType} {quality ? `(${quality})` : ""}
            </span>
            <span className="max-w-[240px] truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              {filename}
            </span>
          </div>

          {/* Dynamic Status Text */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-ocean-500 shrink-0" />
            <span>{statusText}</span>
          </div>

          {/* Progress Bar Container */}
          <div className="mt-4 w-full">
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              {progressPercent !== null ? (
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-ocean-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gradient-to-r from-cyan-500 via-ocean-500 to-teal-400 animate-pulse" />
              )}
            </div>

            {progressPercent !== null && (
              <div className="mt-1.5 flex justify-end text-[11px] font-bold text-ocean-600 dark:text-ocean-400">
                {progressPercent}%
              </div>
            )}
          </div>

          {/* Helpful Micro-copy */}
          <p className="mt-4 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            {t.modal.note}
          </p>

          {/* Cancel button */}
          <button
            type="button"
            onClick={onCancel}
            className="mt-5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t.modal.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
