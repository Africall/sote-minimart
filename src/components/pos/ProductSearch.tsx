
import React, { } from 'react';
import { Product } from '../../types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, Barcode, Loader2 } from 'lucide-react';
import { useProductSearch } from '@/lib/queries';
import { useCartActions } from '@/hooks/useCartActions';
import debounce from 'lodash/debounce';
import { useInView } from 'react-intersection-observer';

interface SearchPage {
  items: Product[];
  nextCursor?: string;
}

interface ProductSearchProps {
  products: Product[];
  formatCurrency: (amount: number) => string;
  quickItems: Product[];
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  barcodeInput: string;
  setBarcodeInput: React.Dispatch<React.SetStateAction<string>>;
  handleBarcodeInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  products,
  formatCurrency,
  quickItems,
  searchQuery,
  setSearchQuery,
  barcodeInput,
  setBarcodeInput,
  handleBarcodeInput,
}) => {
  const { addToCart } = useCartActions();

  // Use React Query for product search with infinite scrolling
  const {
    data,
    isLoading: isSearching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductSearch(searchQuery);

  // Intersection observer for infinite scrolling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
  });

  // Load more when the last item is in view
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Debounced search query update
  const debouncedSetSearchQuery = debounce((value: string) => {
    setSearchQuery(value);
  }, 100);

  // Flatten pages for rendering
  const searchResults = data?.pages.flatMap(page => (page as SearchPage).items) ?? [];

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    addToCart(product, quantity, { source: 'product-card' });
  };

  return (
    <div className="md:col-span-2 flex flex-col">
      {/* Barcode Scanner Input */}
      <div className="mb-4">
        <Label htmlFor="barcode-input" className="text-sm font-medium mb-1 flex items-center gap-1">
          <Barcode size={16} /> Scan Barcode
        </Label>
        <Input
          id="barcode-input"
          placeholder="Scan product barcode..."
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={handleBarcodeInput}
          className="text-lg font-mono"
          autoComplete="off"
        />
      </div>

      {/* Product Search */}
      <div className="space-y-4">
        <div className="relative">
          <Label htmlFor="search-input" className="text-sm font-medium mb-1 flex items-center gap-1">
            <Search size={16} /> Search Products
          </Label>
          <Input
            id="search-input"
            placeholder="Search by name, code, or category..."
            onChange={(e) => debouncedSetSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Access Buttons */}
        <div>
          <h3 className="text-sm font-medium mb-2">Quick Items</h3>
          <div className="grid grid-cols-4 gap-2">
            {quickItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center"
                onClick={() => handleAddToCart(item)}
              >
                <span className="text-sm">{item.name}</span>
                <span className="text-xs text-muted-foreground">{formatCurrency(item.sellingPrice)}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <div>
          <h3 className="text-sm font-medium mb-2">Products</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto h-[calc(100vh-450px)] pb-4">
            {isSearching ? (
              <div className="col-span-full flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery.length > 1 ? (
              searchResults.length > 0 ? (
                <>
                  {searchResults.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleAddToCart(product, 1)}
                    >
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                        <div className="mt-1 flex justify-between items-center">
                          <span className="text-sm font-bold">{formatCurrency(product.sellingPrice)}</span>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product, 1);
                          }} type='button'>
                            <Plus size={16} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {/* Loading indicator for infinite scroll */}
                  <div ref={loadMoreRef} className="col-span-full flex justify-center py-4">
                    {isFetchingNextPage ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : hasNextPage ? (
                      <span className="text-sm text-muted-foreground">Load more...</span>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="col-span-full flex items-center justify-center h-40 text-muted-foreground">
                  No products found
                </div>
              )
            ) : (
              <>
                <div className="col-span-full flex items-center justify-center h-40 text-muted-foreground"> Search for products</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
