
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getProductsNeedingReorder, DatabaseProduct } from '../types/product';
import { useNavigate } from 'react-router-dom';

const ReorderAlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [lowStockProducts, setLowStockProducts] = React.useState<DatabaseProduct[]>([]);
 

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const products = await getProductsNeedingReorder();
        setLowStockProducts(products);
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      }
    };

    fetchLowStockProducts();
  },[]);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reorder Alerts</h1>
        <p className="text-muted-foreground">
          Products that need to be restocked
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="flex-1">
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              Low Stock Items
            </CardTitle>
            <CardDescription>
              {lowStockProducts.length} items are currently below their reorder levels
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate('/inventory/restock')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Restock Items
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Current Qty</TableHead>
                <TableHead>Reorder Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                    </TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>{product.reorder_level}</TableCell>
                    <TableCell>
                      {product.stock_quantity === 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                          <AlertTriangle className="mr-1 h-3 w-3" /> Low
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/inventory/restock')}
                      >
                        Restock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <p className="text-muted-foreground">No items are below reorder levels</p>
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

export default ReorderAlertsPage;
