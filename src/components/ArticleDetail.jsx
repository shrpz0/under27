import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase-client";
import { IoArrowBack } from "react-icons/io5";

let juxtaposeAssetsPromise = null;

function fmtUA(ts) {
  try {
    return new Date(ts).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function loadJuxtaposeAssets() {
  if (typeof window !== "undefined" && window.juxtapose?.JXSlider) {
    return Promise.resolve();
  }

  if (juxtaposeAssetsPromise) return juxtaposeAssetsPromise;

  juxtaposeAssetsPromise = new Promise((resolve, reject) => {
    const cssId = "juxtapose-css";
    const jsId = "juxtapose-js";

    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href =
        "https://cdn.knightlab.com/libs/juxtapose/latest/css/juxtapose.css";
      document.head.appendChild(link);
    }

    const finish = () => {
      if (window.juxtapose?.JXSlider) {
        resolve();
      } else {
        reject(new Error("JuxtaposeJS не ініціалізувався"));
      }
    };

    const existingScript = document.getElementById(jsId);
    if (existingScript) {
      if (window.juxtapose?.JXSlider) {
        finish();
        return;
      }

      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Не вдалося завантажити JuxtaposeJS")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = jsId;
    script.src =
      "https://cdn.knightlab.com/libs/juxtapose/latest/js/juxtapose.min.js";
    script.async = true;
    script.onload = finish;
    script.onerror = () =>
      reject(new Error("Не вдалося завантажити JuxtaposeJS"));

    document.body.appendChild(script);
  });

  return juxtaposeAssetsPromise;
}

function isAllowedJuxtaposeUrl(url) {
  try {
    const u = new URL(url);

    return (
      (u.hostname === "cdn.knightlab.com" &&
        u.pathname.includes("/libs/juxtapose/")) ||
      u.hostname === "juxtapose.knightlab.com" ||
      (u.hostname === "s3.amazonaws.com" &&
        u.pathname.startsWith("/uploads.knightlab.com/juxtapose/")) ||
      (u.hostname === "uploads.knightlab.com" &&
        u.pathname.startsWith("/juxtapose/"))
    );
  } catch {
    return false;
  }
}

function getJuxtaposeJsonUrl(embedUrl) {
  try {
    const cleaned = String(embedUrl || "").trim();
    const u = new URL(cleaned);

    if (
      (u.hostname === "s3.amazonaws.com" &&
        u.pathname.startsWith("/uploads.knightlab.com/juxtapose/") &&
        u.pathname.endsWith(".json")) ||
      (u.hostname === "uploads.knightlab.com" &&
        u.pathname.startsWith("/juxtapose/") &&
        u.pathname.endsWith(".json"))
    ) {
      return u.toString();
    }

    const uid = u.searchParams.get("uid");
    if (!uid) return null;

    const decoded = decodeURIComponent(uid).trim();
    if (!decoded) return null;

    if (/^https?:\/\//i.test(decoded)) {
      return decoded;
    }

    const cleanUid = decoded.replace(/\/+$/, "");
    return `https://s3.amazonaws.com/uploads.knightlab.com/juxtapose/${cleanUid}.json`;
  } catch {
    return null;
  }
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function normalizeJuxtaposeConfig(json) {
  if (!json || !Array.isArray(json.images) || json.images.length < 2) {
    return null;
  }

  const images = json.images.slice(0, 2).map((img) => ({
    src: img?.src || "",
    label: stripHtml(img?.label),
    credit: stripHtml(img?.credit),
  }));

  if (!images[0]?.src || !images[1]?.src) {
    return null;
  }

  return {
    images,
    options: {
      animate: json?.options?.animate ?? true,
      showLabels: json?.options?.showLabels ?? true,
      showCredits: json?.options?.showCredits ?? true,
      startingPosition: json?.options?.startingPosition ?? "50%",
      mode: json?.options?.mode === "vertical" ? "vertical" : "horizontal",
      makeResponsive: true,
    },
  };
}

function getCloudinaryVideoKind(url) {
  try {
    const u = new URL(url);

    if (
      u.hostname === "res.cloudinary.com" &&
      u.pathname.includes("/video/upload/")
    ) {
      return "file";
    }

    if (
      u.hostname === "player.cloudinary.com" &&
      u.pathname.startsWith("/embed/")
    ) {
      return "player";
    }

    return null;
  } catch {
    return null;
  }
}

function isAllowedCloudinaryVideoUrl(url) {
  return getCloudinaryVideoKind(url) !== null;
}

function parseRatioValue(value) {
  if (!value) return null;

  const cleaned = String(value).trim();
  const match = cleaned.match(/^(\d+)\s*\/\s*(\d+)$/);

  if (!match) return null;

  const w = Number(match[1]);
  const h = Number(match[2]);

  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return null;
  }

  return `${w} / ${h}`;
}

function isVerticalRatio(ratio) {
  const match = String(ratio || "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);

  if (!match) return false;

  const w = Number(match[1]);
  const h = Number(match[2]);

  if (!Number.isFinite(w) || !Number.isFinite(h) || h === 0) return false;

  return w < h;
}

function renderBodyWithEmbeds(body) {
  const raw = String(body || "");

  const regex =
    /\[(juxtapose|cloudinary-video):(https?:\/\/[^\]|]+)(?:\|ratio:([0-9]+\s*\/\s*[0-9]+))?\]/gi;

  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(raw)) !== null) {
    const type = String(match[1] || "").toLowerCase();
    const url = match[2];
    const ratio = parseRatioValue(match[3]);

    let allowed = false;

    if (type === "juxtapose") {
      allowed = isAllowedJuxtaposeUrl(url);
    }

    if (type === "cloudinary-video") {
      allowed = isAllowedCloudinaryVideoUrl(url);
    }

    if (!allowed) continue;

    const before = raw.slice(lastIndex, match.index);

    if (before.trim()) {
      parts.push({
        type: "text",
        content: before,
        key: `text-${key++}`,
      });
    }

    parts.push({
      type,
      url,
      ratio,
      key: `embed-${key++}`,
    });

    lastIndex = match.index + match[0].length;
  }

  const tail = raw.slice(lastIndex);

  if (tail.trim()) {
    parts.push({
      type: "text",
      content: tail,
      key: `text-${key++}`,
    });
  }

  if (parts.length === 0) {
    return [
      {
        type: "text",
        content: raw,
        key: "text-only",
      },
    ];
  }

  return parts;
}

