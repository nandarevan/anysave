import { useState, useRef } from "react";
import {
  Video,
  Music,
  Image as ImageIcon,
  ExternalLink,
  Clock,
  User,
  Download,
  Loader2,
} from "lucide-react";
import DownloadProgressModal from "./DownloadProgressModal";
import { useLanguage } from "../context/LanguageContext";

export interface MediaFormat {
  format_type: "video" | "audio" | "image";
  label: string;
  ext: string;
  quality?: string;
  url?: string;
  filesize?: number;
}

export interface ExtractResult {
  success: boolean;
  platform: string;
  title: string;
  author?: string;
  thumbnail?: string;
  duration?: string;
  original_url: string;
  formats: MediaFormat[];
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  instagram:
    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  tiktok:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
};

const FORMAT_ICONS: Record<string, typeof Video> = {
  video: Video,
  audio: Music,
  image: ImageIcon,
};

const FORMAT_STYLES: Record<string, string> = {
  video:
    "bg-ocean-500 hover:bg-ocean-600 shadow-ocean-500/20 hover:shadow-ocean-500/30",
  audio:
    "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 hover:shadow-emerald-500/30",
  image:
    "bg-violet-500 hover:bg-violet-600 shadow-violet-500/20 hover:shadow-violet-500/30",
};

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ResultCardProps {
  result: ExtractResult;
  apiBase: string;
}

export default function ResultCard({ result, apiBase }: ResultCardProps) {
  const { t } = useLanguage();
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [downloadModal, setDownloadModal] = useState<{
    isOpen: boolean;
    filename: string;
    formatType: "video" | "audio" | "image";
    quality?: string;
    statusText: string;
    progressPercent: number | null;
  }>({
    isOpen: false,
    filename: "",
    formatType: "video",
    quality: "",
    statusText: "",
    progressPercent: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const platformClass =
    PLATFORM_COLORS[result.platform] ??
    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

  const handleDownload = async (fmt: MediaFormat, idx: number) => {
    if (!fmt.url && !result.original_url) return;

    setDownloadingIndex(idx);

    const safeTitle = result.title.replace(/[^\w\s]/g, "").trim().slice(0, 60);
    const filename = `${safeTitle || "anysave_media"}.${fmt.ext}`;

    const downloadTargetUrl =
      fmt.url || (fmt.format_type === "image" ? result.thumbnail || "" : result.original_url);

    const proxyUrl = `${apiBase}/api/download?url=${encodeURIComponent(
      downloadTargetUrl,
    )}&format_type=${fmt.format_type}&filename=${encodeURIComponent(
      filename,
    )}&ext=${fmt.ext}`;

    // Open progress modal immediately
    setDownloadModal({
      isOpen: true,
      filename,
      formatType: fmt.format_type,
      quality: fmt.quality || "",
      statusText: t.modal.connecting,
      progressPercent: null,
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setDownloadModal((prev) => ({
        ...prev,
        statusText: t.modal.serverProcessing,
      }));

      const response = await fetch(proxyUrl, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(t.modal.error);
      }

      setDownloadModal((prev) => ({
        ...prev,
        statusText: t.modal.receiving,
      }));

      const contentLength = response.headers.get("Content-Length");
      let blob: Blob;

      if (contentLength && response.body) {
        const total = parseInt(contentLength, 10);
        let loaded = 0;
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          const percent = Math.min(Math.round((loaded / total) * 100), 100);
          setDownloadModal((prev) => ({
            ...prev,
            progressPercent: percent,
            statusText: t.modal.downloadingPercent(percent),
          }));
        }

        blob = new Blob(chunks as BlobPart[]);
      } else {
        blob = await response.blob();
      }

      setDownloadModal((prev) => ({
        ...prev,
        statusText: t.modal.complete,
        progressPercent: 100,
      }));

      // Trigger browser file download directly
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      // Brief delay to let user see 100% completion before closing modal
      setTimeout(() => {
        setDownloadModal((prev) => ({ ...prev, isOpen: false }));
        setDownloadingIndex(null);
      }, 600);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled download voluntarily
      } else {
        alert(t.modal.error);
      }
      setDownloadModal((prev) => ({ ...prev, isOpen: false }));
      setDownloadingIndex(null);
    }
  };

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setDownloadModal((prev) => ({ ...prev, isOpen: false }));
    setDownloadingIndex(null);
  };

  return (
    <section className="mx-auto max-w-2xl px-5 pb-10 animate-fade-in-up">
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-xl shadow-slate-900/[0.06] dark:shadow-black/25">
        {/* Thumbnail */}
        {result.thumbnail && (
          <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
            <img
              src={result.thumbnail}
              alt={result.title}
              className="h-full w-full object-cover"
              loading="eager"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Platform badge */}
            <span
              className={`absolute top-3 left-3 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${platformClass}`}
            >
              {result.platform}
            </span>

            {/* Duration */}
            {result.duration && result.duration !== "N/A" && (
              <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <Clock className="h-3 w-3" />
                {result.duration}
              </span>
            )}
          </div>
        )}

        {/* Info */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <h2 className="text-lg font-bold leading-snug text-slate-800 dark:text-white line-clamp-2">
            {result.title}
          </h2>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            {result.author && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {result.author}
              </span>
            )}
            <a
              href={result.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-ocean-500 hover:text-ocean-600 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t.result.source}
            </a>
          </div>

          {/* Divider */}
          <hr className="border-slate-100 dark:border-slate-700" />

          {/* Download buttons */}
          <div
            className={`grid gap-2.5 ${
              result.formats.length > 3
                ? "grid-cols-1 sm:grid-cols-2 max-h-[420px] overflow-y-auto pr-1"
                : "grid-cols-1 sm:grid-cols-3"
            }`}
          >
            {result.formats.map((fmt, idx) => {
              const Icon = FORMAT_ICONS[fmt.format_type] ?? Download;
              const btnStyle =
                FORMAT_STYLES[fmt.format_type] ?? "bg-slate-500 hover:bg-slate-600";
              const size = formatBytes(fmt.filesize);
              const isDownloading = downloadingIndex === idx;
              const displayLabel = fmt.label || fmt.ext.toUpperCase();

              return (
                <button
                  key={`${fmt.format_type}-${fmt.ext}-${idx}`}
                  onClick={() => handleDownload(fmt, idx)}
                  disabled={isDownloading}
                  title={fmt.label || fmt.ext.toUpperCase()}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.97] disabled:opacity-75 ${btnStyle}`}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      <span>{t.result.preparing}</span>
                    </>
                  ) : (
                    <>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {displayLabel}
                        {size && (
                          <span className="ml-1 text-[11px] font-normal opacity-75">
                            ({size})
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-time Download Progress Modal */}
      <DownloadProgressModal
        isOpen={downloadModal.isOpen}
        filename={downloadModal.filename}
        formatType={downloadModal.formatType}
        quality={downloadModal.quality}
        statusText={downloadModal.statusText}
        progressPercent={downloadModal.progressPercent}
        onCancel={handleCancelDownload}
      />
    </section>
  );
}
