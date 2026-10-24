import { useLanguage } from "../context/LanguageContext";

export type PlatformType = "instagram" | "tiktok" | "youtube";

interface PlatformTabsProps {
  activePlatform: PlatformType;
  onSelectPlatform: (platform: PlatformType) => void;
  disabled?: boolean;
}

export function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function TikTokIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.892-2.891 2.896 2.896 0 0 1 2.892-2.892c.384 0 .748.077 1.08.217V9.453a6.326 6.326 0 0 0-1.08-.094A6.34 6.34 0 0 0 3.14 15.68a6.34 6.34 0 0 0 6.343 6.338 6.34 6.34 0 0 0 6.338-6.338V9.167a8.163 8.163 0 0 0 4.768 1.517v-3.49a4.802 4.802 0 0 1-1-.508z" />
    </svg>
  );
}

export function YouTubeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export const PLATFORM_INFO: Record<
  PlatformType,
  {
    name: string;
    badge: string;
    tagline: string;
    placeholder: string;
    accentClass: string;
    activeTabClass: string;
    icon: React.ComponentType<{ className?: string }>;
    supportedItems: string[];
  }
> = {
  instagram: {
    name: "Instagram",
    badge: "Reels & Post",
    tagline: "Download Reels, Carousel Post, Foto & Audio Instagram",
    placeholder: "Tempel tautan Instagram (Reels, Post, atau Carousel)...",
    accentClass: "from-pink-500 via-rose-500 to-amber-500",
    activeTabClass:
      "border-pink-500 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-amber-500/10 text-pink-600 dark:text-pink-400 shadow-pink-500/10 shadow-lg",
    icon: InstagramIcon,
    supportedItems: ["Reels Video", "Post Foto & Carousel", "Story", "Audio MP3"],
  },
  tiktok: {
    name: "TikTok",
    badge: "Video & Post",
    tagline: "Download Video TikTok HD Tanpa Watermark & MP3",
    placeholder: "Tempel tautan TikTok (Video atau Foto slide)...",
    accentClass: "from-cyan-400 via-teal-500 to-slate-900 dark:to-cyan-600",
    activeTabClass:
      "border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-cyan-500/10 shadow-lg",
    icon: TikTokIcon,
    supportedItems: ["Video HD Tanpa Watermark", "TikTok Foto Slide", "Audio Sound MP3"],
  },
  youtube: {
    name: "YouTube",
    badge: "Video & MP3",
    tagline: "Download Video YouTube HD, Shorts & Audio MP3",
    placeholder: "Tempel tautan YouTube (Video atau Shorts)...",
    accentClass: "from-red-500 via-red-600 to-red-700",
    activeTabClass:
      "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 shadow-red-500/10 shadow-lg",
    icon: YouTubeIcon,
    supportedItems: ["Video MP4 HD (1080p)", "YouTube Shorts", "Audio MP3"],
  },
};

export default function PlatformTabs({
  activePlatform,
  onSelectPlatform,
  disabled = false,
}: PlatformTabsProps) {
  const { t } = useLanguage();
  const platforms: PlatformType[] = ["instagram", "tiktok", "youtube"];

  return (
    <div className="w-full">
      {/* 3 Platform Menu Tabs */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 p-1.5 sm:p-2 border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
        {platforms.map((key) => {
          const config = PLATFORM_INFO[key];
          const platformI18n = t.platforms[key];
          const Icon = config.icon;
          const isActive = activePlatform === key;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPlatform(key)}
              className={`group relative flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 rounded-xl px-3 py-2.5 sm:py-3 font-semibold transition-all duration-200 outline-none ${isActive
                  ? `border ${config.activeTabClass} scale-[1.01]`
                  : "border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50"
                }`}
            >
              <div
                className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${isActive
                    ? key === "instagram"
                      ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm"
                      : key === "tiktok"
                        ? "bg-black text-cyan-400 dark:bg-slate-900 border border-cyan-500/30 shadow-sm"
                        : "bg-red-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                  }`}
              >
                <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </div>

              <div className="text-center sm:text-left">
                <span className="block text-xs sm:text-sm font-bold tracking-tight">
                  {platformI18n.name}
                </span>
                <span className="hidden sm:block text-[10px] font-medium opacity-70">
                  {platformI18n.badge}
                </span>
              </div>

              {isActive && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-current opacity-80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
