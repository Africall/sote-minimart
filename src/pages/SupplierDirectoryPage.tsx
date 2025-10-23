import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Phone } from "lucide-react";
import { toast } from "sonner";
import { getSuppliers, createSupplier, Supplier } from "@/utils/supabaseUtils";

interface SupplierFormValues {
  name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
}

const SupplierDirectoryPage: React.FC = () => {
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<SupplierFormValues>({
    defaultValues: {
      name: "",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      address: "",
    },
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      toast.error("Failed to load suppliers");
      console.error("Error loading suppliers:", error);
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
      loadSuppliers();
    } catch (error) {
      toast.error("Failed to add supplier");
      console.error("Error adding supplier:", error);
    }
  };

  const filteredSuppliers = searchTerm
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.contact_phone?.includes(searchTerm) ||
          s.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : suppliers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7FAFF] via-[#EEF3FF] to-[#E8EEFF] p-4 md:p-8 animate-slide-up">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-6 shadow-md mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Supplier Directory
          </h1>
          <p className="text-sm opacity-90">
            Manage your product suppliers and their information
          </p>
        </div>
        <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="lg" className="hover-scale">
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Enter supplier details below.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 mt-4"
              >
                {[
                  { name: "name", label: "Supplier Name*" },
                  { name: "contact_name", label: "Contact Person (optional)" },
                  { name: "contact_phone", label: "Phone (optional)" },
                  {
                    name: "contact_email",
                    label: "Email (optional)",
                    type: "email",
                  },
                  { name: "address", label: "Address (optional)" },
                ].map(({ name, label, type }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof SupplierFormValues}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input
                            type={type || "text"}
                            {...field}
                            className="focus-visible:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={loading}
                    variant="gradient"
                    className="hover-scale"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Supplier Table */}
      <Card variant="elevated" className="hover-lift">
        <CardHeader>
          <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <span className="text-lg font-semibold text-gray-800">
              Suppliers ({filteredSuppliers.length})
            </span>
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 focus-visible:ring-blue-500"
            />
          </CardTitle>
          <CardDescription>
            View, search, and manage supplier contact details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-blue-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
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
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading suppliers…
                    </TableCell>
                  </TableRow>
                ) : filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier) => (
                    <TableRow
                      key={supplier.id}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {supplier.name}
                        {supplier.contact_name && (
                          <div className="text-xs text-gray-500 mt-1">
                            Contact: {supplier.contact_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.contact_phone && (
                          <div className="flex items-center text-gray-700">
                            <Phone className="h-3.5 w-3.5 mr-1 text-blue-500" />
                            {supplier.contact_phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {supplier.contact_email || (
                          <span className="text-gray-400 text-sm">
                            No email
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {supplier.address || (
                          <span className="text-gray-400 text-sm">
                            No address
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-gray-500"
                    >
                      {searchTerm ? (
                        <>No suppliers matching "{searchTerm}"</>
                      ) : (
                        <>No suppliers found. Add your first supplier to start.</>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierDirectoryPage;
