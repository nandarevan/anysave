import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Language = "id" | "en";

export interface Translations {
  navbar: {
    themeDark: string;
    themeLight: string;
    switchLang: string;
    currentLang: string;
  };
  hero: {
    title: string;
    subtitle: string;
  };
  platforms: {
    selectLabel: string;
    activeModeLabel: string;
    instagram: {
      name: string;
      badge: string;
      tagline: string;
      placeholder: string;
      supported: string[];
    };
    tiktok: {
      name: string;
      badge: string;
      tagline: string;
      placeholder: string;
      supported: string[];
    };
    youtube: {
      name: string;
      badge: string;
      tagline: string;
      placeholder: string;
      supported: string[];
    };
  };
  input: {
    paste: string;
    clear: string;
    downloadBtn: string;
    loadingBtn: string;
    mismatchText: string;
    mismatchBtn: string;
    mismatchAlert: (active: string, detected: string) => string;
  };
  result: {
    source: string;
    preparing: string;
  };
  modal: {
    title: string;
    connecting: string;
    serverProcessing: string;
    receiving: string;
    downloadingPercent: (p: number) => string;
    complete: string;
    note: string;
    cancel: string;
    error: string;
  };
  footer: {
    features: {
      card1Title: string;
      card1Desc: string;
      card2Title: string;
      card2Desc: string;
      card3Title: string;
      card3Desc: string;
    };
    col1Title: string;
    col2Title: string;
    col3Title: string;
    col4Title: string;
    col1Links: string[];
    col2Links: string[];
    col3Links: string[];
    col4Links: string[];
    disclaimer: string;
    copyright: string;
    bannerTitle: string;
    bannerDesc: string;
    badgePrivate: string;
    badgeNoWatermark: string;
    badgeFree: string;
    createdBy: string;
    rights: string;
    privacyPolicy: string;
    terms: string;
    backToTop: string;
  };
}

