import { useEffect, useMemo, useState } from "react"
import { supabase, uploadCover } from "./supabase-client"

function fmtDate(ts) {
  try { return new Date(ts).toLocaleString() } catch { return ts }
}

export default function Admin() {
  const [user, setUser] = useState(null)

  // auth
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authMsg, setAuthMsg] = useState("")

  // data
  const [categories, setCategories] = useState([])
  const [myArticles, setMyArticles] = useState([])
  const [loading, setLoading] = useState(false)

  // editor state
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [body, setBody] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [timeToRead, setTimeToRead] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [coverFile, setCoverFile] = useState(null)

  const isEdit = useMemo(() => editingId != null, [editingId])

  // init auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // load categories always
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase
        .from("category")
        .select("id,name")
        .order("name", { ascending: true })

      if (error) console.error(error)
      setCategories(data || [])
    })()
  }, [])

  // load my articles when logged in
  useEffect(() => {
    if (!user) return
    loadMyArticles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadMyArticles() {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("article")
        .select("id,created_at,title,subtitle,cover_url,category_id,time_to_read")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setMyArticles(data || [])
    } catch (e) {
      console.error(e)
      alert(e.message || "Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  // ===== AUTH: email+password =====
  async function login() {
    setAuthMsg("")
    const e = email.trim()
    const p = password

    if (!e) return setAuthMsg("Email введи.")
    if (!p) return setAuthMsg("Пароль тоже нужен")

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: e,
        password: p,
      })
      if (error) throw error
      setAuthMsg("")
    } catch (err) {
      console.error(err)
      setAuthMsg(err.message || "Login error")
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    resetForm()
    setMyArticles([])
    setPassword("")
  }

  // form helpers
  function resetForm() {
    setEditingId(null)
    setTitle("")
    setSubtitle("")
    setBody("")
    setCategoryId("")
    setTimeToRead("")
    setCoverUrl("")
    setCoverFile(null)
  }

  async function startEdit(id) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("article")
        .select("id,title,subtitle,body,category_id,cover_url,time_to_read")
        .eq("id", id)
        .single()

      if (error) throw error

      setEditingId(data.id)
      setTitle(data.title || "")
      setSubtitle(data.subtitle || "")
      setBody(data.body || "")
      setCategoryId(data.category_id ?? "")
      setTimeToRead(
        data.time_to_read === null || data.time_to_read === undefined
          ? ""
          : String(data.time_to_read)
      )
      setCoverUrl(data.cover_url || "")
      setCoverFile(null)
    } catch (e) {
      console.error(e)
      alert(e.message || "Ошибка загрузки статьи")
    } finally {
      setLoading(false)
    }
  }

  function parseTimeToReadOrNull(value) {
    const v = String(value ?? "").trim()
    if (!v) return null
    const n = Number(v)
    if (!Number.isFinite(n)) return "ERR"
    const int = Math.trunc(n)
    if (int < 0) return "ERR"
    if (int > 32767) return "ERR"
    return int
  }

  async function save() {
    if (!user) return alert("Сначала войди.")
    const t = title.trim()
    const s = subtitle.trim()
    const b = body.trim()

    if (!t) return alert("Нужен title.")
    if (!b) return alert("Нужен body.")
    if (!categoryId) return alert("Выбери категорию.")

    const ttr = parseTimeToReadOrNull(timeToRead)
    if (ttr === "ERR") return alert("time_to_read должен быть целым числом минут (>= 0).")

    setLoading(true)
    try {
      let finalCoverUrl = coverUrl
      if (coverFile) finalCoverUrl = await uploadCover(coverFile, user.id)

      if (!isEdit) {
        const { error } = await supabase.from("article").insert({
          title: t,
          subtitle: s,
          body: b,
          user_id: user.id,
          category_id: Number(categoryId),
          time_to_read: ttr,
          cover_url: finalCoverUrl || null,
        })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("article")
          .update({
            title: t,
            subtitle: s,
            body: b,
            category_id: Number(categoryId),
            time_to_read: ttr,
            cover_url: finalCoverUrl || null,
          })
          .eq("id", editingId)

        if (error) throw error
      }

      await loadMyArticles()
      resetForm()
      alert("Сохранено.")
    } catch (e) {
      console.error(e)
      alert(e.message || "Ошибка сохранения")
    } finally {
      setLoading(false)
    }
  }

  async function del(id) {
    if (!user) return alert("Сначала войди.")
    if (!confirm("Удалить?")) return

    setLoading(true)
    try {
      const { error } = await supabase.from("article").delete().eq("id", id)
      if (error) throw error
      await loadMyArticles()
      if (editingId === id) resetForm()
    } catch (e) {
      console.error(e)
      alert(e.message || "Ошибка удаления")
    } finally {
      setLoading(false)
    }
  }

  // ===== UI =====
  if (!user) {
    return (
      <div className="w-screen px-20 pt-12 flex flex-row justify-center">
        <div className="mx-auto bg-white rounded-[24px] p-8 w-[50%]">
          <h1 className="text-3xl font-extrabold tracking-[0.06em] uppercase">Admin</h1>
          <div className="mt-6 grid gap-3">
            <input
              className="border border-neutral-300 rounded-xl px-4 py-3 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              autoComplete="email"
            />

            <input
              className="border border-neutral-300 rounded-xl px-4 py-3 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
              autoComplete="current-password"
            />

            <button
              className="bg-black text-white rounded-xl px-5 py-3 font-semibold w-full"
              onClick={login}
              disabled={loading}
            >
              {loading ? "..." : "Login"}
            </button>
          </div>

          {authMsg && <div className="mt-4 text-sm text-red-600">{authMsg}</div>}

          <div className="mt-6 text-xs text-neutral-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen px-20 pt-12 pb-20 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-[0.06em] uppercase">Admin</h1>
            <div className="text-sm text-neutral-500">
              {user.email} · {loading ? "грузим..." : "готово"}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="border border-neutral-300 rounded-xl px-5 py-3 font-semibold"
              onClick={resetForm}
              disabled={loading}
            >
              Новая
            </button>
            <button
              className="bg-black text-white rounded-xl px-5 py-3 font-semibold"
              onClick={signOut}
              disabled={loading}
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[380px_1fr] gap-8 mt-8">
          {/* LIST */}
          <div className="border border-neutral-200 rounded-[24px] p-5">
            <h2 className="text-xl font-extrabold tracking-[0.06em] uppercase">Мои статьи</h2>

            <button
              className="mt-3 w-full border border-neutral-300 rounded-xl px-4 py-2 font-semibold"
              onClick={loadMyArticles}
              disabled={loading}
            >
              Обновить
            </button>

            <div className="mt-4 flex flex-col gap-3">
              {myArticles.map(a => (
                <div key={a.id} className="border border-neutral-200 rounded-2xl p-4">
                  <div className="font-extrabold tracking-[0.03em]">{a.title}</div>
                  {a.subtitle && <div className="text-sm text-neutral-600">{a.subtitle}</div>}
                  <div className="text-sm text-neutral-500">
                    {fmtDate(a.created_at)}
                    {typeof a.time_to_read === "number" ? ` · ${a.time_to_read} мин` : ""}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      className="border border-neutral-300 rounded-xl px-3 py-2 text-sm font-semibold"
                      onClick={() => startEdit(a.id)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      className="border border-neutral-300 rounded-xl px-3 py-2 text-sm font-semibold"
                      onClick={() => del(a.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {myArticles.length === 0 && (
                <div className="text-neutral-500">
                  Пусто. Напиши первую статью.
                </div>
              )}
            </div>
          </div>

          {/* EDITOR */}
          <div className="border border-neutral-200 rounded-[24px] p-6">
            <h2 className="text-xl font-extrabold tracking-[0.06em] uppercase">
              {isEdit ? "Редактировать" : "Новая статья"}
            </h2>

            <div className="mt-5 grid gap-4">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Title</div>
                <input
                  className="border border-neutral-300 rounded-xl px-4 py-3 w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <div className="text-sm text-neutral-500 mb-1">Subtitle</div>
                <input
                  className="border border-neutral-300 rounded-xl px-4 py-3 w-full"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Category</div>
                  <select
                    className="border border-neutral-300 rounded-xl px-4 py-3 w-full"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">-- выбери --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-sm text-neutral-500 mb-1">Time to read (мин)</div>
                  <input
                    className="border border-neutral-300 rounded-xl px-4 py-3 w-full"
                    value={timeToRead}
                    onChange={(e) => setTimeToRead(e.target.value)}
                    placeholder="например 5"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div>
                <div className="text-sm text-neutral-500 mb-1">Cover</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />

                <div className="mt-2">
                  <div className="text-xs text-neutral-500 mb-1">или вставь cover_url вручную</div>
                  <input
                    className="border border-neutral-300 rounded-xl px-4 py-3 w-full"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                {(coverFile || coverUrl) && (
                  <img
                    src={coverFile ? URL.createObjectURL(coverFile) : coverUrl}
                    alt=""
                    className="mt-3 w-full h-[220px] object-cover rounded-2xl"
                  />
                )}
              </div>

              <div>
                <div className="text-sm text-neutral-500 mb-1">Body</div>

                <div className="mb-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                  <div className="font-semibold text-black mb-2">Вставки в текст</div>

                  <div className="space-y-2">
                    <div>
                      Juxtapose:
                      <div className="mt-1 font-mono text-xs break-all">
                        [juxtapose:https://cdn.knightlab.com/libs/juxtapose/latest/embed/index.html?uid=...]
                      </div>
                    </div>

                    <div>
                      Cloudinary video:
                      <div className="mt-1 font-mono text-xs break-all">
                        [cloudinary-video:https://res.cloudinary.com/your-cloud/video/upload/v1234567890/video.mp4]
                      </div>
                    </div>
                  </div>
                </div>

                <textarea
                  className="border border-neutral-300 rounded-xl px-4 py-3 w-full min-h-[280px] font-mono"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={`Текст статьи...

[cloudinary-video:https://res.cloudinary.com/your-cloud/video/upload/v1234567890/video.mp4]

Дальше продолжается текст...`}
                />
              </div>

              <div className="flex gap-3">
                <button
                  className="bg-black text-white rounded-xl px-5 py-3 font-semibold"
                  disabled={loading}
                  onClick={save}
                >
                  {isEdit ? "Сохранить" : "Создать"}
                </button>

                <button
                  className="border border-neutral-300 rounded-xl px-5 py-3 font-semibold"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Сброс
                </button>
              </div>

              <div className="text-xs text-neutral-500">
                time_to_read — минуты (int2). Пусто = null.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}