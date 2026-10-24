import subprocess
"""
AnySaveVid Backend: FastAPI + yt-dlp Media Extraction API
Supports YouTube, Instagram, and TikTok media downloads tanpa watermark
"""

import os
import re
import sys
import shutil
import tempfile
import asyncio
import logging
from typing import Optional

# Ensure Windows proactor event loop policy if needed
if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except Exception:
        pass

import yt_dlp
from yt_dlp.extractor.instagram import InstagramIE

# ---------------------------------------------------------------------------
# Instagram Photo Post & Carousel Support Patch
# Enables yt-dlp to extract single photo posts and carousel slides without failing
# ---------------------------------------------------------------------------
_orig_extract_product_media = InstagramIE._extract_product_media


def _custom_extract_product_media(self, product_media):
    res = _orig_extract_product_media(self, product_media)
    if res and not res.get("formats"):
        thumb = None
        if res.get("thumbnails"):
            thumb = res["thumbnails"][-1].get("url")
        res["formats"] = [
            {
                "format_id": "image_0",
                "url": thumb or "https://instagram.com",
                "ext": "jpg",
                "vcodec": "mjpg",
                "acodec": "none",
            }
        ]
    return res


InstagramIE._extract_product_media = _custom_extract_product_media

_orig_extract_product = InstagramIE._extract_product


def _custom_extract_product(self, *args, **kwargs):
    res = _orig_extract_product(self, *args, **kwargs)
    if res and not res.get("formats") and res.get("_type") != "playlist":
        thumb = res.get("thumbnail")
        if not thumb and res.get("thumbnails"):
            thumb = res["thumbnails"][-1].get("url")
        res["formats"] = [
            {
                "format_id": "image_0",
                "url": thumb or "https://instagram.com",
                "ext": "jpg",
                "vcodec": "mjpg",
                "acodec": "none",
            }
        ]
    return res


InstagramIE._extract_product = _custom_extract_product

_orig_raise_no_formats = InstagramIE.raise_no_formats


def _custom_raise_no_formats(self, reason, expected=False, video_id=None):
    if "no video" in reason.lower():
        return
    _orig_raise_no_formats(self, reason, expected, video_id)


InstagramIE.raise_no_formats = _custom_raise_no_formats

_orig_ydl_raise_no_formats = yt_dlp.YoutubeDL.raise_no_formats


def _custom_ydl_raise_no_formats(self, info_dict):
    if info_dict and (info_dict.get("thumbnails") or info_dict.get("_type") == "playlist"):
        return
    _orig_ydl_raise_no_formats(self, info_dict)


yt_dlp.YoutubeDL.raise_no_formats = _custom_ydl_raise_no_formats


from starlette.background import BackgroundTask
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from pydantic import BaseModel, field_validator

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("anysavevid")

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AnySaveVid API",
    description="Media downloader lengkap tanpa watermark API",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS: allow Vercel frontend + local dev
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://anysavevid.vercel.app",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "Content-Disposition"],
)

# ---------------------------------------------------------------------------
# Constants & helpers
# ---------------------------------------------------------------------------
SUPPORTED_DOMAINS = {
    "youtube": [
        "youtube.com",
        "youtu.be",
        "www.youtube.com",
        "m.youtube.com",
        "youtube-nocookie.com",
    ],
    "instagram": [
        "instagram.com",
        "www.instagram.com",
    ],
    "tiktok": [
        "tiktok.com",
        "www.tiktok.com",
        "vm.tiktok.com",
        "vt.tiktok.com",
    ],
    "facebook": [
        "facebook.com",
        "www.facebook.com",
        "m.facebook.com",
        "fb.watch",
        "fb.com",
        "web.facebook.com",
    ],
}


def _get_ffmpeg_path() -> Optional[str]:
    """Resolve ffmpeg binary from imageio_ffmpeg or system PATH."""
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return shutil.which("ffmpeg")


