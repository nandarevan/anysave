import { ArrowDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function HeroSection() {
  const { lang, t } = useLanguage();

  return (
    <section className="relative overflow-hidden pt-32 pb-12 sm:pt-40 sm:pb-16">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-ocean-500/8 blur-3xl dark:bg-ocean-500/10" />
        <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-ocean-300/10 blur-3xl dark:bg-ocean-400/5" />
        <div className="absolute top-10 left-0 h-56 w-56 rounded-full bg-ocean-400/6 blur-3xl dark:bg-ocean-600/8" />
      </div>

      <div className="mx-auto max-w-3xl px-5 text-center animate-fade-in-up">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center rounded-full border border-ocean-200 dark:border-ocean-800 bg-ocean-50 dark:bg-ocean-900/40 px-4 py-1.5 text-xs font-semibold text-ocean-600 dark:text-ocean-300">
          {lang === "id" ? "100% Gratis dan Tanpa Watermark" : "100% Free and Without Watermark"}
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          {lang === "id" ? "Semua Platform Jadi Satu" : "All in One"}
          <br />
          <span className="bg-gradient-to-r from-ocean-500 to-ocean-700 bg-clip-text text-transparent">
            {t.hero.title}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400 sm:text-lg">
          {t.hero.subtitle}
        </p>

        {/* Scroll indicator */}
        <div className="mt-10 flex justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 animate-bounce">
            <ArrowDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
        </div>
      </div>
    </section>
  );
}
