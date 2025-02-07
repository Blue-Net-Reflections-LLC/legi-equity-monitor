import { auth } from "@/app/(auth)/auth"
import { redirect } from "next/navigation"
import { ADMIN_ROLES } from "@/app/constants/user-roles"
import { Providers } from "./context/Providers"
import { AdminSidebar } from "./components/AdminSidebar"
import Header from "@/components/Header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  if (session?.user?.role && !ADMIN_ROLES.includes(session.user.role)) {
    redirect('/login')
  }

  return (
    <Providers>
      <Header isAdminPage />
      <div className="flex h-[calc(100vh-4rem)] mt-[4rem]">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto pl-16">
          {children}
        </main>
      </div>
    </Providers>
  )
} 