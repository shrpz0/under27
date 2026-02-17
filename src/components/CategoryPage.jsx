import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "./supabase-client"
import { IoArrowBack } from "react-icons/io5"

function fmtUA(ts) {
  try {
    return new Date(ts).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

function FeaturedCard({ a, onClick }) {
  if (!a) return null
  return (
    <div
      onClick={onClick}
      className="cursor-pointer w-full rounded-[28px] overflow-hidden bg-white shadow-[0_20px_80px_rgba(0,0,0,0.15)] flex"
    >
      <div className="w-[52%] min-h-[280px] bg-neutral-200">
        <img
          src={a.cover_url || "hero_bg.jpg"}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="w-[48%] p-10 flex flex-col gap-5">
        <div className="text-[14px] tracking-[0.12em] uppercase font-semibold text-neutral-500">
          ОСТАННЯ СТАТТЯ
        </div>

        <div className="text-[28px] leading-tight font-extrabold tracking-[0.02em]">
          {a.title}
        </div>

        {a.subtitle && (
          <div className="text-[14px] text-neutral-600 leading-snug">
            {a.subtitle}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between text-[12px] text-neutral-500">
          <div>{fmtUA(a.created_at)}</div>
          {typeof a.time_to_read === "number" && (
            <div>{a.time_to_read} хв читання</div>
          )}
        </div>
      </div>
    </div>
  )
}

function SmallCard({ a, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-[24px] overflow-hidden bg-white shadow-[0_18px_60px_rgba(0,0,0,0.12)]"
    >
      <div className="h-[160px] bg-neutral-200">
        <img
          src={a.cover_url || "hero_bg.jpg"}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-6">
        <div className="font-extrabold leading-snug tracking-[0.02em]">
          {a.title}
        </div>
        {typeof a.time_to_read === "number" && (
          <div className="mt-3 text-[12px] text-neutral-500">
            {a.time_to_read} хв читання
          </div>
        )}
      </div>
    </div>
  )
}

export default function CategoryPage({ categoryName, onBack, onOpenArticle }) {
  const [loading, setLoading] = useState(false)
  const [articles, setArticles] = useState([])
  const [err, setErr] = useState("")

  useEffect(() => {
    if (!categoryName) return
    ;(async () => {
      setLoading(true)
      setErr("")
      try {
        // find category id by name (case-insensitive)
        const { data: cat, error: catErr } = await supabase
          .from("category")
          .select("id,name")
          .ilike("name", categoryName)
          .single()

        if (catErr) throw catErr

        const { data, error } = await supabase
          .from("article")
          .select("id,created_at,title,subtitle,cover_url,time_to_read,category_id")
          .eq("category_id", cat.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setArticles(data || [])
      } catch (e) {
        console.error(e)
        setErr(e.message || "Failed to load category articles")
        setArticles([])
      } finally {
        setLoading(false)
      }
    })()
  }, [categoryName])

  const featured = useMemo(() => articles?.[0] || null, [articles])
  const rest = useMemo(() => (articles || []).slice(1), [articles])

  return (
    <div className="w-screen bg-white">
      <div className="px-20 pt-10 pb-20">
        {/* Back row */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-black font-semibold tracking-[0.06em] uppercase"
          >
            <IoArrowBack size={22} />
            Назад
          </button>
        </div>

        {/* Big Title */}
        <div className="mt-8 text-[96px] leading-none font-extrabold tracking-[0.02em]">
          {categoryName || ""}
        </div>

        {/* Content */}
        <div className="mt-10">
          {loading && <div className="text-neutral-500">Loading…</div>}
          {!loading && err && <div className="text-red-600">{err}</div>}
          {!loading && !err && articles.length === 0 && (
            <div className="text-neutral-500">Немає статей у цій категорії.</div>
          )}

          {!loading && !err && featured && (
            <>
              <FeaturedCard
                a={featured}
                onClick={() => onOpenArticle?.(featured.id)}
              />

              <div className="mt-10 grid grid-cols-3 gap-8">
                {rest.slice(0, 6).map(a => (
                  <SmallCard
                    key={a.id}
                    a={a}
                    onClick={() => onOpenArticle?.(a.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

