import { useState, useCallback } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import DownloaderInput from "./components/DownloaderInput";
import ResultCard from "./components/ResultCard";
import type { ExtractResult } from "./components/ResultCard";
import type { PlatformType } from "./components/PlatformTabs";
import Footer from "./components/Footer";
import { useLanguage } from "./context/LanguageContext";
import { Analytics } from "@vercel/analytics/react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "");

export default function App() {
  const { lang } = useLanguage();
  const [activePlatform, setActivePlatform] = useState<PlatformType>("instagram");
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = useCallback(
    async (url: string, platform: PlatformType) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch(`${API_BASE}/api/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, platform }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.detail ??
              (lang === "id"
                ? "Gagal mengambil media. Pastikan tautan benar dan dapat diakses publik."
                : "Failed to fetch media. Please make sure the link is valid and publicly accessible."),
          );
        }

        setResult(data as ExtractResult);
      } catch (err) {
        if (err instanceof TypeError && err.message.includes("fetch")) {
          setError(
            lang === "id"
              ? "Maaf, server sedang bersiap atau sedang memproses antrean. Silakan coba kembali dalam beberapa detik."
              : "Sorry, the server is warming up or busy. Please try again in a few seconds.",
          );
        } else if (err instanceof Error) {
          let msg = err.message;
          // Filter out technical jargon, github urls, yt-dlp errors, ports
          if (
            msg.includes("github") ||
            msg.includes("yt-") ||
            msg.includes("port") ||
            msg.includes("player response") ||
            msg.includes("Failed to") ||
            msg.includes("Traceback") ||
            msg.includes("Internal Server Error")
          ) {
            msg =
              lang === "id"
                ? "Maaf, media ini sementara belum dapat diproses. Silakan pastikan tautan dapat dibuka publik atau coba sesaat lagi."
                : "Sorry, this media cannot be processed right now. Please make sure the link is public or try again shortly.";
          }
          setError(msg);
        } else {
          setError(
            lang === "id"
              ? "Maaf, terjadi kendala saat memproses media. Silakan coba lagi nanti."
              : "Sorry, an issue occurred while processing media. Please try again later.",
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [lang],
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar
        activePlatform={activePlatform}
        onSelectPlatform={(p) => {
          setActivePlatform(p);
          setError(null);
          setResult(null);
        }}
      />

      <main className="flex-1">
        <HeroSection />
        <DownloaderInput
          activePlatform={activePlatform}
          onSelectPlatform={(p) => {
            setActivePlatform(p);
            setError(null);
            setResult(null);
          }}
          onExtract={handleExtract}
          loading={loading}
          error={error}
          onClearError={() => setError(null)}
        />
        {result && <ResultCard result={result} apiBase={API_BASE} />}
      </main>

      <Footer />
      <Analytics />
    </div>
  );
}
