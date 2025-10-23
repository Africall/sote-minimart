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
import {
  BookOpen, FileText, DollarSign, TrendingUp, Receipt,
  FileSpreadsheet, FileBarChart, ShoppingCart
} from 'lucide-react';

export const AccountingPage: React.FC = () => {
  const { profile } = useAuth();
  const isCashier = profile?.role === 'cashier';
  const [activeTab, setActiveTab] = useState(isCashier ? 'invoices' : 'dashboard');

  return (
    // Let AppLayout provide the page gradient background; we use elevated surfaces inside.
    <div className="space-y-6 animate-slide-up">
      {/* Gradient header */}
      <header className="rounded-xl overflow-hidden shadow-elegant">
        <div className="bg-gradient-to-r from-royal-blue-600 to-primary/80 text-white px-6 py-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Accounting System
          </h1>
          <p className="opacity-90">Double-entry bookkeeping & financial reports</p>
        </div>
      </header>

      <div className="page-surface p-4 md:p-6 hover-lift">
        {isCashier ? (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h2 className="text-xl font-semibold">Supplier Invoice Management</h2>
              <p className="text-muted-foreground">Create and track supplier invoices</p>
            </div>
            <SupplierInvoicesModule />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Pill-styled tabs against the surface */}
            <TabsList className="grid w-full grid-cols-10 mb-6 rounded-xl bg-muted/60 p-1">
              <TabsTrigger
                value="dashboard"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="trial"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Trial Balance
              </TabsTrigger>
              <TabsTrigger
                value="pl"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                P&L
              </TabsTrigger>
              <TabsTrigger
                value="balance"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                <FileText className="h-4 w-4 mr-2" />
                Balance Sheet
              </TabsTrigger>
              <TabsTrigger
                value="vat"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                <Receipt className="h-4 w-4 mr-2" />
                VAT
              </TabsTrigger>
              <TabsTrigger
                value="cashbook"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Cashbook
              </TabsTrigger>
              <TabsTrigger
                value="journals"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                <FileText className="h-4 w-4 mr-2" />
                Journals
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Supplier Invoices
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                <FileBarChart className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                <FileText className="h-4 w-4 mr-2" />
                Transactions
              </TabsTrigger>
            </TabsList>

            {/* Each section naturally sits on the same surface */}
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