function JuxtaposeInline({ url }) {
  const hostRef = useRef(null);
  const sliderIdRef = useRef(
    `juxtapose-${Math.random().toString(36).slice(2)}`
  );

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setErr("");

      try {
        const jsonUrl = getJuxtaposeJsonUrl(url);
        if (!jsonUrl) {
          throw new Error("Невалідне посилання Juxtapose");
        }

        const [, res] = await Promise.all([
          loadJuxtaposeAssets(),
          fetch(jsonUrl, {
            method: "GET",
            mode: "cors",
            credentials: "omit",
          }),
        ]);

        if (!res.ok) {
          throw new Error("Не вдалося завантажити Juxtapose");
        }

        const rawConfig = await res.json();
        const config = normalizeJuxtaposeConfig(rawConfig);

        if (!config) {
          throw new Error("Порожня конфігурація Juxtapose");
        }

        if (cancelled || !hostRef.current || !window.juxtapose?.JXSlider) {
          return;
        }

        hostRef.current.innerHTML = "";

        const mount = document.createElement("div");
        mount.id = sliderIdRef.current;
        mount.style.width = "100%";
        hostRef.current.appendChild(mount);

        new window.juxtapose.JXSlider(
          `#${sliderIdRef.current}`,
          config.images,
          config.options
        );

        if (!cancelled) {
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErr(e.message || "Не вдалося завантажити інтерактив");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (hostRef.current) {
        hostRef.current.innerHTML = "";
      }
    };
  }, [url]);

  return (
    <section className="my-6 md:my-8">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="text-sm uppercase tracking-[0.14em] font-bold text-neutral-500">
          Інтерактив
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-black underline underline-offset-4 decoration-black/30 hover:decoration-black transition"
        >
          Відкрити окремо
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-3 sm:p-4">
        {err ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : (
          <>
            {loading && (
              <div className="mb-3 text-sm text-neutral-500">
                Завантаження інтерактиву…
              </div>
            )}

            <div
              ref={hostRef}
              className="article-juxtapose w-full overflow-hidden"
              style={{ minHeight: loading ? 260 : undefined }}
            />
          </>
        )}
      </div>
    </section>
  );
}

