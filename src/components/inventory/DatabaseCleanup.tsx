
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Loader2, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CleanupResult {
  total: number;
  fixed: number;
  errors: number;
  details: Array<{
    id: string;
    name: string;
    originalUrl: string;
    fixedUrl?: string;
    error?: string;
  }>;
}

export const DatabaseCleanup: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [scanResults, setScanResults] = useState<CleanupResult | null>(null);
  const [fixResults, setFixResults] = useState<CleanupResult | null>(null);
  const [progress, setProgress] = useState(0);

  const scanForMalformedUrls = async () => {
    setScanning(true);
    setProgress(0);
    
    try {
      console.log('DatabaseCleanup: Starting URL scan...');
      
      // Get all products with image URLs
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, image_url')
        .not('image_url', 'is', null);

      if (error) throw error;

      console.log(`DatabaseCleanup: Found ${products.length} products with images`);

      const results: CleanupResult = {
        total: products.length,
        fixed: 0,
        errors: 0,
        details: []
      };

      let processed = 0;

      for (const product of products) {
        processed++;
        setProgress((processed / products.length) * 100);

        if (product.image_url?.includes('product-images/product-images/')) {
          console.log(`DatabaseCleanup: Found malformed URL for ${product.name}:`, product.image_url);
          
          results.details.push({
            id: product.id,
            name: product.name,
            originalUrl: product.image_url,
            fixedUrl: product.image_url.replace('product-images/product-images/', 'product-images/')
          });
        }
      }

      results.fixed = results.details.length;
      setScanResults(results);
      
      console.log('DatabaseCleanup: Scan complete:', results);
      toast.success(`Scan complete: Found ${results.fixed} URLs to fix`);
      
    } catch (error) {
      console.error('DatabaseCleanup: Scan error:', error);
      toast.error('Failed to scan database');
    } finally {
      setScanning(false);
      setProgress(0);
    }
  };

  const fixMalformedUrls = async () => {
    if (!scanResults?.details.length) return;

    setFixing(true);
    setProgress(0);

    const results: CleanupResult = {
      total: scanResults.details.length,
      fixed: 0,
      errors: 0,
      details: []
    };

    try {
      console.log('DatabaseCleanup: Starting URL fixes...');

      let processed = 0;

      for (const item of scanResults.details) {
        processed++;
        setProgress((processed / scanResults.details.length) * 100);

        try {
          const { error } = await supabase
            .from('products')
            .update({ image_url: item.fixedUrl })
            .eq('id', item.id);

          if (error) throw error;

          results.fixed++;
          results.details.push({
            ...item,
            error: undefined
          });

          console.log(`DatabaseCleanup: Fixed URL for ${item.name}`);

        } catch (error) {
          results.errors++;
          results.details.push({
            ...item,
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          console.error(`DatabaseCleanup: Failed to fix ${item.name}:`, error);
        }
      }

      setFixResults(results);
      console.log('DatabaseCleanup: Fix complete:', results);
      toast.success(`Fixed ${results.fixed} URLs, ${results.errors} errors`);

    } catch (error) {
      console.error('DatabaseCleanup: Fix error:', error);
      toast.error('Failed to fix URLs');
    } finally {
      setFixing(false);
      setProgress(0);
    }
  };

  const resetResults = () => {
    setScanResults(null);
    setFixResults(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database URL Cleanup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={scanForMalformedUrls} 
            disabled={scanning || fixing}
            variant="outline"
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              'Scan for Issues'
            )}
          </Button>
          
          {scanResults && scanResults.fixed > 0 && (
            <Button 
              onClick={fixMalformedUrls} 
              disabled={scanning || fixing}
              variant="default"
            >
              {fixing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                `Fix ${scanResults.fixed} URLs`
              )}
            </Button>
          )}
          
          {(scanResults || fixResults) && (
            <Button onClick={resetResults} variant="outline" size="sm">
              Clear Results
            </Button>
          )}
        </div>

        {(scanning || fixing) && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {scanResults && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Scan Results</h3>
              <Badge variant={scanResults.fixed > 0 ? 'destructive' : 'default'}>
                {scanResults.fixed} issues found
              </Badge>
            </div>
            
            {scanResults.fixed === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>No malformed URLs found!</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {scanResults.details.map((item, idx) => (
                  <div key={idx} className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-600 break-all">
                          <strong>Current:</strong> {item.originalUrl}
                        </p>
                        <p className="text-xs text-green-600 break-all">
                          <strong>Fixed:</strong> {item.fixedUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {fixResults && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Fix Results</h3>
              <Badge variant="default">
                {fixResults.fixed} fixed
              </Badge>
              {fixResults.errors > 0 && (
                <Badge variant="destructive">
                  {fixResults.errors} errors
                </Badge>
              )}
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {fixResults.details.map((item, idx) => (
                <div key={idx} className={`p-3 rounded border-l-4 ${
                  item.error ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'
                }`}>
                  <div className="flex items-start gap-2">
                    {item.error ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.name}</p>
                      {item.error ? (
                        <p className="text-xs text-red-600">Error: {item.error}</p>
                      ) : (
                        <p className="text-xs text-green-600">✓ URL fixed successfully</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
