import { auth } from "@/app/(auth)/auth"
import { redirect } from "next/navigation"
import { ADMIN_ROLES } from "@/app/constants/user-roles"
import { Users } from "lucide-react"

export default async function UsersPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  if (session?.user?.role && !ADMIN_ROLES.includes(session.user.role)) {
    redirect('/login')
  }

  return (
    <div className="h-full space-y-6 p-8 bg-zinc-50 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Stats Cards */}
        <div className="p-8 bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-orange-500 mb-4">
            <Users className="h-5 w-5" />
            <h3 className="font-medium">Total Users</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">--</p>
        </div>

        <div className="p-8 bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-orange-500 mb-4">
            <Users className="h-5 w-5" />
            <h3 className="font-medium">Admins</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">--</p>
        </div>

        <div className="p-8 bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-orange-500 mb-4">
            <Users className="h-5 w-5" />
            <h3 className="font-medium">Active Today</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">--</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-500 dark:text-zinc-400">
          User management features will be implemented here.
        </p>
      </div>
    </div>
  )
} 