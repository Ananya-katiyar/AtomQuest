import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import EmployeeDashboard from './pages/employee/Dashboard'
import ManagerDashboard  from './pages/manager/Dashboard'
import AdminDashboard    from './pages/admin/Dashboard'

function RoleRoute() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-500">
      Loading...
    </div>
  )

  if (!user) return <Navigate to="/login" />

  if (user.role === 'admin')    return <AdminDashboard />
  if (user.role === 'manager')  return <ManagerDashboard />
  if (user.role === 'employee') return <EmployeeDashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"     element={<RoleRoute />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}