
import React, { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  CreditCard, Banknote, BarChart3, FileText, 
  ShoppingBag, Landmark, ReceiptText, HelpCircle,
  Wallet, FileSpreadsheet, CalendarRange, BarChart2,
  Package2, Download, ArrowUpDown,
  Calendar, Lock, Clock, Users
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DailySalesSummary } from '@/components/accountant/DailySalesSummary';
import { PaymentBreakdown } from '@/components/accountant/PaymentBreakdown';
import { DailyExpenses } from '@/components/accountant/DailyExpenses';
import { CashReconciliation } from '@/components/accountant/CashReconciliation';
import { ProfitEstimate } from '@/components/accountant/ProfitEstimate';
import { ReportsList } from '@/components/accountant/ReportsList';
import { ProductSalesSearch } from '@/components/accountant/ProductSalesSearch';
import { ExpenseManagement } from '@/components/accountant/ExpenseManagement';
import { AutoScheduleReports } from '@/components/accountant/AutoScheduleReports';
import { SupplierManagement } from '@/components/accountant/SupplierManagement';
import { CashierLockoutOption } from '@/components/accountant/CashierLockoutOption';
import { ProjectedCashFlow } from '@/components/accountant/ProjectedCashFlow';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { CashierSalesBreakdown } from '@/components/accountant/CashierSalesBreakdown';
import { CashierProductSales } from '@/components/accountant/CashierProductSales';
import { toast } from 'sonner';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        
        <div className="flex items-center gap-4">
          <Select defaultValue={dateFilter} onValueChange={(value) => setDateFilter(value as 'today' | 'yesterday' | 'week' | 'month' | 'custom')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {dateFilter === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !customDateRange.from && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {customDateRange.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, "LLL dd, y")} -{" "}
                        {format(customDateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(customDateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={customDateRange.from}
                  selected={{
                    from: customDateRange.from,
                    to: customDateRange.to,
                  }}
                  onSelect={(range) => {
                    setCustomDateRange({
                      from: range?.from,
                      to: range?.to,
                    });
                  }}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (activeTab === 'reports') {
                  window.dispatchEvent(new CustomEvent('report-export', { detail: { format: 'pdf' } }));
                } else {
                  toast.info('PDF export is only available in the Reports tab. Please switch to the Reports tab to export data.');
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (activeTab === 'reports') {
                  window.dispatchEvent(new CustomEvent('report-export', { detail: { format: 'excel' } }));
                } else {
                  toast.info('Excel export is only available in the Reports tab. Please switch to the Reports tab to export data.');
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="dashboard">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="cashiers">
            <Users className="w-4 h-4 mr-2" />
            Cashiers
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <Wallet className="w-4 h-4 mr-2" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Lock className="w-4 h-4 mr-2" />
            Tools
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-220px)]">
          <TabsContent value="dashboard" className="space-y-4 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <ErrorBoundary>
                <DailySalesSummary dateFilter={dateFilter} />
              </ErrorBoundary>
              <ErrorBoundary>
                <PaymentBreakdown dateFilter={dateFilter} />
              </ErrorBoundary>
              <ErrorBoundary>
                <ProfitEstimate dateFilter={dateFilter} />
              </ErrorBoundary>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ErrorBoundary>
                <DailyExpenses dateFilter={dateFilter} />
              </ErrorBoundary>
              <ErrorBoundary>
                <CashReconciliation dateFilter={dateFilter} />
              </ErrorBoundary>
            </div>
            
            <div className="mt-6">
              <ErrorBoundary>
                <ProjectedCashFlow />
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="cashiers" className="space-y-4 p-1">
            <div className="grid grid-cols-1 gap-4">
              <ErrorBoundary>
                <CashierSalesBreakdown dateFilter={dateFilter} />
              </ErrorBoundary>
              <ErrorBoundary>
                <CashierProductSales dateFilter={dateFilter} />
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 p-1">
            <div className="grid grid-cols-1 gap-4">
              <ErrorBoundary>
                <ProductSalesSearch />
              </ErrorBoundary>
              <ErrorBoundary>
                <ReportsList />
              </ErrorBoundary>
              <ErrorBoundary>
                <AutoScheduleReports />
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4 p-1">
            <ErrorBoundary>
              <ExpenseManagement />
            </ErrorBoundary>
          </TabsContent>

          
          <TabsContent value="tools" className="space-y-4 p-1">
            <ErrorBoundary>
              <CashierLockoutOption />
            </ErrorBoundary>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default ReportsPage;