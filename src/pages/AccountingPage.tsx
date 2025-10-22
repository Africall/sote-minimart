import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountingDashboard } from '@/components/accounting/AccountingDashboard';
import { TrialBalanceModule } from '@/components/accounting/TrialBalanceModule';
import { IncomeStatementModule } from '@/components/accounting/IncomeStatementModule';
import { BalanceSheetModule } from '@/components/accounting/BalanceSheetModule';
import { VATReturnModule } from '@/components/accounting/VATReturnModule';
import { CashbookModule } from '@/components/accounting/CashbookModule';
import { JournalsModule } from '@/components/accounting/JournalsModule';
import { SupplierInvoicesModule } from '@/components/accounting/SupplierInvoicesModule';
import { ExpensesModule } from '@/components/accounting/ExpensesModule';
import { ReportsModule } from '@/components/accounting/ReportsModule';
import { TransactionsListModule } from '@/components/accounting/TransactionsListModule';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, FileText, DollarSign, TrendingUp, Receipt, FileSpreadsheet, FileBarChart, ShoppingCart } from 'lucide-react';

export const AccountingPage: React.FC = () => {
  const { profile } = useAuth();
  const isCashier = profile?.role === 'cashier';
  const [activeTab, setActiveTab] = useState(isCashier ? 'invoices' : 'dashboard');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Accounting System
          </h1>
          <p className="text-muted-foreground">Double-entry bookkeeping & financial reports</p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {isCashier ? (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">Supplier Invoice Management</h2>
              <p className="text-muted-foreground">Create and track supplier invoices</p>
            </div>
            <SupplierInvoicesModule />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-10 mb-6">
              <TabsTrigger value="dashboard">
                <TrendingUp className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="trial">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Trial Balance
              </TabsTrigger>
              <TabsTrigger value="pl">
                <DollarSign className="h-4 w-4 mr-2" />
                P&L
              </TabsTrigger>
              <TabsTrigger value="balance">
                <FileText className="h-4 w-4 mr-2" />
                Balance Sheet
              </TabsTrigger>
              <TabsTrigger value="vat">
                <Receipt className="h-4 w-4 mr-2" />
                VAT
              </TabsTrigger>
              <TabsTrigger value="cashbook">
                <BookOpen className="h-4 w-4 mr-2" />
                Cashbook
              </TabsTrigger>
              <TabsTrigger value="journals">
                <FileText className="h-4 w-4 mr-2" />
                Journals
              </TabsTrigger>
              <TabsTrigger value="invoices">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Supplier Invoices
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileBarChart className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <FileText className="h-4 w-4 mr-2" />
                Transactions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <AccountingDashboard />
            </TabsContent>

            <TabsContent value="trial" className="space-y-6">
              <TrialBalanceModule />
            </TabsContent>

            <TabsContent value="pl" className="space-y-6">
              <IncomeStatementModule />
            </TabsContent>

            <TabsContent value="balance" className="space-y-6">
              <BalanceSheetModule />
            </TabsContent>

            <TabsContent value="vat" className="space-y-6">
              <VATReturnModule />
            </TabsContent>

            <TabsContent value="cashbook" className="space-y-6">
              <CashbookModule />
            </TabsContent>

            <TabsContent value="journals" className="space-y-6">
              <JournalsModule />
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <SupplierInvoicesModule />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <ReportsModule />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <TransactionsListModule />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};