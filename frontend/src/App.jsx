import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import PublicSociosLanding from './pages/PublicSociosLanding'
import HomeTemp from './pages/HomeTemp'
import DebugFlow from './pages/DebugFlow'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          {/* Keep old login route for backwards compatibility */}
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/equipos/:slug/socios" element={<PublicSociosLanding />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomeTemp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debug"
            element={
              <ProtectedRoute>
                <DebugFlow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App






