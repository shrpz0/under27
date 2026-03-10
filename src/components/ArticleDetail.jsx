import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase-client";
import { IoArrowBack } from "react-icons/io5";

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

function isAllowedJuxtaposeUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.hostname === "juxtapose.knightlab.com" ||
      u.hostname === "cdn.knightlab.com"
    );
  } catch {
    return false;
  }
}

function renderBodyWithEmbeds(body) {
  const raw = String(body || "");

  // Matches a full line like:
  // [juxtapose:https://juxtapose.knightlab.com/....]
  const regex = /^\[juxtapose:(https?:\/\/[^\s\]]+)\]$/gm;

  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(raw)) !== null) {
    const fullMatch = match[0];
    const url = match[1];
    const start = match.index;
    const end = start + fullMatch.length;

    const textBefore = raw.slice(lastIndex, start);
    if (textBefore.trim()) {
      parts.push({
        type: "text",
        content: textBefore,
        key: `text-${key++}`,
      });
    }

    parts.push({
      type: "juxtapose",
      url,
      key: `jx-${key++}`,
    });

    lastIndex = end;
  }

  const tail = raw.slice(lastIndex);
  if (tail.trim()) {
    parts.push({
      type: "text",
      content: tail,
      key: `text-${key++}`,
    });
  }

  // if no markers found, render as normal text
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
                    <div
                      key={part.key}
                      className="max-w-none my-0"
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {part.content}
                      </div>
                    </div>
                  );
                }

                if (part.type === "juxtapose") {
                  if (!isAllowedJuxtaposeUrl(part.url)) {
                    return (
                      <div
                        key={part.key}
                        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700"
                      >
                        Невалідне посилання Juxtapose.
                      </div>
                    );
                  }

                  return (
                    <section key={part.key}>
                      <div className="mb-1 flex items-center justify-between gap-1">
                        <div className="text-sm uppercase tracking-[0.14em] font-bold text-neutral-500">
                          Інтерактив
                        </div>

                        <a
                          href={part.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-black underline underline-offset-4 decoration-black/30 hover:decoration-black transition"
                        >
                          Відкрити окремо
                        </a>
                      </div>

                      <div className="overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-200 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                        <iframe
                          src={part.url}
                          title="Juxtapose interactive"
                          className="block w-full h-[420px] md:h-[520px] lg:h-[560px]"
                          loading="lazy"
                          allowFullScreen
                        />
                      </div>
                    </section>
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