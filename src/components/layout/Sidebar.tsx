import React from "react";
import { Link, useLocation } from "react-router-dom";
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
  Truck,
  DollarSign,
  Calculator,
  LogOut,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

/** Role-based menu items (unchanged) */
const getMenuItems = (role: string) => {
  const allItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard", roles: ["admin"] },
    { icon: Package, label: "Inventory", path: "/inventory", roles: ["admin", "inventory", "cashier"] },
    { icon: DollarSign, label: "Price Management", path: "/price-management", roles: ["admin", "inventory"] },
    { icon: PlusCircle, label: "Add Product", path: "/add-product", roles: ["admin", "inventory"] },
    { icon: ShoppingCart, label: "POS", path: "/cashier-pos", roles: ["admin", "cashier"] },
    { icon: AlertTriangle, label: "Reorder Alerts", path: "/reorder-alerts", roles: ["admin", "inventory"] },
    { icon: Calendar, label: "Expiry Tracker", path: "/expiry-tracker", roles: ["admin", "inventory"] },
    { icon: FileBarChart, label: "Stock Movement Report", path: "/stock-movement-report", roles: ["admin", "inventory"] },
    { icon: Truck, label: "Suppliers", path: "/suppliers", roles: ["admin", "inventory"] },
    { icon: BarChart3, label: "Reports", path: "/reports", roles: ["admin", "accountant"] },
    { icon: Calculator, label: "Accounting", path: "/accounting", roles: ["admin", "accountant", "cashier"] },
    { icon: Users, label: "User Management", path: "/user-management", roles: ["admin"] },
    { icon: Settings, label: "Settings", path: "/settings", roles: ["admin"] },
  ];
  return allItems.filter((item) => item.roles.includes(role));
};

export const Sidebar = () => {
  const location = useLocation();
  const { logout, profile } = useAuth();

  const userRole = profile?.role || "cashier";
  const menuItems = getMenuItems(userRole);

  return (
    <aside className="pos-sidebar gradient-sidebar text-white h-full relative flex flex-col">
      {/* Animated subtle glow layer */}
      <div className="pointer-events-none absolute inset-0 opacity-20 animate-gradient-shift bg-[length:200%_200%]" />

      {/* Header / Branding */}
      <div className="relative z-10 p-4 flex items-center gap-3">
        <div className="relative">
          <img src={logo} alt="SOTE MINIMART" className="h-10 w-auto drop-shadow-md animate-float" />
        </div>
        <div className="leading-tight">
          <div className="font-extrabold tracking-wide">SOTE MINIMART</div>
          <div className="text-[11px] uppercase opacity-80">POS & Inventory</div>
        </div>
      </div>

      {/* Role badge */}
      <div className="relative z-10 px-4">
        <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs capitalize">
          Role: <span className="ml-1 font-semibold">{userRole}</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 mt-4">
        <div className="px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all",
                  "hover:bg-white/10",
                  isActive
                    ? "bg-vibrant-red-500 text-white shadow-glow-secondary"
                    : "text-white/85"
                )}
              >
                {/* Active indicator bar */}
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r",
                    isActive ? "bg-white" : "bg-transparent"
                  )}
                />
                <Icon className="mr-3 h-4 w-4 opacity-90" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User + Logout */}
      <div className="relative z-10 p-3 border-t border-white/10">
        {profile && (
          <div className="mb-2 text-sm text-white/90">
            <div className="font-medium truncate">{profile.name}</div>
            <div className="text-xs opacity-80 capitalize">{profile.role}</div>
          </div>
        )}
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="w-full justify-start rounded-xl border-white/20 text-white hover:bg-white/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
};
