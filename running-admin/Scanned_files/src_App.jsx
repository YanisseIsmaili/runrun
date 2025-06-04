import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import UserDetail from './pages/UserDetail'
import RunningHistory from './pages/RunningHistory'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

// Route protégée qui vérifie si l'utilisateur est connecté
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/Dashboard" />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/Settings" element={<Settings />} />
      <Route path="/Users" element={<Users />} />
      <Route path="/history" element={<RunningHistory />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="users/:userId" element={<UserDetail />} />
        
        
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App