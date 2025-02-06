import { auth } from "@/app/(auth)/auth"
import { redirect } from "next/navigation"
import { ADMIN_ROLES } from "@/app/constants/user-roles"

export default async function AdminPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  if (session?.user?.role && !ADMIN_ROLES.includes(session.user.role)) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Welcome, {session.user.name || session.user.email}</h2>
          <p className="text-gray-600">Role: {session.user.role || 'N/A'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {/* Placeholder admin features */}
          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <h3 className="font-semibold">User Management</h3>
            <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
          </div>
          
          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <h3 className="font-semibold">Content Management</h3>
            <p className="text-sm text-gray-600">Manage site content and articles</p>
          </div>

          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <h3 className="font-semibold">Analytics</h3>
            <p className="text-sm text-gray-600">View site statistics and reports</p>
          </div>
        </div>
      </div>
    </div>
  )
} 