export const translations: Record<Language, Translations> = {
  id: {
    navbar: {
      themeDark: "Ubah ke Mode Gelap",
      themeLight: "Ubah ke Mode Terang",
      switchLang: "Pilih Bahasa",
      currentLang: "ID",
    },
    hero: {
      title: "Media Downloader",
      subtitle:
        "Download video, audio, dan gambar tanpa watermark secara instan dari Instagram, TikTok, dan YouTube.",
    },
    platforms: {
      selectLabel: "PILIH PLATFORM MEDIA:",
      activeModeLabel: "Mode Aktif:",
      instagram: {
        name: "Instagram",
        badge: "Reels & Post",
        tagline: "Download Reels, Carousel Post, Foto & Audio Instagram",
        placeholder: "Tempel tautan Instagram (Reels, Post, atau Carousel)...",
        supported: ["Reels Video", "Post Foto & Carousel", "Story", "Audio MP3"],
      },
      tiktok: {
        name: "TikTok",
        badge: "Video & Post",
        tagline: "Download Video TikTok HD Tanpa Watermark & MP3",
        placeholder: "Tempel tautan TikTok (Video atau Foto slide)...",
        supported: ["Video HD Tanpa Watermark", "TikTok Foto Slide", "Audio Sound MP3"],
      },
      youtube: {
        name: "YouTube",
        badge: "Video & MP3",
        tagline: "Download Video YouTube HD, Shorts & Audio MP3",
        placeholder: "Tempel tautan YouTube (Video atau Shorts)...",
        supported: ["Video MP4 HD (1080p)", "YouTube Shorts", "Audio MP3"],
      },
    },
    input: {
      paste: "Paste",
      clear: "Hapus tautan",
      downloadBtn: "Download Media",
      loadingBtn: "Sedang Memproses Media...",
      mismatchText: "Tautan terdeteksi milik",
      mismatchBtn: "Pindah ke",
      mismatchAlert: (active, detected) =>
        `Anda sedang berada di menu ${active}, namun tautan yang dimasukkan adalah tautan ${detected}. Silakan klik tombol 'Pindah ke ${detected}'.`,
    },
    result: {
      source: "Source",
      preparing: "Menyiapkan...",
    },
    modal: {
      title: "Sedang Memproses Unduhan Media",
      connecting: "AnySaveVid sedang menghubungkan...",
      serverProcessing: "AnySaveVid sedang menyiapkan media...",
      receiving: "AnySaveVid sedang mengunduh berkas...",
      downloadingPercent: (p) => `Mengunduh berkas (${p}%)...`,
      complete: "Selesai! Menyimpan berkas ke perangkat...",
      note: "AnySaveVid sedang menyiapkan media Anda. Jendela ini tertutup otomatis saat selesai.",
      cancel: "Batalkan Unduhan",
      error: "Gagal mengunduh media. Silakan coba lagi.",
    },
    footer: {
      features: {
        card1Title: "100% Bebas Watermark",
        card1Desc:
          "Unduh video, audio, dan foto dalam kualitas aslinya tanpa watermark atau logo apa pun.",
        card2Title: "Cepat & Efisien",
        card2Desc:
          "Pemrosesan ekstraksi media berkecepatan tinggi dengan server teroptimasi secara instan.",
        card3Title: "Bebas Biaya",
        card3Desc:
          "Akses ke seluruh fitur pengunduhan video Instagram, TikTok, dan YouTube tanpa batas.",
      },
      col1Title: "INSTAGRAM DOWNLOADER",
      col2Title: "TIKTOK DOWNLOADER",
      col3Title: "YOUTUBE DOWNLOADER",
      col4Title: "FORMAT & KEUNGGULAN",
      col1Links: [
        "Download Reels Instagram",
        "Download Video Post IG",
        "Download Foto & Carousel",
        "Download Audio Instagram",
        "Instagram Story Saver",
      ],
      col2Links: [
        "TikTok Video Tanpa Watermark",
        "Download TikTok HD",
        "Download Audio TikTok MP3",
        "TikTok Foto Slideshow",
        "Download Sound Musik TikTok",
      ],
      col3Links: [
        "YouTube Video MP4 (1080p)",
        "YouTube Shorts Downloader",
        "YouTube ke Audio MP3",
        "Download Thumbnail YouTube",
        "Ekstraksi Audio Berkualitas",
      ],
      col4Links: [
        "Video MP4 High Definition",
        "Audio MP3 Jernih Kualitas Tinggi",
        "Foto JPG Resolusi Asli",
        "100% Tanpa Registrasi Akun",
        "Akses Cepat di Semua Browser",
      ],
      disclaimer:
        "AnySaveVid tidak menyimpan berkas apa pun di server kami. Seluruh konten media diunduh langsung dari server CDN resmi masing masing platform.",
      copyright: "AnySaveVid. Seluruh Hak Cipta Dilindungi.",
      bannerTitle: "AnySaveVid: Platform Pengunduh Media Multi Platform Lengkap",
      bannerDesc:
        "Toolkit online gratis untuk mengunduh video, audio, reels, shorts, dan gambar dari Instagram, TikTok, dan YouTube langsung berkualitas tinggi tanpa watermark.",
      badgePrivate: "100% Privat",
      badgeNoWatermark: "Tanpa Watermark",
      badgeFree: "Bebas Biaya",
      createdBy: "Dibuat oleh",
      rights: "Hak cipta dilindungi.",
      privacyPolicy: "Kebijakan Privasi",
      terms: "Syarat & Ketentuan",
      backToTop: "Ke Atas",
    },
  },
  en: {
    navbar: {
      themeDark: "Switch to Dark Mode",
      themeLight: "Switch to Light Mode",
      switchLang: "Select Language",
      currentLang: "EN",
    },
    hero: {
      title: "Media Downloader",
      subtitle:
        "Download watermark free videos, audio, and images instantly from Instagram, TikTok, and YouTube.",
    },
    platforms: {
      selectLabel: "SELECT MEDIA PLATFORM:",
      activeModeLabel: "Active Mode:",
      instagram: {
        name: "Instagram",
        badge: "Reels & Post",
        tagline: "Download Instagram Reels, Carousel Posts, Photos & Audio",
        placeholder: "Paste Instagram link (Reels, Post, or Carousel)...",
        supported: ["Reels Video", "Photo Post & Carousel", "Story", "MP3 Audio"],
      },
      tiktok: {
        name: "TikTok",
        badge: "Video & Post",
        tagline: "Download HD TikTok Videos Without Watermark & MP3",
        placeholder: "Paste TikTok link (Video or Photo slide)...",
        supported: ["HD Watermark Free Video", "TikTok Photo Slide", "Sound MP3 Audio"],
      },
      youtube: {
        name: "YouTube",
        badge: "Video & MP3",
        tagline: "Download HD YouTube Videos, Shorts & MP3 Audio",
        placeholder: "Paste YouTube link (Video or Shorts)...",
        supported: ["HD MP4 Video (1080p)", "YouTube Shorts", "MP3 Audio"],
      },
    },
    input: {
      paste: "Paste",
      clear: "Clear link",
      downloadBtn: "Download Media",
      loadingBtn: "Processing Media...",
      mismatchText: "Link detected belongs to",
      mismatchBtn: "Switch to",
      mismatchAlert: (active, detected) =>
        `You are currently on the ${active} tab, but the pasted link belongs to ${detected}. Please click 'Switch to ${detected}'.`,
    },
    result: {
      source: "Source",
      preparing: "Preparing...",
    },
    modal: {
      title: "Processing Media Download",
      connecting: "AnySaveVid is connecting...",
      serverProcessing: "AnySaveVid is preparing media...",
      receiving: "AnySaveVid is downloading file...",
      downloadingPercent: (p) => `Downloading file (${p}%)...`,
      complete: "Done! Saving file to your device...",
      note: "AnySaveVid is preparing your media. This window closes automatically when done.",
      cancel: "Cancel Download",
      error: "Failed to download media. Please try again.",
    },
    footer: {
      features: {
        card1Title: "100% Watermark Free",
        card1Desc:
          "Download original quality videos, audio tracks, and photos without any watermarks or logos.",
        card2Title: "Fast & Efficient",
        card2Desc:
          "High speed media extraction engine powered by optimized high throughput servers.",
        card3Title: "Completely Free",
        card3Desc:
          "Unlimited access to all video and audio download features for Instagram, TikTok, and YouTube.",
      },
      col1Title: "INSTAGRAM DOWNLOADER",
      col2Title: "TIKTOK DOWNLOADER",
      col3Title: "YOUTUBE DOWNLOADER",
      col4Title: "FORMATS & ADVANTAGES",
      col1Links: [
        "Download Instagram Reels",
        "Download IG Video Posts",
        "Download Photos & Carousels",
        "Download Instagram Audio",
        "Instagram Story Saver",
      ],
      col2Links: [
        "Watermark Free TikTok Videos",
        "Download TikTok in HD",
        "Download TikTok MP3 Audio",
        "TikTok Photo Slideshow",
        "Download TikTok Sound Tracks",
      ],
      col3Links: [
        "YouTube MP4 Video (1080p)",
        "YouTube Shorts Downloader",
        "YouTube to MP3 Audio",
        "Download YouTube Thumbnail",
        "High Quality Audio Extraction",
      ],
      col4Links: [
        "High Definition MP4 Video",
        "Crystal Clear High Bitrate MP3",
        "Original Resolution JPG Photos",
        "100% No Account Required",
        "Fast Access on All Browsers",
      ],
      disclaimer:
        "AnySaveVid does not host or store any files on our servers. All media content is streamed directly from official platform CDN servers.",
      copyright: "AnySaveVid. All Rights Reserved.",
      bannerTitle: "AnySaveVid: All in One Multi Platform Media Downloader",
      bannerDesc:
        "Free online toolkit to download high quality watermark free videos, audio, reels, shorts, and photos from Instagram, TikTok, and YouTube.",
      badgePrivate: "100% Private",
      badgeNoWatermark: "No Watermark",
      badgeFree: "Completely Free",
      createdBy: "Created by",
      rights: "All rights reserved.",
      privacyPolicy: "Privacy Policy",
      terms: "Terms & Conditions",
      backToTop: "Back to Top",
    },
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === "undefined") return "id";
    const saved = (localStorage.getItem("anysavevid-lang") || localStorage.getItem("anysave-lang")) as Language | null;
    if (saved === "id" || saved === "en") return saved;

    // Automatic detection: if user browser language is outside Indonesia, default to English
    const browserLang = (navigator.language || "").toLowerCase();
    if (browserLang.startsWith("id")) {
      return "id";
    }
    return "en";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("anysavevid-lang", newLang);
    document.documentElement.lang = newLang;
  };

  const toggleLang = () => {
    setLang(lang === "id" ? "en" : "id");
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = {
    lang,
    setLang,
    toggleLang,
    t: translations[lang],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
