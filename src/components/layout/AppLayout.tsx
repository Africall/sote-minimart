
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Loader } from 'lucide-react';

interface AppLayoutProps {
  requiredRoles?: Array<'admin' | 'cashier' | 'inventory' | 'accountant'>;
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ requiredRoles = [], children }) => {
  const { isAuthenticated, loading, profile, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRoles.length > 0 && !hasPermission(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="min-h-full">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
