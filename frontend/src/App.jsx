import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatDashboard from './components/Chat/ChatDashboard';
import './App.css';

// Loading Screen Component
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '1rem'
    }}>
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  console.log('ProtectedRoute:', { isAuthenticated, loading });

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route Component (redirect to chat if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  console.log('PublicRoute:', { isAuthenticated, loading });

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    console.log('Already authenticated, redirecting to chat');
    return <Navigate to="/chat" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - Login & Register */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes - Chat */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <WebSocketProvider>
              <ChatDashboard />
            </WebSocketProvider>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/chat/:userEmail"
        element={
          <ProtectedRoute>
            <WebSocketProvider>
              <ChatDashboard />
            </WebSocketProvider>
          </ProtectedRoute>
        }
      />

      {/* Root Route */}
      <Route 
        path="/" 
        element={<Navigate to="/chat" replace />} 
      />
      
      {/* 404 - Catch all */}
      <Route 
        path="*" 
        element={<Navigate to="/login" replace />} 
      />
    </Routes>
  );
}

function App() {
  console.log('App component rendering');
  
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;