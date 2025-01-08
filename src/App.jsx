import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SierrasPage from './pages/SierrasPage';
import SucursalesPage from './pages/SucursalesPage';
import UsuariosPage from './pages/UsuariosPage';
import RegistroAfiladoPage from './pages/RegistroAfiladoPage';
import Layout from './components/shared/Layout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sierras"
            element={
              <ProtectedRoute>
                <SierrasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sucursales"
            element={
              <ProtectedRoute>
                <SucursalesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registro-afilado"
            element={
              <ProtectedRoute>
                <RegistroAfiladoPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}