def _detect_platform(url: str) -> Optional[str]:
    """Return 'youtube' | 'instagram' | 'tiktok' or None."""
    clean_url = url.lower()
    for platform, domains in SUPPORTED_DOMAINS.items():
        for domain in domains:
            if domain in clean_url:
                return platform
    return None


def _format_duration(seconds: Optional[float]) -> str:
    """Convert seconds to MM:SS or HH:MM:SS."""
    if seconds is None:
        return "N/A"
    seconds = int(seconds)
    if seconds < 3600:
        return f"{seconds // 60}:{seconds % 60:02d}"
    return f"{seconds // 3600}:{(seconds % 3600) // 60:02d}:{seconds % 60:02d}"


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------
class ExtractRequest(BaseModel):
    url: str
    platform: Optional[str] = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL harus diawali dengan http:// atau https://")
        platform = _detect_platform(v)
        if platform is None:
            raise ValueError(
                "Tautan tidak didukung. Hanya tautan Instagram, TikTok, dan YouTube yang didukung."
            )
        return v


class MediaFormat(BaseModel):
    format_type: str
    label: str
    ext: str
    quality: Optional[str] = None
    url: Optional[str] = None
    filesize: Optional[int] = None


class ExtractResponse(BaseModel):
    success: bool
    platform: str
    title: str
    author: Optional[str] = None
    thumbnail: Optional[str] = None
    duration: Optional[str] = None
    original_url: str
    formats: list[MediaFormat]


# ---------------------------------------------------------------------------
# yt-dlp extraction logic
# ---------------------------------------------------------------------------
def _clean_url(url: str) -> str:
    """Normalize URLs like YouTube shorts to standard watch links."""
    clean = url.strip()
    clean = re.sub(r"https?://(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]+)", r"https://www.youtube.com/watch?v=\1", clean)
    return clean


def _sync_extract(url: str) -> dict:
    """Synchronous extraction using yt-dlp Python module directly."""
    url = _clean_url(url)
    ffmpeg_exe = _get_ffmpeg_path()
    is_instagram = "instagram.com" in url.lower()
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": not is_instagram,
        "extract_flat": False,
        "format": "all",
        "ffmpeg_location": ffmpeg_exe,
        "extractor_args": {
            "youtube": {
                "player_client": ["tv", "web_embedded", "mweb", "android"],
                "player_skip": ["webpage"],
            }
        },
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        return ydl.extract_info(url, download=False)


async def _extract_info(url: str) -> dict:
    """Run extraction in worker thread to prevent event loop blocking."""
    try:
        return await asyncio.to_thread(_sync_extract, url)
    except yt_dlp.utils.DownloadError as e:
        err_msg = str(e)
        logger.error("yt-dlp error: %s", err_msg)
        if "private" in err_msg.lower() or "login" in err_msg.lower() or "sign in" in err_msg.lower():
            raise HTTPException(
                status_code=403,
                detail="Konten ini bersifat privat atau memerlukan autentikasi login akun.",
            )
        if "not found" in err_msg.lower() or "unavailable" in err_msg.lower() or "404" in err_msg:
            raise HTTPException(
                status_code=404,
                detail="Konten tidak ditemukan atau telah dihapus oleh pemiliknya.",
            )

        # Clean, friendly user notification without technical jargon
        clean_msg = re.sub(r"\x1b\[[0-9;]*m", "", err_msg)
        clean_msg = re.sub(r"\[[0-9;]*m", "", clean_msg).strip().lower()
        if "no video" in clean_msg:
            detail_msg = "Tidak ditemukan media video atau foto pada postingan ini."
        else:
            detail_msg = "Maaf, media ini sementara belum dapat diproses. Silakan pastikan tautan sudah benar dan publik atau coba sesaat lagi."

        raise HTTPException(
            status_code=422,
            detail=detail_msg,
        )
    except Exception as e:
        logger.exception("Unexpected error extracting media")
        raise HTTPException(
            status_code=500,
            detail="Maaf, server sedang sibuk memproses antrean. Silakan coba kembali dalam beberapa detik.",
        )


