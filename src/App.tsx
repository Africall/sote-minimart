
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';

// Page imports
import Index from '@/pages/Index';
import InventoryPage from '@/pages/InventoryPage';
import InventoryDashboardPage from '@/pages/InventoryDashboardPage';
import PriceManagementPage from '@/pages/PriceManagementPage';
import AddProductPage from '@/pages/AddProductPage';
import POSPage from '@/pages/POSPage';
import CashierPosPage from '@/pages/CashierPosPage';
import ReorderAlertsPage from '@/pages/ReorderAlertsPage';
import ExpiryTrackerPage from '@/pages/ExpiryTrackerPage';
import SupplierDirectoryPage from '@/pages/SupplierDirectoryPage';
import ReportsPage from '@/pages/ReportsPage';
import UserManagementPage from '@/pages/UserManagementPage';
import SettingsPage from '@/pages/SettingsPage';
import LoginPage from '@/pages/LoginPage';
import AuthPage from '@/pages/AuthPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import RestockPage from '@/pages/RestockPage';
import InventoryMovementPage from '@/pages/InventoryMovementPage';
import ImportExportPage from '@/pages/ImportExportPage';
import NotFound from '@/pages/NotFound';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import { AccountingPage } from '@/pages/AccountingPage';
import StockMovementReportPage from '@/pages/StockMovementReportPage';

function App() {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="App">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/*" element={
                  <AppLayout>
                    <Routes>
                      <Route index element={<Index />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="inventory" element={<InventoryDashboardPage />} />
                      <Route path="inventory-old" element={<InventoryPage />} />
                      <Route path="price-management" element={<PriceManagementPage />} />
                      <Route path="add-product" element={<AddProductPage />} />
                      <Route path="pos" element={<POSPage />} />
                      <Route path="cashier-pos" element={<CashierPosPage />} />
                      <Route path="reorder-alerts" element={<ReorderAlertsPage />} />
                      <Route path="expiry-tracker" element={<ExpiryTrackerPage />} />
                      <Route path="suppliers" element={<SupplierDirectoryPage />} />
                      <Route path="reports" element={<ReportsPage />} />
                      <Route path="accounting" element={<AccountingPage />} />
                      <Route path="user-management" element={<UserManagementPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="restock" element={<RestockPage />} />
                      <Route path="inventory-movement" element={<InventoryMovementPage />} />
                      <Route path="stock-movement-report" element={<StockMovementReportPage />} />
                      <Route path="import-export" element={<ImportExportPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                } />
              </Routes>
              <Toaster />
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
