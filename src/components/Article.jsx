import React from 'react'

function Article({ article, onClick }) {
  const cover = article?.cover_url || "hero_bg.jpg"
  const title = article?.title || "Без назви"
  const cat = article?.category?.name || ""

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onClick?.() }}
      className="w-[325px] h-[458px] rounded-[40px] overflow-hidden relative bg-black cursor-pointer select-none"
    >
      <img src={cover} alt="cover" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/95" />

      <div className="relative z-10 h-full w-full px-5 pb-6 pt-10 flex flex-col justify-end">
        <div className="flex-1 flex" />
        <h2 className="text-white font-normal leading-[1.06] tracking-[-0.02em]">{title}</h2>
        <div className="mt-2 text-white/70 text-sm tracking-[0.08em]">
          <h2 className='font-light'>{cat}</h2>
        </div>
      </div>
    </div>
  )
}

export default Article