def _build_formats(info: dict, platform: str) -> list[MediaFormat]:
    """Build clean download format list from yt-dlp info dict."""
    formats: list[MediaFormat] = []
    raw_formats = info.get("formats", []) or []
    entries = info.get("entries")

    # Handle multi-slide carousel posts
    if entries:
        for idx, entry in enumerate(entries):
            slide_num = idx + 1
            e_formats = entry.get("formats", []) or []
            has_vid = any(
                f.get("vcodec") and f.get("vcodec") not in ("none", "mjpg")
                for f in e_formats
            )
            if has_vid:
                formats.append(
                    MediaFormat(
                        format_type="video",
                        label=f"Download Video Slide {slide_num} (MP4)",
                        ext="mp4",
                        quality="HD",
                        url=entry.get("webpage_url") or entry.get("url") or info.get("webpage_url"),
                    )
                )
            else:
                s_thumb = entry.get("thumbnail")
                if not s_thumb and entry.get("thumbnails"):
                    s_thumb = entry["thumbnails"][-1].get("url")
                if not s_thumb and e_formats:
                    s_thumb = e_formats[0].get("url")
                if s_thumb:
                    formats.append(
                        MediaFormat(
                            format_type="image",
                            label=f"Download Foto Slide {slide_num} (JPG)",
                            ext="jpg",
                            quality="Resolusi Tinggi",
                            url=s_thumb,
                        )
                    )
        if formats:
            return formats

    # Check whether this post contains actual video or is a photo
    has_real_video = any(
        f.get("vcodec") and f.get("vcodec") not in ("none", "mjpg")
        for f in raw_formats
    )

    if has_real_video:
        # 1. Video (MP4)
        best_video_quality = "HD 1080p"
        video_heights = [
            f.get("height")
            for f in raw_formats
            if f.get("height") and f.get("vcodec") and f.get("vcodec") not in ("none", "mjpg")
        ]
        if video_heights:
            best_video_quality = f"{max(video_heights)}p"
        elif info.get("height") and info.get("height") > 144:
            best_video_quality = f"{info.get('height')}p"

        formats.append(
            MediaFormat(
                format_type="video",
                label=f"Download Video ({best_video_quality})",
                ext="mp4",
                quality=best_video_quality,
                url=info.get("webpage_url") or info.get("original_url"),
                filesize=info.get("filesize") or info.get("filesize_approx"),
            )
        )

        # 2. Audio (MP3)
        formats.append(
            MediaFormat(
                format_type="audio",
                label="Download Audio (MP3)",
                ext="mp3",
                quality="192kbps",
                url=info.get("webpage_url") or info.get("original_url"),
            )
        )

    # 3. Image (JPG) for photo posts or cover thumbnail
    thumbnail = info.get("thumbnail")
    thumbnails = info.get("thumbnails", [])
    if thumbnails:
        valid_thumbs = [t for t in thumbnails if t.get("url")]
        if valid_thumbs:
            best_thumb = max(
                valid_thumbs,
                key=lambda t: (t.get("width", 0) or 0) * (t.get("height", 0) or 0),
            )
            thumbnail = best_thumb.get("url", thumbnail)

    if thumbnail:
        label = "Download Foto (JPG)" if not has_real_video else "Download Cover (JPG)"
        formats.append(
            MediaFormat(
                format_type="image",
                label=label,
                ext="jpg",
                quality="Resolusi Penuh",
                url=thumbnail,
            )
        )

    return formats


