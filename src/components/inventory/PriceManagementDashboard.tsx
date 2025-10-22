
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  Wallet, 
  CheckCircle, 
  TrendingUp,
  Play,
  Eye,
  Wand2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/utils/supabaseUtils';

interface PriceOverview {
  metric: string;
  value: string;
  description: string;
}

interface CategoryAnalysis {
  category: string;
  total_products: number;
  zero_price_count: number;
  valid_price_count: number;
  zero_price_percentage: number;
  avg_valid_price: number;
  min_valid_price: number;
  max_price: number;
  suggested_category_price: number;
}

interface BulkUpdateResult {
  product_id: string;
  product_name: string;
  category: string;
  old_price: number;
  new_price: number;
  update_reason: string;
  action_taken: string;
}

interface TemplateResult {
  affected_products: number;
  template_price: number;
}

export const PriceManagementDashboard = () => {
  const { toast } = useToast();
  const [overview, setOverview] = useState<PriceOverview[]>([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);
  const [bulkResults, setBulkResults] = useState<BulkUpdateResult[]>([]);
  const [templateResults, setTemplateResults] = useState<TemplateResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [templateCategory, setTemplateCategory] = useState<string>('');
  const [basePrice, setBasePrice] = useState<string>('');
  const [markupPercentage, setMarkupPercentage] = useState<string>('50');

  const fetchOverview = async () => {
    try {
      const { data, error } = await supabase.from('price_management_overview').select('*');
      if (error) throw error;
      setOverview(data || []);
    } catch (error) {
      console.error('Error fetching price overview:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch price overview',
        variant: 'destructive'
      });
    }
  };

  const fetchCategoryAnalysis = async () => {
    try {
      const { data, error } = await supabase.rpc('get_detailed_price_analysis');
      if (error) throw error;
      setCategoryAnalysis(data || []);
    } catch (error) {
      console.error('Error fetching category analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch category analysis',
        variant: 'destructive'
      });
    }
  };

  const handleBulkUpdate = async (dryRun: boolean = true) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('bulk_update_zero_prices', {
        target_category: selectedCategory || null,
        dry_run: dryRun
      });
      
      if (error) throw error;
      setBulkResults(data || []);
      
      if (!dryRun) {
        toast({
          title: 'Success',
          description: `Updated ${data?.length || 0} products with new prices`,
        });
        // Refresh data after actual updates
        await Promise.all([fetchOverview(), fetchCategoryAnalysis()]);
      } else {
        toast({
          title: 'Preview Complete',
          description: `Found ${data?.length || 0} products that would be updated`,
        });
      }
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast({
        title: 'Error',
        description: 'Failed to update prices',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateCategory || !basePrice) {
      toast({
        title: 'Error',
        description: 'Please fill in all template fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_pricing_template', {
        category_name: templateCategory,
        base_price: parseFloat(basePrice),
        markup_percentage: parseFloat(markupPercentage)
      });
      
      if (error) throw error;
      
      const result = data?.[0];
      if (result) {
        setTemplateResults(result);
        toast({
          title: 'Template Applied',
          description: `Updated ${result.affected_products} products to ${formatCurrency(result.template_price)}`,
        });
        // Refresh data
        await Promise.all([fetchOverview(), fetchCategoryAnalysis()]);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply pricing template',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchOverview(), fetchCategoryAnalysis()]);
    };
    loadData();
  }, []);

  const getUniqueCategories = () => {
    return [...new Set(categoryAnalysis.map(item => item.category))];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Price Management Dashboard</h2>
          <p className="text-muted-foreground">
            Analyze and fix pricing issues across your inventory
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overview.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.metric}</CardTitle>
              {item.metric.includes('Zero') ? (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              ) : item.metric.includes('Valid') ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Wallet className="h-4 w-4 text-blue-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analysis">Category Analysis</TabsTrigger>
          <TabsTrigger value="bulk-update">Bulk Price Update</TabsTrigger>
          <TabsTrigger value="templates">Pricing Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Pricing Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Total Products</th>
                      <th className="text-left p-2">Zero Price Count</th>
                      <th className="text-left p-2">Zero Price %</th>
                      <th className="text-left p-2">Avg Valid Price</th>
                      <th className="text-left p-2">Suggested Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryAnalysis.map((category, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{category.category}</td>
                        <td className="p-2">{category.total_products}</td>
                        <td className="p-2">
                          <Badge variant={category.zero_price_count > 0 ? 'destructive' : 'secondary'}>
                            {category.zero_price_count}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant={category.zero_price_percentage > 0 ? 'destructive' : 'secondary'}>
                            {category.zero_price_percentage}%
                          </Badge>
                        </td>
                        <td className="p-2">
                          {category.avg_valid_price ? formatCurrency(category.avg_valid_price) : 'N/A'}
                        </td>
                        <td className="p-2 font-semibold text-green-600">
                          {formatCurrency(category.suggested_category_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-update" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Price Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Category (Optional)</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {getUniqueCategories().map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end gap-2">
                  <Button 
                    onClick={() => handleBulkUpdate(true)}
                    disabled={loading}
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Changes
                  </Button>
                  
                  <Button 
                    onClick={() => handleBulkUpdate(false)}
                    disabled={loading || bulkResults.length === 0}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Apply Updates
                  </Button>
                </div>
              </div>

              {bulkResults.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {bulkResults[0]?.action_taken?.includes('dry run') 
                      ? `Preview: ${bulkResults.length} products would be updated`
                      : `Successfully updated ${bulkResults.length} products`
                    }
                  </AlertDescription>
                </Alert>
              )}

              {bulkResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Old Price</th>
                        <th className="text-left p-2">New Price</th>
                        <th className="text-left p-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResults.map((result, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{result.product_name}</td>
                          <td className="p-2">{result.category}</td>
                          <td className="p-2">{formatCurrency(result.old_price)}</td>
                          <td className="p-2 font-semibold text-green-600">
                            {formatCurrency(result.new_price)}
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">
                            {result.update_reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Pricing Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={templateCategory} onValueChange={setTemplateCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueCategories().map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Base Price (KES)</Label>
                  <Input
                    type="number"
                    placeholder="50.00"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Markup %</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={markupPercentage}
                    onChange={(e) => setMarkupPercentage(e.target.value)}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={handleCreateTemplate}
                    disabled={loading}
                    className="w-full"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Apply Template
                  </Button>
                </div>
              </div>

              {templateResults && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Template applied successfully! Updated {templateResults.affected_products} products 
                    to {formatCurrency(templateResults.template_price)} each.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
