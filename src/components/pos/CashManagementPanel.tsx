import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DollarSign, TrendingUp, TrendingDown, Calculator, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/supabaseUtils';
import { useCashManagement } from '@/hooks/useCashManagement';
import { StartShiftDialog } from './StartShiftDialog';
import { CashTransactionFeed } from './CashTransactionFeed';

export const CashManagementPanel: React.FC = () => {
  const {
    currentShift,
    cashBalance,
    transactions,
    loading,
    startShift,
    endShift,
    addCashOut,
    addCashIn,
    performReconciliation
  } = useCashManagement();

  const [floatAmount, setFloatAmount] = useState('0');
  const [cashInAmount, setCashInAmount] = useState('');
  const [cashInDescription, setCashInDescription] = useState('');
  const [showCashIn, setShowCashIn] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [cashOutDescription, setCashOutDescription] = useState('');
  const [reconciliationAmount, setReconciliationAmount] = useState('');
  const [showStartShift, setShowStartShift] = useState(false);
  const [showCashOut, setShowCashOut] = useState(false);
  const [showReconciliation, setShowReconciliation] = useState(false);

  const handleStartShift = async () => {
    const amount = parseFloat(floatAmount);
    if (amount > 0) {
      const success = await startShift(amount);
      if (success) {
        setShowStartShift(false);
      }
    }
  };

  const handleCashOut = async () => {
    const amount = parseFloat(cashOutAmount);
    if (amount > 0 && cashOutDescription.trim()) {
      const success = await addCashOut(amount, cashOutDescription);
      if (success) {
        setCashOutAmount('');
        setCashOutDescription('');
        setShowCashOut(false);
      }
    }
  };

  const handleCashIn = async () => {
    const amount = parseFloat(cashInAmount);
    if (amount > 0 && cashInDescription.trim()) {
      const success = await addCashIn(amount, cashInDescription);
      if (success) {
        setCashInAmount('');
        setCashInDescription('');
        setShowCashIn(false);
      }
    }
  };

  const handleReconciliation = async () => {
    const amount = parseFloat(reconciliationAmount);
    if (amount >= 0) {
      const success = await performReconciliation(amount);
      if (success) {
        setReconciliationAmount('');
        setShowReconciliation(false);
      }
    }
  };

  const handleEndShift = async () => {
    await endShift();
  };

  if (!currentShift) {
    return (
      <div className="space-y-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Cash Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No active shift found.
              </p>
              <Button onClick={() => setShowStartShift(true)}>
                Start Shift
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <StartShiftDialog
          open={showStartShift}
          onOpenChange={setShowStartShift}
          onStartShift={startShift}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cash Balance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Real-Time Cash Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-2">Float</p>
              <p className="text-base font-bold text-blue-600">
                {formatCurrency(cashBalance.float)}
              </p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-2">Cash In</p>
              <p className="text-base font-bold text-green-600">
                {formatCurrency(cashBalance.cashIn)}
              </p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-2">Cash Out</p>
              <p className="text-base font-bold text-red-600">
                {formatCurrency(cashBalance.cashOut)}
              </p>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground mb-2">Till Balance</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(cashBalance.realTimeBalance)}
              </p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-2">Total Sales</p>
              <p className="text-base font-semibold">
                {formatCurrency(cashBalance.totalSales)}
              </p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-2">Change Given</p>
              <p className="text-base font-semibold">
                {formatCurrency(cashBalance.changeGiven)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Management Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cash In */}
        <Dialog open={showCashIn} onOpenChange={setShowCashIn}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-20 flex flex-col">
              <TrendingUp className="h-6 w-6 mb-2 text-green-600" />
              Cash In
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Cash In</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cashInAmount">Amount (KES)</Label>
                <Input
                  id="cashInAmount"
                  type="number"
                  value={cashInAmount}
                  onChange={(e) => setCashInAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="cashInDescription">Description</Label>
                <Textarea
                  id="cashInDescription"
                  value={cashInDescription}
                  onChange={(e) => setCashInDescription(e.target.value)}
                  placeholder="e.g., Bank deposit, Customer payment"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCashIn(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCashIn} disabled={loading}>
                  {loading ? 'Recording...' : 'Record Cash In'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Cash Out */}
        <Dialog open={showCashOut} onOpenChange={setShowCashOut}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-20 flex flex-col">
              <TrendingDown className="h-6 w-6 mb-2 text-red-600" />
              Cash Out
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Cash Out</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cashOutAmount">Amount (KES)</Label>
                <Input
                  id="cashOutAmount"
                  type="number"
                  value={cashOutAmount}
                  onChange={(e) => setCashOutAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="cashOutDescription">Description</Label>
                <Textarea
                  id="cashOutDescription"
                  value={cashOutDescription}
                  onChange={(e) => setCashOutDescription(e.target.value)}
                  placeholder="e.g., Petty cash for supplies, Change for customer"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCashOut(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCashOut} disabled={loading}>
                  {loading ? 'Recording...' : 'Record Cash Out'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reconciliation */}
        <Dialog open={showReconciliation} onOpenChange={setShowReconciliation}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-20 flex flex-col">
              <Calculator className="h-6 w-6 mb-2 text-blue-600" />
              Reconcile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cash Reconciliation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Expected Till Balance</h4>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(cashBalance.realTimeBalance)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Float + Cash In - Cash Out = {formatCurrency(cashBalance.float)} + {formatCurrency(cashBalance.cashIn)} - {formatCurrency(cashBalance.cashOut)}
                </p>
              </div>
              <div>
                <Label htmlFor="declaredAmount">Actual Till Count (KES)</Label>
                <Input
                  id="declaredAmount"
                  type="number"
                  value={reconciliationAmount}
                  onChange={(e) => setReconciliationAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {reconciliationAmount && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Difference</h4>
                  <p className={`text-lg font-bold ${
                    parseFloat(reconciliationAmount) - cashBalance.realTimeBalance === 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(parseFloat(reconciliationAmount) - cashBalance.realTimeBalance)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {parseFloat(reconciliationAmount) - cashBalance.realTimeBalance === 0 
                      ? 'Perfect balance!' 
                      : parseFloat(reconciliationAmount) - cashBalance.realTimeBalance > 0 
                        ? 'Over by this amount' 
                        : 'Short by this amount'
                    }
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowReconciliation(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReconciliation} disabled={loading}>
                  {loading ? 'Recording...' : 'Complete Reconciliation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Formula Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Real-Time Balance Formula</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center bg-muted p-4 rounded-lg">
            <p className="text-sm font-mono">
              Real-Time Balance = Float + Cash In - Cash Out
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(cashBalance.float)} + {formatCurrency(cashBalance.cashIn)} - {formatCurrency(cashBalance.cashOut)} = {formatCurrency(cashBalance.realTimeBalance)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live Transaction Feed */}
      <CashTransactionFeed transactions={transactions} isLoading={loading} />
    </div>
  );
};