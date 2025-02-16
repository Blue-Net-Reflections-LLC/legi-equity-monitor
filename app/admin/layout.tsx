import { auth } from "@/app/(auth)/auth"
import { redirect } from "next/navigation"
import { ADMIN_ROLES } from "@/app/constants/user-roles"
import { AdminSidebar } from "./components/AdminSidebar"

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
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto pl-16">
        <div className="mt-12">
          {children}
        </div>
      </main>
    </div>
  )
} 