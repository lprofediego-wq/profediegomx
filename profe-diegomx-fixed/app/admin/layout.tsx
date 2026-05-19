// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <AdminSidebar userName={profile?.full_name ?? profile?.email ?? 'Admin'} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
