import { useState, useCallback } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import DownloaderInput from "./components/DownloaderInput";
import ResultCard from "./components/ResultCard";
import type { ExtractResult } from "./components/ResultCard";
import type { PlatformType } from "./components/PlatformTabs";
import Footer from "./components/Footer";
import { useLanguage } from "./context/LanguageContext";

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
              ? "Gagal menghubungi server backend. Pastikan backend sudah berjalan di port 8000."
              : "Failed to reach backend server. Please make sure backend is running on port 8000.",
          );
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(lang === "id" ? "Terjadi kesalahan yang tidak terduga." : "An unexpected error occurred.");
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
    </div>
  );
}
