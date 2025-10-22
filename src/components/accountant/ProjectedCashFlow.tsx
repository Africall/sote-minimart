import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer, Legend } from 'recharts';
import { CalendarDays, Download, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export const ProjectedCashFlow: React.FC = () => {
  // Mock data for cash flow projection (next 30 days)
  const cashFlowData = [{
    date: 'May 23',
    inflow: 25000,
    outflow: 12000,
    balance: 13000
  }, {
    date: 'May 24',
    inflow: 18000,
    outflow: 8000,
    balance: 23000
  }, {
    date: 'May 25',
    inflow: 22000,
    outflow: 15000,
    balance: 30000
  }, {
    date: 'May 26',
    inflow: 20000,
    outflow: 7500,
    balance: 42500
  }, {
    date: 'May 27',
    inflow: 15000,
    outflow: 5000,
    balance: 52500
  }, {
    date: 'May 28',
    inflow: 10000,
    outflow: 3000,
    balance: 59500
  }, {
    date: 'May 29',
    inflow: 18000,
    outflow: 11000,
    balance: 66500
  }, {
    date: 'May 30',
    inflow: 21000,
    outflow: 12000,
    balance: 75500
  }, {
    date: 'May 31',
    inflow: 28000,
    outflow: 35000,
    balance: 68500
  }, {
    date: 'Jun 1',
    inflow: 22000,
    outflow: 9000,
    balance: 81500
  }, {
    date: 'Jun 2',
    inflow: 20000,
    outflow: 8000,
    balance: 93500
  }, {
    date: 'Jun 3',
    inflow: 15000,
    outflow: 6000,
    balance: 102500
  }, {
    date: 'Jun 4',
    inflow: 12000,
    outflow: 4000,
    balance: 110500
  }, {
    date: 'Jun 5',
    inflow: 19000,
    outflow: 7000,
    balance: 122500
  }, {
    date: 'Jun 6',
    inflow: 23000,
    outflow: 11000,
    balance: 134500
  }, {
    date: 'Jun 7',
    inflow: 25000,
    outflow: 13000,
    balance: 146500
  }, {
    date: 'Jun 8',
    inflow: 20000,
    outflow: 9000,
    balance: 157500
  }, {
    date: 'Jun 9',
    inflow: 21000,
    outflow: 8000,
    balance: 170500
  }, {
    date: 'Jun 10',
    inflow: 19000,
    outflow: 7000,
    balance: 182500
  }, {
    date: 'Jun 11',
    inflow: 17000,
    outflow: 45000,
    balance: 154500
  }, {
    date: 'Jun 12',
    inflow: 22000,
    outflow: 9000,
    balance: 167500
  }, {
    date: 'Jun 13',
    inflow: 24000,
    outflow: 10000,
    balance: 181500
  }, {
    date: 'Jun 14',
    inflow: 26000,
    outflow: 11000,
    balance: 196500
  }, {
    date: 'Jun 15',
    inflow: 32000,
    outflow: 40000,
    balance: 188500
  }, {
    date: 'Jun 16',
    inflow: 23000,
    outflow: 10000,
    balance: 201500
  }, {
    date: 'Jun 17',
    inflow: 21000,
    outflow: 9000,
    balance: 213500
  }, {
    date: 'Jun 18',
    inflow: 19000,
    outflow: 8000,
    balance: 224500
  }, {
    date: 'Jun 19',
    inflow: 24000,
    outflow: 11000,
    balance: 237500
  }, {
    date: 'Jun 20',
    inflow: 26000,
    outflow: 12000,
    balance: 251500
  }, {
    date: 'Jun 21',
    inflow: 28000,
    outflow: 13000,
    balance: 266500
  }];

  // Upcoming large expenses
  const upcomingExpenses = [{
    date: 'May 31',
    description: 'Supplier Payment - Nairobi Distributors',
    amount: 35000
  }, {
    date: 'Jun 11',
    description: 'Supplier Payment - Excellent Foods Limited',
    amount: 45000
  }, {
    date: 'Jun 15',
    description: 'Monthly Rent',
    amount: 40000
  }, {
    date: 'Jun 30',
    description: 'Staff Salaries',
    amount: 120000
  }];

  // Calculate summary statistics
  const totalInflow = cashFlowData.reduce((sum, day) => sum + day.inflow, 0);
  const totalOutflow = cashFlowData.reduce((sum, day) => sum + day.outflow, 0);
  const netCashFlow = totalInflow - totalOutflow;
  const lowestBalance = Math.min(...cashFlowData.map(day => day.balance));
  return <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-primary" />
            Projected Cash Flow
            <span className="ml-2 text-sm font-medium text-muted-foreground">(Next 30 Days)</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select defaultValue="30days">
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Next 7 Days</SelectItem>
                <SelectItem value="14days">Next 14 Days</SelectItem>
                <SelectItem value="30days">Next 30 Days</SelectItem>
                <SelectItem value="90days">Next 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Forecasted cash inflows and outflows for the next 30 days
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Total Inflow</p>
            <p className="text-2xl font-bold text-green-600">KES {totalInflow.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Total Outflow</p>
            <p className="text-2xl font-bold text-red-600">KES {totalOutflow.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Net Cash Flow</p>
            <div className="flex items-center">
              {netCashFlow >= 0 ? <TrendingUp className="h-5 w-5 mr-1 text-green-600" /> : <TrendingDown className="h-5 w-5 mr-1 text-red-600" />}
              <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                KES {Math.abs(netCashFlow).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Lowest Balance</p>
            <p className="text-2xl font-bold">KES {lowestBalance.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="border rounded-md p-3 bg-white">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 5
            }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{
                fontSize: 10
              }} />
                <YAxis tick={{
                fontSize: 10
              }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="inflow" name="Cash In" fill="#22c55e" />
                <Bar dataKey="outflow" name="Cash Out" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          
          
          <div className="space-y-2">
            {upcomingExpenses.map((expense, index) => (
              <div key={index}></div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>;
};