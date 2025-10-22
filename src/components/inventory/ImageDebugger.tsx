
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProductImage } from './ProductImage';

interface ImageTestResult {
  url: string;
  status: 'testing' | 'success' | 'error';
  httpStatus?: number;
  error?: string;
  responseTime?: number;
}

export const ImageDebugger: React.FC = () => {
  const [testUrl, setTestUrl] = useState('');
  const [testResults, setTestResults] = useState<ImageTestResult[]>([]);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);

  const testImageUrl = async (url: string) => {
    const startTime = Date.now();
    
    setTestResults(prev => [...prev, {
      url,
      status: 'testing'
    }]);

    try {
      const response = await fetch(url, { method: 'HEAD' });
      const responseTime = Date.now() - startTime;
      
      setTestResults(prev => prev.map(result => 
        result.url === url ? {
          ...result,
          status: response.ok ? 'success' : 'error',
          httpStatus: response.status,
          responseTime,
          error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`
        } : result
      ));
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      setTestResults(prev => prev.map(result => 
        result.url === url ? {
          ...result,
          status: 'error',
          responseTime,
          error: error instanceof Error ? error.message : 'Network error'
        } : result
      ));
    }
  };

  const testStorageBucket = async () => {
    setLoadingStorage(true);
    try {
      // Test bucket access
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) throw bucketsError;

      // Get product-images bucket info
      const productImagesBucket = buckets.find(b => b.id === 'product-images');
      
      // List some files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('product-images')
        .list('', { limit: 10 });

      if (filesError) throw filesError;

      // Test a public URL
      const testPath = files?.[0]?.name || 'test.jpg';
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(testPath);

      setStorageInfo({
        buckets: buckets.length,
        productImagesBucket,
        filesCount: files?.length || 0,
        sampleFiles: files?.slice(0, 5) || [],
        testPublicUrl: publicUrl
      });

      // Auto-test the public URL if a file exists
      if (files?.[0]) {
        testImageUrl(publicUrl);
      }

    } catch (error) {
      console.error('Storage test error:', error);
      setStorageInfo({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoadingStorage(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setStorageInfo(null);
  };

  const handleTestUrl = () => {
    if (testUrl.trim()) {
      testImageUrl(testUrl.trim());
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Image Debug Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Tester */}
        <div className="space-y-2">
          <h3 className="font-medium">Test Image URL</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter image URL to test..."
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestUrl()}
            />
            <Button onClick={handleTestUrl} disabled={!testUrl.trim()}>
              Test URL
            </Button>
          </div>
        </div>

        {/* Storage Bucket Tester */}
        <div className="space-y-2">
          <h3 className="font-medium">Storage Bucket Info</h3>
          <Button 
            onClick={testStorageBucket} 
            disabled={loadingStorage}
            variant="outline"
          >
            {loadingStorage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Storage
              </>
            )}
          </Button>
          
          {storageInfo && (
            <div className="bg-gray-50 p-4 rounded space-y-2">
              {storageInfo.error ? (
                <p className="text-red-600">Error: {storageInfo.error}</p>
              ) : (
                <>
                  <p><strong>Buckets:</strong> {storageInfo.buckets}</p>
                  <p><strong>Product Images Bucket:</strong> {storageInfo.productImagesBucket ? '✓ Found' : '✗ Not found'}</p>
                  <p><strong>Files in bucket:</strong> {storageInfo.filesCount}</p>
                  {storageInfo.sampleFiles.length > 0 && (
                    <div>
                      <p><strong>Sample files:</strong></p>
                      <ul className="list-disc list-inside text-sm">
                        {storageInfo.sampleFiles.map((file: any, idx: number) => (
                          <li key={idx}>{file.name} ({file.metadata?.size || 'unknown size'})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {storageInfo.testPublicUrl && (
                    <p><strong>Test URL:</strong> <code className="text-xs bg-gray-200 px-1 rounded">{storageInfo.testPublicUrl}</code></p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Test Results</h3>
              <Button onClick={clearResults} variant="outline" size="sm">
                Clear Results
              </Button>
            </div>
            
            <div className="space-y-3">
              {testResults.map((result, idx) => (
                <div key={idx} className="border rounded p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {result.status === 'testing' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    {result.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {result.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    
                    <Badge variant={
                      result.status === 'success' ? 'default' : 
                      result.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {result.status}
                    </Badge>
                    
                    {result.httpStatus && (
                      <Badge variant="outline">
                        HTTP {result.httpStatus}
                      </Badge>
                    )}
                    
                    {result.responseTime && (
                      <Badge variant="outline">
                        {result.responseTime}ms
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm font-mono break-all bg-gray-50 p-2 rounded">
                    {result.url}
                  </p>
                  
                  {result.error && (
                    <p className="text-red-600 text-sm">
                      Error: {result.error}
                    </p>
                  )}
                  
                  {result.status === 'success' && (
                    <div className="space-y-2">
                      <Separator />
                      <p className="text-sm font-medium">Preview:</p>
                      <ProductImage 
                        src={result.url} 
                        alt="Test image" 
                        className="w-20 h-20 object-cover rounded border"
                        showDebugInfo={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
