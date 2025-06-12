// running-admin/src/App.jsx - FICHIER COMPLET CORRIGÉ
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
import ErrorBoundary from './components/ErrorBoundary'
import Stats from './pages/Stats'
import ParcoursPage from './pages/Parcours'
import AdminRoute from './components/AdminRoute'
import DebugPanel from './components/DebugPanel'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:userId" element={<UserDetail />} />
          <Route path="history" element={<RunningHistory />} />
          <Route path="stats" element={<Stats />} />
          <Route 
            path="routes" 
            element={
              <AdminRoute>
                <ParcoursPage />
              </AdminRoute>
            } 
          />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </ErrorBoundary>
  )
}

export default App