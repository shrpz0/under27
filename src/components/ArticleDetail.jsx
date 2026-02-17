import React, { useEffect, useState } from "react";
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
            id, created_at, title, subtitle, body, cover_url, time_to_read,
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

        {loading && <div className="mt-10 text-neutral-500 text-center">Завантаження…</div>}
        {!loading && err && <div className="mt-10 text-red-600 text-center">{err}</div>}

        {!loading && !err && article && (
          <article className="mt-4">
            {/* Title */}
            <h1 className="text-5xl md:text-6xl leading-[1.05] font-bold tracking-tight">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-base text-neutral-600">
              <div className="flex flex-row justify-between w-full">
                {typeof article.time_to_read === "number" && (
                  <span>{article.time_to_read} хв читання</span>
                )}
                <span>{fmtUA(article.created_at)}</span>
              </div>
            </div>

            {/* Subtitle */}
            {article.subtitle && (
              <p className="mt-6 text-xl md:text-2xl text-neutral-700 leading-relaxed max-w-3xl">
                {article.subtitle}
              </p>
            )}

            {/* Cover */}
            {article.cover_url && (
              <div className="mt-10 w-full aspect-[16/9] md:aspect-[2/1] overflow-hidden rounded-xl bg-neutral-100 shadow-2xl">
                <img
                  src={article.cover_url}
                  alt={article.title || "Обкладинка статті"}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Body – wider, better readability */}
            <div className="mt-12 prose prose-lg md:prose-xl lg:prose-2xl max-w-none text-neutral-900">
              <div className="whitespace-pre-wrap leading-relaxed">
                {article.body}
              </div>
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