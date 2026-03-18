import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('products').select('*')
  
  return (
    <main>
      <h1>almu3dl</h1>
      <p>المنتجات: {data?.length ?? 0}</p>
      {error && <p>خطأ: {error.message}</p>}
    </main>
  )
}