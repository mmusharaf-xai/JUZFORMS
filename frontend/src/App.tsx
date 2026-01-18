import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Auth pages
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';

// Form pages
import FormsListing from '@/pages/forms/FormsListing';
import FormConfiguration from '@/pages/forms/FormConfiguration';
import FormSubmissions from '@/pages/forms/FormSubmissions';
import PublicForm from '@/pages/forms/PublicForm';

// Database pages
import DatabaseListing from '@/pages/database/DatabaseListing';
import DatabaseDetails from '@/pages/database/DatabaseDetails';

// Settings pages
import Settings from '@/pages/settings/Settings';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route wrapper (redirects to forms if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (token) {
    return <Navigate to="/forms" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public auth routes */}
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
            <Signup />
          </PublicRoute>
        }
      />

      {/* Public form view */}
      <Route path="/form/:id" element={<PublicForm />} />

      {/* Protected routes */}
      <Route
        path="/forms"
        element={
          <ProtectedRoute>
            <FormsListing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id/configure"
        element={
          <ProtectedRoute>
            <FormConfiguration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id/submissions"
        element={
          <ProtectedRoute>
            <FormSubmissions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/databases"
        element={
          <ProtectedRoute>
            <DatabaseListing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/databases/:id"
        element={
          <ProtectedRoute>
            <DatabaseDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/forms" replace />} />
      <Route path="*" element={<Navigate to="/forms" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
