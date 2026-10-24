import { ShieldCheck, Zap, CheckCircle2, ArrowUp } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const featureCards = [
    {
      icon: ShieldCheck,
      iconColor: "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50",
      title: t.footer.features.card1Title,
      desc: t.footer.features.card1Desc,
    },
    {
      icon: Zap,
      iconColor: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50",
      title: t.footer.features.card2Title,
      desc: t.footer.features.card2Desc,
    },
    {
      icon: CheckCircle2,
      iconColor: "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50",
      title: t.footer.features.card3Title,
      desc: t.footer.features.card3Desc,
    },
  ];

  const linkColumns = [
    {
      title: t.footer.col1Title,
      links: t.footer.col1Links.map((label) => ({ label, href: "#downloader" })),
    },
    {
      title: t.footer.col2Title,
      links: t.footer.col2Links.map((label) => ({ label, href: "#downloader" })),
    },
    {
      title: t.footer.col3Title,
      links: t.footer.col3Links.map((label) => ({ label, href: "#downloader" })),
    },
    {
      title: t.footer.col4Title,
      links: t.footer.col4Links.map((label) => ({ label, href: "#downloader" })),
    },
  ];

  return (
    <footer className="mt-20 border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 pt-12 pb-8">
      <div className="mx-auto max-w-6xl px-5 space-y-12">
        {/* 1. Top Row: 3 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featureCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${card.iconColor}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Middle Section: 4 Link Columns with Red/Accent Underlines */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {linkColumns.map((col, idx) => (
            <div key={idx} className="space-y-3">
              <div className="inline-flex flex-col">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  {col.title}
                </h4>
                <div className="mt-1.5 h-[2.5px] w-full rounded-full bg-rose-500" />
              </div>
              <ul className="space-y-2 pt-1">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <a
                      href={link.href}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 3. Banner Card: Platform Information & Feature Badges */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center transition-transform hover:scale-105">
              <img
                src="/images/logo_icon.png"
                alt="AnySave Logo"
                className="h-full w-full object-contain drop-shadow-sm"
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.footer.bannerTitle}
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                {t.footer.bannerDesc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            <span className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/60 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {t.footer.badgePrivate}
            </span>
            <span className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/60 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {t.footer.badgeNoWatermark}
            </span>
            <span className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
              {t.footer.badgeFree}
            </span>
          </div>
        </div>

        {/* 4. Bottom Row: Exact Copyright, Policy Links, and Ke Atas Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80 dark:border-slate-800 pt-6 text-xs text-slate-500 dark:text-slate-400">
          <p className="text-center sm:text-left">
            &copy; 2026 AnySave. {t.footer.createdBy}{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Nanda Revan Saputro
            </span>
            . {t.footer.rights}
          </p>

          <div className="flex items-center gap-5 font-medium">
            <a
              href="https://changespdf.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t.footer.privacyPolicy}
            </a>
            <a
              href="https://changespdf.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t.footer.terms}
            </a>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95"
            >
              {t.footer.backToTop}
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