# ---------------------------------------------------------------------------
# Background yt-dlp Downloader Helpers
# ---------------------------------------------------------------------------
def _sync_download_video(url: str, output_template: str):
    """Download best video + audio and merge into a single standard MP4 file."""
    url = _clean_url(url)
    ffmpeg_exe = _get_ffmpeg_path()
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "ffmpeg_location": ffmpeg_exe,
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best",
        "outtmpl": output_template,
        "merge_output_format": "mp4",
        "extractor_args": {
            "youtube": {
                "player_client": ["tv", "web_embedded", "mweb", "android"],
                "player_skip": ["webpage"],
            }
        },
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])


def _sync_download_audio(url: str, output_template: str):
    """Download audio track and convert to clean high quality MP3."""
    url = _clean_url(url)
    ffmpeg_exe = _get_ffmpeg_path()
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "ffmpeg_location": ffmpeg_exe,
        "format": "bestaudio/best",
        "outtmpl": output_template,
        "extractor_args": {
            "youtube": {
                "player_client": ["tv", "web_embedded", "mweb", "android"],
                "player_skip": ["webpage"],
            }
        },
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])


# ---------------------------------------------------------------------------
# TikTok Extractor (Supports Videos tanpa watermark and Photo Carousels)
# ---------------------------------------------------------------------------
async def _extract_tiktok(url: str) -> ExtractResponse:
    """
    Dedicated extractor for TikTok supporting watermark free videos,
    audio sound tracks, and full photo slideshow carousels.
    Uses TikWM API with automatic fallback to yt dlp.
    """
    import urllib.parse
    import httpx

    clean_url = url.strip()

    # Resolve short sharing links if needed
    if "vm.tiktok.com" in clean_url or "vt.tiktok.com" in clean_url:
        try:
            async with httpx.AsyncClient(
                follow_redirects=True,
                timeout=10,
                headers={"User-Agent": "Mozilla/5.0"},
            ) as client:
                resp_head = await client.head(clean_url)
                clean_url = str(resp_head.url)
        except Exception:
            pass

    # 1. Primary method: TikWM API
    try:
        encoded = urllib.parse.quote(clean_url, safe="")
        api_url = f"https://www.tikwm.com/api/?url={encoded}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        async with httpx.AsyncClient(timeout=15, headers=headers) as client:
            resp = await client.get(api_url)
            if resp.status_code == 200:
                res_json = resp.json()
                if res_json.get("code") == 0 and res_json.get("data"):
                    d = res_json["data"]
                    author_data = d.get("author") or {}
                    author_name = (
                        author_data.get("nickname")
                        or author_data.get("unique_id")
                        or "Kreator TikTok"
                    )
                    title = d.get("title") or f"Konten TikTok oleh {author_name}"
                    cover_url = d.get("cover") or d.get("origin_cover")
                    duration_sec = d.get("duration")
                    duration_str = _format_duration(duration_sec) if duration_sec else None

                    formats: list[MediaFormat] = []

                    # Photo post slideshow support
                    images = d.get("images") or []
                    if images:
                        for idx, img_url in enumerate(images):
                            slide_num = idx + 1
                            formats.append(
                                MediaFormat(
                                    format_type="image",
                                    label=f"Download Foto Slide {slide_num} (JPG)",
                                    ext="jpg",
                                    quality="Resolusi Tinggi",
                                    url=img_url,
                                )
                            )
                        # Add audio sound if present
                        music_url = d.get("music")
                        if music_url:
                            formats.append(
                                MediaFormat(
                                    format_type="audio",
                                    label="Download Audio Sound (MP3)",
                                    ext="mp3",
                                    quality="192kbps",
                                    url=music_url,
                                )
                            )
                        if not cover_url and images:
                            cover_url = images[0]

                        return ExtractResponse(
                            success=True,
                            platform="tiktok",
                            title=title if title != f"Konten TikTok oleh {author_name}" else f"Postingan Foto TikTok oleh {author_name}",
                            author=author_name,
                            thumbnail=cover_url,
                            duration=duration_str,
                            original_url=clean_url,
                            formats=formats,
                        )

                    # Standard Video post support
                    play_url = d.get("play") or d.get("wmplay")
                    if play_url:
                        formats.append(
                            MediaFormat(
                                format_type="video",
                                label="Download Video HD Tanpa Watermark (MP4)",
                                ext="mp4",
                                quality="HD Tanpa Watermark",
                                url=play_url,
                                filesize=d.get("size"),
                            )
                        )

                    music_url = d.get("music")
                    if music_url:
                        formats.append(
                            MediaFormat(
                                format_type="audio",
                                label="Download Audio Sound (MP3)",
                                ext="mp3",
                                quality="192kbps",
                                url=music_url,
                            )
                        )

                    if cover_url:
                        formats.append(
                            MediaFormat(
                                format_type="image",
                                label="Download Cover (JPG)",
                                ext="jpg",
                                quality="Resolusi Penuh",
                                url=cover_url,
                            )
                        )

                    if formats:
                        return ExtractResponse(
                            success=True,
                            platform="tiktok",
                            title=title,
                            author=author_name,
                            thumbnail=cover_url,
                            duration=duration_str,
                            original_url=clean_url,
                            formats=formats,
                        )
    except Exception as e:
        logger.warning("TikWM extraction error: %s, mencoba fallback yt dlp", e)

    # 2. Fallback to yt dlp
    normalized_url = re.sub(r"/(?:photo|photo_slide)/(\d+)", r"/video/\1", clean_url)
    info = await _extract_info(normalized_url)
    formats = _build_formats(info, "tiktok")
    uploader = info.get("uploader") or info.get("channel") or info.get("creator")
    title = info.get("title", "Video TikTok")

    return ExtractResponse(
        success=True,
        platform="tiktok",
        title=title,
        author=uploader,
        thumbnail=info.get("thumbnail"),
        duration=_format_duration(info.get("duration")),
        original_url=clean_url,
        formats=formats,
    )



