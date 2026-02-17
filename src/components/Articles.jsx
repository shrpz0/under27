import React, { useEffect, useMemo, useState } from 'react'
import ScrollVelocity from './UI/ScrollVelocity'
import Article from './Article.jsx'
import { supabase } from './supabase-client'

function Articles({ activeTab, onOpenArticle }) {
  const [categories, setCategories] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)

  // load categories once
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase
        .from('category')
        .select('id,name')
        .order('name', { ascending: true })

      if (error) console.error(error)
      setCategories(data || [])
    })()
  }, [])

  // map tab -> category id
  const activeCategoryId = useMemo(() => {
    if (!activeTab) return null
    const c = categories.find(x => (x.name || "").toUpperCase() === activeTab.toUpperCase())
    return c?.id ?? null
  }, [activeTab, categories])

  // load articles (optionally filtered)
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        let q = supabase
          .from('article')
          .select(`
            id, created_at, title, subtitle, cover_url, time_to_read, category_id,
            category:category_id ( id, name )
          `)
          .order('created_at', { ascending: false })

        // you CAN keep this filtering on home, but it’s optional
        // if you want home to always show latest regardless of activeTab, comment this out.
        if (activeCategoryId) q = q.eq('category_id', activeCategoryId)

        const { data, error } = await q
        if (error) throw error
        setArticles(data || [])
      } catch (e) {
        console.error(e)
        setArticles([])
      } finally {
        setLoading(false)
      }
    })()
  }, [activeCategoryId])

  const top3 = useMemo(() => (articles || []).slice(0, 3), [articles])

  return (
    <div className='w-screen pt-12 flex flex-col gap-10'>
      <ScrollVelocity
        texts={['ОСТАННI СТАТТI +']}
        velocity={200}
        className="custom-scroll-text"
      />

      <div className='px-20 flex flex-row justify-around'>
        {loading && <div className="text-white/70">Loading...</div>}

        {!loading && top3.map(a => (
          <Article
            key={a.id}
            article={a}
            onClick={() => onOpenArticle?.(a.id)}
          />
        ))}

        {!loading && top3.length === 0 && (
          <div className="text-white/70">Немає статей.</div>
        )}
      </div>

      {/* keep your existing text block below */}
      <div className='flex flex-col gap-5 justify-center items-center px-24 text-[20px]'>
        <h1 className='text-3xl'>{'>>>'} ПРО АНДЕР 27</h1>
        <h2>
          Ми створили це медіа для того, щоб покоління UNDER 27 не боялося крокувати у майбутнє.
        </h2>
        <h2 className='text-center'>
          UNDER 27 — українське онлайн-видання про внутрішню реальність двадцятих років життя.
          Про рішення, які ламають.
          Про страхи, які маскуються під амбіцію. Про любов, яка не завжди про любов
        </h2>
        <h2>
          Ми не вчимо жити. Ми розбираємося, чому так складно жити.
        </h2>
        <h2>
          Тут говорять про те, що зазвичай ховають за «все нормально». Через історії, дані, досвід і чесні запитання.
        </h2>
        <h2>
          Нехай АНДЕР буде вашим медіа сили та натхнення.
        </h2>
        <h2 className='ml-auto font-semibold'>//з любовʼю, команда UNDER 27</h2>
      </div>
    </div>
  )
}

export default Articles
