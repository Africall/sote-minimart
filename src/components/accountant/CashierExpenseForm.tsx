import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarRange, Wallet, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const expenseCategories = [
  'Supplies',
  'Utilities',
  'Rent',
  'Transportation',
  'Food & Beverages',
  'Maintenance',
  'Marketing',
  'Office Expenses',
  'Miscellaneous'
];

export const CashierExpenseForm: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to add expenses');
      return;
    }

    if (!formData.title || !formData.category || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('expenses')
        .insert({
          title: formData.title,
          category: formData.category,
          amount: amount,
          description: formData.description || null,
          expense_date: formData.expense_date,
          recorded_by: user.id
        });

      if (error) throw error;

      toast.success('Expense added successfully');
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
      });
      
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Receipt className="mr-2 h-5 w-5 text-primary" />
          Add Business Expense
        </CardTitle>
        <CardDescription>
          Record daily business expenses (supplies, utilities, transportation, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Expense Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Office supplies purchase"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES) *</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-10"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expense_date">Expense Date *</Label>
              <div className="relative">
                <CalendarRange className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expense_date"
                  type="date"
                  className="pl-10"
                  value={formData.expense_date}
                  onChange={(e) => handleInputChange('expense_date', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional details about the expense..."
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setFormData({
                title: '',
                category: '',
                amount: '',
                description: '',
                expense_date: new Date().toISOString().split('T')[0]
              })}
              disabled={loading}
            >
              Clear Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};