# ---------------------------------------------------------------------------
# Dedicated YouTube Pipeline with Multi-Client yt-dlp & Invidious Fallback
# ---------------------------------------------------------------------------
async def _extract_invidious(url: str) -> Optional[ExtractResponse]:
    """Fallback extractor using Invidious API to bypass datacenter IP blocks."""
    import urllib.request
    import json

    m = re.search(r"(?:v=|youtu\.be/|shorts/)([a-zA-Z0-9_-]{11})", url)
    if not m:
        return None
    video_id = m.group(1)

    instances = [
        "https://yt.chocolatemoo53.com",
    ]

    for inst in instances:
        try:
            api_url = f"{inst}/api/v1/videos/{video_id}"
            req = urllib.request.Request(api_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            def fetch_data():
                with urllib.request.urlopen(req, timeout=7) as res:
                    return json.loads(res.read().decode())
            data = await asyncio.to_thread(fetch_data)
            if not data or "title" not in data:
                continue

            formats: list[MediaFormat] = []

            # Check muxed formatStreams first
            for f in data.get("formatStreams", []):
                if f.get("url"):
                    r_lbl = f.get("resolution", "360p")
                    formats.append(
                        MediaFormat(
                            format_type="video",
                            label=f"Download Video ({r_lbl})",
                            ext="mp4",
                            quality=r_lbl,
                            url=f.get("url"),
                        )
                    )

            # Adaptive formats for 1080p, 720p, 480p, 360p, MP3
            adaptive = data.get("adaptiveFormats", []) or []
            audio_streams = [
                f for f in adaptive
                if "audio" in f.get("type", "") and f.get("url")
            ]
            best_audio = audio_streams[0] if audio_streams else None

            seen_res = set(f.quality for f in formats if f.quality)
            for res_name in ["1080p", "720p", "480p", "360p"]:
                if res_name not in seen_res:
                    matching_vid = [
                        f for f in adaptive
                        if f.get("resolution") == res_name and f.get("container") == "mp4" and f.get("url")
                    ]
                    if not matching_vid:
                        matching_vid = [
                            f for f in adaptive
                            if f.get("resolution") == res_name and f.get("url")
                        ]
                    if matching_vid:
                        v_url = matching_vid[0].get("url")
                        mux_url = f"mux:{v_url}|{best_audio['url']}" if best_audio else v_url
                        formats.append(
                            MediaFormat(
                                format_type="video",
                                label=f"Download Video ({res_name})",
                                ext="mp4",
                                quality=res_name,
                                url=mux_url,
                            )
                        )
                        seen_res.add(res_name)

            if best_audio:
                formats.append(
                    MediaFormat(
                        format_type="audio",
                        label="Download Audio (MP3)",
                        ext="mp3",
                        quality="192kbps",
                        url=f"audio:{best_audio['url']}",
                    )
                )

            thumb = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
            formats.append(
                MediaFormat(
                    format_type="image",
                    label="Download Cover (JPG)",
                    ext="jpg",
                    quality="Resolusi Penuh",
                    url=thumb,
                )
            )

            sec = data.get("lengthSeconds", 0)
            return ExtractResponse(
                success=True,
                platform="youtube",
                title=data.get("title", "YouTube Video"),
                author=data.get("author", "YouTube Creator"),
                thumbnail=thumb,
                duration=f"{sec // 60}:{sec % 60:02d}",
                original_url=url,
                formats=formats,
            )
        except Exception as e:
            logger.warning("Invidious instance %s error: %s", inst, e)
            continue

    return None


async def _extract_youtube(url: str) -> ExtractResponse:
    """Robust YouTube extraction trying yt-dlp first, then Invidious fallback."""
    # 1. Try yt-dlp
    try:
        info = await _extract_info(url)
        formats = _build_formats(info, "youtube")
        uploader = info.get("uploader") or info.get("channel") or info.get("creator")
        title = info.get("title", "YouTube Video")
        thumbnail = info.get("thumbnail")
        return ExtractResponse(
            success=True,
            platform="youtube",
            title=title,
            author=uploader,
            thumbnail=thumbnail,
            duration=_format_duration(info.get("duration")),
            original_url=url,
            formats=formats,
        )
    except Exception as ytdl_err:
        logger.warning("yt-dlp failed on YouTube, trying Invidious fallback: %s", ytdl_err)

    # 2. Invidious fallback
    invidious_res = await _extract_invidious(url)
    if invidious_res:
        return invidious_res

    raise HTTPException(
        status_code=422,
        detail="Maaf, media ini sementara belum dapat diproses. Silakan pastikan tautan sudah benar dan publik atau coba sesaat lagi.",
    )

# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    """Health check endpoint for Render."""
    import yt_dlp
    return {
        "status": "ok",
        "service": "AnySaveVid API",
        "version": "2026_download_fix",
        "ytdlp": getattr(getattr(yt_dlp, "version", None), "__version__", "unknown")
    }


@app.post("/api/extract", response_model=ExtractResponse)
async def extract_media(payload: ExtractRequest):
    """
    Extract metadata and download links from a supported URL.
    Supports videos, reels, shorts, as well as photo posts and carousels.
    """
    url = payload.url
    detected_platform = _detect_platform(url)

    if not detected_platform:
        raise HTTPException(
            status_code=400,
            detail="Tautan tidak didukung. Hanya Instagram, TikTok, YouTube, dan Facebook yang didukung.",
        )

    if payload.platform and payload.platform.lower() != detected_platform:
        platform_names = {
            "instagram": "Instagram",
            "tiktok": "TikTok",
            "youtube": "YouTube",
            "facebook": "Facebook",
        }
        tab_name = platform_names.get(payload.platform.lower(), payload.platform)
        detected_name = platform_names.get(detected_platform, detected_platform)
        raise HTTPException(
            status_code=400,
            detail=f"Tautan yang Anda masukkan adalah tautan {detected_name}, bukan {tab_name}. Silakan buka tab {detected_name} untuk mengunduh media ini.",
        )

    logger.info("Extracting: %s [%s]", url, detected_platform)

    # Dedicated TikTok pipeline
    if detected_platform == "tiktok":
        return await _extract_tiktok(url)

    # Dedicated YouTube pipeline
    if detected_platform == "youtube":
        return await _extract_youtube(url)

    # Instagram and YouTube pipeline via yt dlp
    info = await _extract_info(url)
    formats = _build_formats(info, detected_platform)

    uploader = info.get("uploader") or info.get("channel") or info.get("creator")
    title = info.get("title", "Untitled")

    raw_formats = info.get("formats", []) or []
    has_real_video = any(
        f.get("vcodec") and f.get("vcodec") not in ("none", "mjpg")
        for f in raw_formats
    )

    thumbnail = info.get("thumbnail")
    entries = info.get("entries") or []
    if not thumbnail and entries:
        first_entry = entries[0]
        thumbnail = first_entry.get("thumbnail")
        if not thumbnail and first_entry.get("thumbnails"):
            thumbnail = first_entry["thumbnails"][-1].get("url")
        if not thumbnail and first_entry.get("formats"):
            thumbnail = first_entry["formats"][0].get("url")

    if not has_real_video and ("video by" in title.lower() or "post by" in title.lower() or title == "Untitled"):
        title = f"Postingan Foto oleh {uploader}" if uploader else "Postingan Foto Instagram"

    return ExtractResponse(
        success=True,
        platform=detected_platform,
        title=title,
        author=uploader,
        thumbnail=thumbnail,
        duration=_format_duration(info.get("duration")),
        original_url=url,
        formats=formats,
    )


@app.get("/api/download")
async def download_media(
    url: str,
    format_type: str = "video",
    filename: str = "anysavevid_media",
    ext: str = "mp4",
):
    """
    Directly download media in the active tab.
    For direct CDN streams: streams video, audio, or image directly.
    For YouTube or complex streams: uses yt dlp and ffmpeg to mux standard MP4 or MP3.
    """
    if not url.startswith(("http://", "https://", "mux:", "audio:")):
        raise HTTPException(status_code=400, detail="URL tidak valid")

    clean_filename = re.sub(r'[^\w\s.]', '', filename).strip()
    if not clean_filename:
        clean_filename = f"anysavevid_media.{ext}"
    if not clean_filename.endswith(f".{ext}"):
        clean_filename = f"{clean_filename}.{ext}"

    # Handle Invidious adaptive video muxing
    if url.startswith("mux:"):
        parts = url[4:].split("|")
        v_stream = parts[0]
        a_stream = parts[1] if len(parts) > 1 else None

        temp_dir = tempfile.mkdtemp(prefix="anysavevid_")
        target_file = os.path.join(temp_dir, clean_filename)
        ffmpeg_exe = _get_ffmpeg_path() or "ffmpeg"

        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        cmd = [ffmpeg_exe, "-y", "-user_agent", ua, "-i", v_stream]
        if a_stream:
            cmd.extend(["-user_agent", ua, "-i", a_stream, "-c:v", "copy", "-c:a", "aac"])
        else:
            cmd.extend(["-c:v", "copy"])
        cmd.extend(["-movflags", "+faststart", target_file])

        def run_mux():
            p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if p.returncode != 0:
                raise RuntimeError(f"FFmpeg muxing failed: {p.stderr.decode()[:200]}")

        try:
            await asyncio.to_thread(run_mux)
            def cleanup_temp():
                shutil.rmtree(temp_dir, ignore_errors=True)

            return FileResponse(
                path=target_file,
                filename=clean_filename,
                media_type="video/mp4",
                background=BackgroundTask(cleanup_temp),
            )
        except Exception as e:
            shutil.rmtree(temp_dir, ignore_errors=True)
            logger.exception("Error during video muxing")
            raise HTTPException(status_code=500, detail="Gagal memproses video YouTube.")

    # Handle Invidious audio conversion to MP3
    if url.startswith("audio:"):
        a_stream = url[6:]
        temp_dir = tempfile.mkdtemp(prefix="anysavevid_")
        target_file = os.path.join(temp_dir, clean_filename)
        ffmpeg_exe = _get_ffmpeg_path() or "ffmpeg"

        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        cmd = [ffmpeg_exe, "-y", "-user_agent", ua, "-i", a_stream, "-vn", "-c:a", "libmp3lame", "-q:a", "2", target_file]

        def run_audio():
            p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if p.returncode != 0:
                raise RuntimeError(f"FFmpeg audio failed: {p.stderr.decode()[:200]}")

        try:
            await asyncio.to_thread(run_audio)
            def cleanup_temp():
                shutil.rmtree(temp_dir, ignore_errors=True)

            return FileResponse(
                path=target_file,
                filename=clean_filename,
                media_type="audio/mpeg",
                background=BackgroundTask(cleanup_temp),
            )
        except Exception as e:
            shutil.rmtree(temp_dir, ignore_errors=True)
            logger.exception("Error during audio conversion")
            raise HTTPException(status_code=500, detail="Gagal memproses audio YouTube.")

    # Determine if URL is a direct media CDN stream
    is_direct_stream = (
        "googlevideo.com" in url
        or 
        format_type == "image"
        or "tiktokcdn" in url
        or "byteoversea" in url
        or "ibyteimg" in url
        or "cdninstagram" in url
        or "fbcdn.net" in url
        or "mime_type=video" in url
        or "mime_type=audio" in url
    )

    if is_direct_stream:
        import httpx

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
        if "tiktok" in url or "byteoversea" in url:
            headers["Referer"] = "https://www.tiktok.com/"

        media_type = (
            "video/mp4"
            if format_type == "video"
            else "audio/mpeg"
            if format_type == "audio"
            else "image/jpeg"
        )

        async def stream_direct_media():
            async with httpx.AsyncClient(follow_redirects=True, timeout=60, headers=headers) as client:
                async with client.stream("GET", url) as response:
                    async for chunk in response.aiter_bytes(65536):
                        yield chunk

        return StreamingResponse(
            stream_direct_media(),
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{clean_filename}"',
                "Cache-Control": "no-cache",
            },
        )

    # For YouTube and non direct streams: use yt dlp + ffmpeg to generate complete valid media
    temp_dir = tempfile.mkdtemp(prefix="anysavevid_")
    out_tmpl = os.path.join(temp_dir, "media.%(ext)s")

    try:
        if format_type == "audio":
            await asyncio.to_thread(_sync_download_audio, url, out_tmpl)
            media_type = "audio/mpeg"
        else:
            await asyncio.to_thread(_sync_download_video, url, out_tmpl)
            media_type = "video/mp4"

        files = [
            f
            for f in os.listdir(temp_dir)
            if not f.endswith((".part", ".ytdl")) and os.path.isfile(os.path.join(temp_dir, f))
        ]
        if not files:
            raise HTTPException(status_code=500, detail="Gagal memproses berkas media.")

        target_file = os.path.join(temp_dir, files[0])

        def cleanup_temp():
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass

        return FileResponse(
            path=target_file,
            filename=clean_filename,
            media_type=media_type,
            background=BackgroundTask(cleanup_temp),
        )
    except HTTPException:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        logger.exception("Error during media download")
        raise HTTPException(status_code=500, detail=f"Gagal mengunduh media: {str(e)[:100]}")


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "detail": "Format permintaan tidak valid. Mohon periksa kembali tautan yang dimasukkan.",
        },
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "detail": "Terjadi kesalahan internal. Silakan coba lagi beberapa saat.",
        },
    )


# ---------------------------------------------------------------------------
# Dev entry-point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
