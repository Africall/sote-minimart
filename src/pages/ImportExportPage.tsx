
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUp, FileDown, Database, Upload, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
// Update the import path if the file is located elsewhere, for example:
// Update the import path to match your actual supabase client location
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';

interface ImportResult {
  success: number;
  errors: Array<{ row: number; message: string }>;
}

const ImportExportPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<ImportResult | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setImportStatus(null);
    }
  };

  const validateProduct = (product: any, rowIndex: number): string[] => {
    const errors: string[] = [];
    
    if (!product.name || product.name.trim() === '') {
      errors.push('Product name is required');
    }
    
    if (!product.category || product.category.trim() === '') {
      errors.push('Category is required');
    }
    
    if (!product.cost || isNaN(Number(product.cost)) || Number(product.cost) <= 0) {
      errors.push('Valid cost price is required');
    }
    
    if (!product.price || isNaN(Number(product.price)) || Number(product.price) <= 0) {
      errors.push('Valid retail price is required');
    }
    
    if (product.stock_quantity && isNaN(Number(product.stock_quantity))) {
      errors.push('Stock quantity must be a valid number');
    }
    
    return errors;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to import products');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const errors: Array<{ row: number; message: string }> = [];
          const successfulImports: any[] = [];
          
          for (let i = 0; i < results.data.length; i++) {
            const rowData = results.data[i] as any;
            const rowIndex = i + 2; // +2 because CSV rows start at 1 and we have a header
            
            // Map CSV columns to database columns
            const product = {
              name: rowData['Product Name'] || rowData['name'],
              category: rowData['Category'] || rowData['category'],
              cost: rowData['Cost Price'] || rowData['cost'],
              price: rowData['Retail Price'] || rowData['price'],
              stock_quantity: Number(rowData['Quantity'] || rowData['stock_quantity']) || 0,
              reorder_level: Number(rowData['Reorder Level'] || rowData['reorder_level']) || 10,
              expiry_date: rowData['Expiry Date'] || rowData['expiry_date'] || null,
              barcode: rowData['Barcode'] || rowData['barcode'] ? [rowData['Barcode'] || rowData['barcode']] : null,
              description: rowData['Description'] || rowData['description'] || null,
              is_featured: false
            };

            // Validate product data
            const validationErrors = validateProduct(product, rowIndex);
            
            if (validationErrors.length > 0) {
              errors.push({
                row: rowIndex,
                message: validationErrors.join(', ')
              });
              continue;
            }

            try {
              // Insert product into database
              const { error } = await supabase
                .from('products')
                .insert([{
                  name: product.name.trim(),
                  category: product.category.trim(),
                  cost: Number(product.cost),
                  price: Number(product.price),
                  stock_quantity: product.stock_quantity,
                  reorder_level: product.reorder_level,
                  expiry_date: product.expiry_date,
                  barcode: product.barcode,
                  description: product.description,
                  is_featured: product.is_featured
                }]);

              if (error) {
                errors.push({
                  row: rowIndex,
                  message: `Database error: ${error.message}`
                });
              } else {
                successfulImports.push(product);
              }
            } catch (err) {
              errors.push({
                row: rowIndex,
                message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`
              });
            }

            // Update progress
            setUploadProgress(Math.round(((i + 1) / results.data.length) * 100));
          }

          setImportStatus({
            success: successfulImports.length,
            errors
          });

          if (successfulImports.length > 0) {
            toast.success(`Successfully imported ${successfulImports.length} products`);
          }
          
          if (errors.length > 0) {
            toast.error(`${errors.length} products failed to import`);
          }
          
          setIsUploading(false);
        },
        error: (error) => {
          toast.error(`Failed to parse CSV: ${error.message}`);
          setIsUploading(false);
        }
      });
    } catch (error) {
      toast.error('Failed to process file');
      setIsUploading(false);
    }
  };
  
  const handleExport = (format: string) => {
    toast.success(`Exporting inventory data in ${format.toUpperCase()} format`);
    
    // In a real app, this would trigger a file download
    setTimeout(() => {
      toast.success(`${format.toUpperCase()} file generated successfully`);
    }, 1000);
  };
  
  const handleDownloadTemplate = () => {
    const csvContent = `Product Name,Category,Cost Price,Retail Price,Quantity,Reorder Level,Expiry Date,Barcode,Description
Coca Cola 500ml,beverages,45,55,100,20,2024-12-31,1234567890123,Refreshing cola drink
Bread White,dry-food,25,35,50,15,,,"Fresh white bread"
Washing Powder 1kg,cleaning,120,150,30,10,,,Laundry detergent`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template downloaded successfully');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import & Export</h1>
        <p className="text-muted-foreground">
          Bulk import and export inventory data
        </p>
      </div>
      
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="import">
            <FileUp className="mr-2 h-4 w-4" />
            Import Data
          </TabsTrigger>
          <TabsTrigger value="export">
            <FileDown className="mr-2 h-4 w-4" />
            Export Data
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Inventory Data</CardTitle>
              <CardDescription>
                Upload a CSV file to bulk update your inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-2">Required Fields</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                  <div className="bg-muted rounded-md p-2">Product Name</div>
                  <div className="bg-muted rounded-md p-2">Category</div>
                  <div className="bg-muted rounded-md p-2">Quantity</div>
                  <div className="bg-muted rounded-md p-2">Cost Price</div>
                  <div className="bg-muted rounded-md p-2">Retail Price</div>
                  <div className="bg-muted rounded-md p-2">VAT Rate</div>
                  <div className="bg-muted rounded-md p-2">UOM</div>
                  <div className="bg-muted rounded-md p-2">Supplier</div>
                  <div className="bg-muted rounded-md p-2">Expiry Date</div>
                  <div className="bg-muted rounded-md p-2">Barcode (optional)</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadTemplate}
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
              
              {selectedFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Selected File:</p>
                      <p className="text-sm text-muted-foreground">{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</p>
                    </div>
                    <Button 
                      onClick={handleUpload} 
                      disabled={isUploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? 'Processing...' : 'Upload File'}
                    </Button>
                  </div>
                  
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing products...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                </div>
              )}
              
              {importStatus && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import Results</AlertTitle>
                  <AlertDescription>
                    <p className="text-green-500">{importStatus.success} items successfully uploaded.</p>
                    {importStatus.errors && importStatus.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-red-500">{importStatus.errors.length} errors found:</p>
                        <ul className="list-disc pl-5 mt-1 text-sm">
                          {importStatus.errors.map((error, index) => (
                            <li key={index}>
                              Row {error.row}: {error.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Inventory Data</CardTitle>
              <CardDescription>
                Export your inventory data in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <Database className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-lg font-medium">Full Inventory</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Export all inventory items with complete details
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleExport('csv')}>CSV</Button>
                      <Button size="sm" onClick={() => handleExport('excel')}>Excel</Button>
                      <Button size="sm" onClick={() => handleExport('pdf')}>PDF</Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <AlertCircle className="h-10 w-10 text-orange-500 mb-4" />
                    <h3 className="text-lg font-medium">Low Stock Items</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Export only items below reorder level
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleExport('csv')}>CSV</Button>
                      <Button size="sm" onClick={() => handleExport('excel')}>Excel</Button>
                      <Button size="sm" onClick={() => handleExport('pdf')}>PDF</Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <FileDown className="h-10 w-10 text-blue-500 mb-4" />
                    <h3 className="text-lg font-medium">Expiry Report</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Export items with upcoming expiry dates
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleExport('csv')}>CSV</Button>
                      <Button size="sm" onClick={() => handleExport('excel')}>Excel</Button>
                      <Button size="sm" onClick={() => handleExport('pdf')}>PDF</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportExportPage;
