import { useState, useEffect } from "react";
import { Sun, Moon, Globe } from "lucide-react";
import type { PlatformType } from "./PlatformTabs";
import { InstagramIcon, TikTokIcon, YouTubeIcon, FacebookIcon } from "./PlatformTabs";
import { useLanguage } from "../context/LanguageContext";

interface NavbarProps {
  activePlatform?: PlatformType;
  onSelectPlatform?: (platform: PlatformType) => void;
}

export default function Navbar({
  activePlatform = "instagram",
  onSelectPlatform,
}: NavbarProps) {
  const { lang, toggleLang, t } = useLanguage();

  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("anysavevid-theme") || localStorage.getItem("anysave-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("anysavevid-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("anysavevid-theme", "light");
    }
  }, [dark]);

  const platformItems: { id: PlatformType; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "instagram", name: t.platforms.instagram.name, icon: InstagramIcon },
    { id: "tiktok", name: t.platforms.tiktok.name, icon: TikTokIcon },
    { id: "youtube", name: t.platforms.youtube.name, icon: YouTubeIcon },
    { id: "facebook", name: t.platforms.facebook.name, icon: FacebookIcon },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass glass-light dark:glass-dark">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center transition-transform group-hover:scale-105">
            <img
              src="/images/logo_icon.png"
              alt="AnySaveVid Logo"
              className="h-full w-full object-contain drop-shadow-sm"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            Any<span className="text-ocean-500">SaveVid</span>
          </span>
        </a>

        {/* 3 Platform interactive menu switcher in Navbar */}
        <div className="hidden items-center gap-1.5 sm:flex bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/80 dark:border-slate-700/80">
          {platformItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePlatform === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPlatform?.(item.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  isActive
                    ? item.id === "instagram"
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
                      : item.id === "tiktok"
                      ? "bg-slate-900 text-cyan-400 dark:bg-black shadow-sm"
                      : "bg-red-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Controls: Language switcher and Theme toggle */}
        <div className="flex items-center gap-2">
          {/* Language toggle menu */}
          <button
            type="button"
            id="lang-toggle"
            onClick={toggleLang}
            aria-label={t.navbar.switchLang}
            title={t.navbar.switchLang}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 sm:px-3 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md active:scale-95"
          >
            <Globe className="h-4 w-4 text-ocean-500 shrink-0" />
            <span>{lang.toUpperCase()}</span>
            <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-slate-500 font-normal">
              {lang === "id" ? "Bahasa" : "English"}
            </span>
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            id="theme-toggle"
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? t.navbar.themeLight : t.navbar.themeDark}
            title={dark ? t.navbar.themeLight : t.navbar.themeDark}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md active:scale-95"
          >
            {dark ? (
              <Sun className="h-[18px] w-[18px] text-amber-500" />
            ) : (
              <Moon className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
