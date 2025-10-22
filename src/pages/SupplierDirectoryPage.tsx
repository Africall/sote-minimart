import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Phone, Package } from 'lucide-react';
import { getFormattedDate } from '../utils/inventoryUtils';
import { toast } from 'sonner';
import { getSuppliers, createSupplier, Supplier } from '@/utils/supabaseUtils';

interface SupplierFormValues {
  name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
}

const SupplierDirectoryPage: React.FC = () => {
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  const form = useForm<SupplierFormValues>({
    defaultValues: {
      name: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      address: '',
    }
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      toast.error('Failed to load suppliers');
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const onSubmit = async (data: SupplierFormValues) => {
    try {
      await createSupplier(data);
      toast.success(`Supplier ${data.name} added successfully!`);
      setIsAddSupplierOpen(false);
      form.reset();
      loadSuppliers(); // Reload the suppliers list
    } catch (error) {
      toast.error('Failed to add supplier');
      console.error('Error adding supplier:', error);
    }
  };

  const filteredSuppliers = searchTerm 
    ? suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact_phone?.includes(searchTerm) ||
        supplier.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : suppliers;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Directory</h1>
          <p className="text-muted-foreground">
            Manage your product suppliers and their information
          </p>
        </div>
        <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Enter the supplier details below.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Suppliers ({filteredSuppliers.length})</span>
            <div className="w-64">
              <Input 
                placeholder="Search suppliers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardTitle>
          <CardDescription>
            Manage your product suppliers and their contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">Loading suppliers...</div>
                  </TableCell>
                </TableRow>
              ) : filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      {supplier.name}
                      {supplier.contact_name && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Contact: {supplier.contact_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.contact_phone && (
                        <div className="flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          <span>{supplier.contact_phone}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.contact_email || (
                        <span className="text-muted-foreground text-sm">No email</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.address || (
                        <span className="text-muted-foreground text-sm">No address</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {searchTerm ? (
                      <div className="text-muted-foreground">
                        No suppliers matching "{searchTerm}"
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        No suppliers found. Add your first supplier to get started.
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierDirectoryPage;