function CloudinaryVideoInline({ url, forcedRatio = null }) {
  const kind = getCloudinaryVideoKind(url);
  const initialRatio = parseRatioValue(forcedRatio) || "16 / 9";
  const [ratio, setRatio] = useState(initialRatio);

  useEffect(() => {
    const parsedForcedRatio = parseRatioValue(forcedRatio);

    if (parsedForcedRatio) {
      setRatio(parsedForcedRatio);
      return;
    }

    setRatio("16 / 9");

    if (kind !== "file") return;

    let cancelled = false;
    const video = document.createElement("video");

    const handleLoadedMetadata = () => {
      if (cancelled) return;

      const w = video.videoWidth;
      const h = video.videoHeight;

      if (w && h) {
        setRatio(`${w} / ${h}`);
      }
    };

    const handleError = () => {
      if (!cancelled) {
        setRatio("16 / 9");
      }
    };

    video.preload = "metadata";
    video.src = url;
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("error", handleError);

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleError);
      video.src = "";
    };
  }, [url, kind, forcedRatio]);

  if (!kind) {
    return (
      <section className="my-6 md:my-8">
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Невалідне посилання Cloudinary
        </div>
      </section>
    );
  }

  const vertical = isVerticalRatio(ratio);

  return (
    <section className="my-6 md:my-8">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="text-sm uppercase tracking-[0.14em] font-bold text-neutral-500">
          Відео
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-black underline underline-offset-4 decoration-black/30 hover:decoration-black transition"
        >
          Відкрити окремо
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        <div
          className={`relative mx-auto w-full ${
            vertical ? "max-w-[420px]" : "max-w-full"
          }`}
          style={{ aspectRatio: ratio }}
        >
          {kind === "file" ? (
            <video
              src={url}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full bg-black object-contain"
            >
              Your browser does not support HTML5 video.
            </video>
          ) : (
            <iframe
              src={url}
              title="Cloudinary video player"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0 bg-black"
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default function ArticleDetail({ articleId, onBack }) {
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!articleId) return;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const { data, error } = await supabase
          .from("article")
          .select(`
            id,
            created_at,
            title,
            subtitle,
            body,
            cover_url,
            time_to_read,
            category:category_id ( id, name )
          `)
          .eq("id", articleId)
          .single();

        if (error) throw error;
        setArticle(data);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Не вдалося завантажити статтю");
        setArticle(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId]);

  const bodyParts = useMemo(() => {
    return renderBodyWithEmbeds(article?.body || "");
  }, [article?.body]);

  return (
    <div className="min-h-screen w-full bg-white flex justify-center mr-20">
      <style>{`
        .article-juxtapose,
        .article-juxtapose .juxtapose,
        .article-juxtapose .jx-slider {
          width: 100% !important;
          max-width: none !important;
        }

        .article-juxtapose .juxtapose,
        .article-juxtapose .jx-slider {
          margin: 0 !important;
        }

        .article-juxtapose img {
          max-width: none !important;
        }
      `}</style>

      <div className="w-full max-w-3xl px-6 md:px-12 lg:px-20 pt-8 pb-16">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-black font-semibold tracking-[0.06em] uppercase mb-8"
        >
          <IoArrowBack size={22} />
          Назад
        </button>

        {loading && (
          <div className="mt-10 text-neutral-500 text-center">Завантаження…</div>
        )}

        {!loading && err && (
          <div className="mt-10 text-red-600 text-center">{err}</div>
        )}

        {!loading && !err && article && (
          <article className="mt-4">
            <h1 className="text-5xl md:text-6xl leading-[1.05] font-bold tracking-tight">
              {article.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-base text-neutral-600">
              <div className="flex flex-row justify-between w-full">
                {typeof article.time_to_read === "number" && (
                  <span>{article.time_to_read} хв читання</span>
                )}
                <span>{fmtUA(article.created_at)}</span>
              </div>
            </div>

            {article.subtitle && (
              <p className="mt-6 text-xl md:text-2xl text-neutral-700 leading-relaxed max-w-3xl">
                {article.subtitle}
              </p>
            )}

            {article.cover_url && (
              <div className="mt-10 w-full aspect-[16/9] md:aspect-[2/1] overflow-hidden rounded-xl bg-neutral-100 shadow-2xl">
                <img
                  src={article.cover_url}
                  alt={article.title || "Обкладинка статті"}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="mt-12 text-neutral-900">
              {bodyParts.map((part) => {
                if (part.type === "text") {
                  return (
                    <div key={part.key} className="max-w-none my-0">
                      <div className="whitespace-pre-wrap leading-[1.9] text-[1.06rem] md:text-[1.12rem] text-neutral-900">
                        {part.content}
                      </div>
                    </div>
                  );
                }

                if (part.type === "juxtapose") {
                  return <JuxtaposeInline key={part.key} url={part.url} />;
                }

                if (part.type === "cloudinary-video") {
                  return (
                    <CloudinaryVideoInline
                      key={part.key}
                      url={part.url}
                      forcedRatio={part.ratio}
                    />
                  );
                }

                return null;
              })}
            </div>

            <div className="mt-10">
              <a
                href="https://uploads.knightlab.com/storymapjs/0ce1efa9326f54997e3c223833a68f08/de-mi-doroslishaiemo-mapa-strakhiv-i-rishen-under-27/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-lg font-bold text-black hover:text-neutral-700 transition-colors underline underline-offset-4 decoration-2 decoration-black/30 hover:decoration-black"
              >
                Відкрити інтерактивну мапу «Де ми дорослішаємо: мапа страхів і рішень»
                <span aria-hidden="true">→</span>
              </a>
            </div>

            {article.category?.name && (
              <div className="text-sm w-fit mt-4 uppercase font-bold text-white bg-black px-4 py-1.5">
                {article.category.name}
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}