import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)


export async function uploadCover(file, userId) {
    if (!file) return null
  
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
    const path = `${userId}/${Date.now()}.${ext}`
  
    const { error: upErr } = await supabase.storage
      .from("covers")
      .upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      })
  
    if (upErr) throw upErr
  
    const { data } = supabase.storage.from("covers").getPublicUrl(path)
    return data.publicUrl
  }