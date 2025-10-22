
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { User, X } from 'lucide-react';

interface Customer {
  name: string;
  phone: string;
  loyaltyId: string;
}

interface CustomerPanelProps {
  customer: Customer;
  setCustomer: React.Dispatch<React.SetStateAction<Customer>>;
  setShowCustomerPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CustomerPanel: React.FC<CustomerPanelProps> = ({
  customer,
  setCustomer,
  setShowCustomerPanel,
}) => {
  return (
    <Card className="mt-3 bg-blue-50 border-blue-200">
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium flex items-center gap-1">
            <User size={14} />
            Customer Information
          </h3>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowCustomerPanel(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="customer-name" className="text-xs">Name</Label>
            <Input 
              id="customer-name"
              value={customer.name}
              onChange={(e) => setCustomer({...customer, name: e.target.value})}
              className="h-7 text-xs"
              placeholder="Customer name"
            />
          </div>
          <div>
            <Label htmlFor="customer-phone" className="text-xs">Phone</Label>
            <Input 
              id="customer-phone"
              value={customer.phone}
              onChange={(e) => setCustomer({...customer, phone: e.target.value})}
              className="h-7 text-xs"
              placeholder="Phone number"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="customer-loyalty" className="text-xs">Loyalty ID (Optional)</Label>
            <Input 
              id="customer-loyalty"
              value={customer.loyaltyId}
              onChange={(e) => setCustomer({...customer, loyaltyId: e.target.value})}
              className="h-7 text-xs"
              placeholder="Loyalty ID"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
