
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  PlusCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Truck,
  DollarSign,
  Calculator,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

// Role-based menu items
const getMenuItems = (role: string) => {
  const allItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', roles: ['admin'] },
    { icon: Package, label: 'Inventory', path: '/inventory', roles: ['admin', 'inventory'] },
    { icon: DollarSign, label: 'Price Management', path: '/price-management', roles: ['admin', 'inventory'] },
    { icon: PlusCircle, label: 'Add Product', path: '/add-product', roles: ['admin', 'inventory'] },
    { icon: ShoppingCart, label: 'POS', path: '/cashier-pos', roles: ['admin', 'cashier'] },
    { icon: AlertTriangle, label: 'Reorder Alerts', path: '/reorder-alerts', roles: ['admin', 'inventory'] },
    { icon: Calendar, label: 'Expiry Tracker', path: '/expiry-tracker', roles: ['admin', 'inventory'] },
    { icon: Truck, label: 'Suppliers', path: '/suppliers', roles: ['admin', 'inventory'] },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['admin', 'accountant'] },
    { icon: Calculator, label: 'Accounting', path: '/accounting', roles: ['admin', 'accountant', 'cashier'] },
    { icon: Users, label: 'User Management', path: '/user-management', roles: ['admin'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
  ];

  return allItems.filter(item => item.roles.includes(role));
};

export const Sidebar = () => {
  const location = useLocation();
  const { logout, profile } = useAuth();
  
  const userRole = profile?.role || 'cashier';
  const menuItems = getMenuItems(userRole);

  return (
    <div className="w-56 bg-white border-r border-gray-200 h-full relative flex flex-col">
      <div className="p-4">
        <h1 className="text-lg font-bold text-gray-800">SOTE MINIMART</h1>
      </div>
      
      <nav className="flex-1 mt-4">
        <div className="px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* User Profile and Logout */}
      <div className="p-3 border-t border-gray-200">
        {profile && (
          <div className="mb-2 text-sm text-gray-600">
            <div className="font-medium truncate">{profile.name}</div>
            <div className="text-xs text-gray-500 capitalize">{profile.role}</div>
          </div>
        )}
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};
