
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getPaginatedProducts } from '@/utils/reportUtils';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TransferStockDialog } from '@/components/inventory/TransferStockDialog';

interface InventoryItem {
  'Product Name': string;
  Barcode: string;
  'Selling Price': number;
  Stock: string;
}

const InventoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const queryClient = useQueryClient();

  // Debounce search to reduce unnecessary queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use React Query for caching and optimized data fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory', currentPage, itemsPerPage, debouncedSearch],
    queryFn: async () => {
      const response = await getPaginatedProducts(
        { page: currentPage, limit: itemsPerPage },
        debouncedSearch
      );
      return response;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Memoize mapped inventory items to prevent unnecessary re-renders
  const inventoryItems = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((item) => ({
      'Product Name': item.name,
      Barcode: item.barcode,
      'Selling Price': item.price,
      Stock: item.stock_quantity?.toString() || '0',
    }));
  }, [data]);

  const totalItems = data?.count || 0;

  const pagination = usePagination({
    totalItems,
    itemsPerPage,
    initialPage: currentPage
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory.');
    }
  }, [error]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleTransferComplete = useCallback(() => {
    // Invalidate and refetch the inventory query
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    toast.success('Inventory refreshed');
  }, [queryClient]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and stock levels
          </p>
        </div>
        <Button onClick={() => setShowTransferDialog(true)} className="gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Transfer Stock
        </Button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name or barcode..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg text-primary">Loading inventory...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventoryItems.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {item['Product Name'] || 'No Name'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Barcode: {item.Barcode || 'N/A'}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Selling Price</p>
                          <p className="text-lg font-bold text-green-600">
                            KSh {item['Selling Price'] || '0'}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Stock</p>
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                            parseInt(item.Stock || '0') < 10
                              ? 'bg-red-100 text-red-800'
                              : parseInt(item.Stock || '0') < 20
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.Stock || '0'} units
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {inventoryItems.length === 0 && !isLoading && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  No inventory items found matching your criteria
                </div>
              )}
            </div>

            <DataTablePagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalItems / itemsPerPage)}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              startIndex={(currentPage - 1) * itemsPerPage + 1}
              endIndex={Math.min(currentPage * itemsPerPage, totalItems)}
            />
          </>
        )}
      </div>

      {/* Transfer Stock Dialog */}
      <TransferStockDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        onTransferComplete={handleTransferComplete}
      />
    </div>
  );
};

export default InventoryPage;
