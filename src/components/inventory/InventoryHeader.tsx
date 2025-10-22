
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileDown, Plus } from 'lucide-react';

interface InventoryHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  onAddProduct: () => void;
}

export const InventoryHeader = ({ 
  searchQuery, 
  onSearchChange, 
  onExport, 
  onAddProduct 
}: InventoryHeaderProps) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Search input changed:', value);
    onSearchChange(value);
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8 w-64"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <Button onClick={onExport} variant="outline">
          <FileDown className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button onClick={onAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
    </div>
  );
};
