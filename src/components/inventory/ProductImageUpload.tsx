
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ProductImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  showDebugInfo?: boolean;
  productId?: string; // Add product ID for better state tracking
  resetKey?: string; // Add reset key to force component reset
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  imageUrl,
  onImageChange,
  showDebugInfo = false,
  productId,
  resetKey
}) => {
  const [imagePreview, setImagePreview] = useState<string>(imageUrl);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  // Reset component state when resetKey or productId changes
  useEffect(() => {
    console.log('ProductImageUpload: Component reset triggered', {
      productId,
      resetKey,
      newImageUrl: imageUrl,
      previousPreview: imagePreview
    });
    
    setImagePreview(imageUrl);
    setTempUrl('');
    setUploadingImage(false);
  }, [resetKey, productId, imageUrl]);

  // Sync with parent imageUrl changes
  useEffect(() => {
    if (imageUrl !== imagePreview) {
      console.log('ProductImageUpload: Syncing with parent state', {
        parentImageUrl: imageUrl,
        currentPreview: imagePreview,
        productId
      });
      setImagePreview(imageUrl);
    }
  }, [imageUrl]);

  // Debug function to test storage bucket configuration
  const testStorageBucket = async () => {
    try {
      console.log('Testing storage bucket configuration...');
      
      // Test bucket access
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Storage buckets error:', bucketsError);
        return;
      }
      
      console.log('Available buckets:', buckets);
      
      // Test product-images bucket specifically
      const { data: files, error: filesError } = await supabase.storage
        .from('product-images')
        .list('', { limit: 1 });
      
      if (filesError) {
        console.error('Product-images bucket error:', filesError);
      } else {
        console.log('Product-images bucket accessible, sample files:', files);
      }
      
      // Test public URL generation
      const testPath = 'test-image.jpg';
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(testPath);
      
      console.log('Test public URL:', publicUrl);
      
    } catch (error) {
      console.error('Storage test error:', error);
    }
  };

  // Enhanced image upload with better path handling
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    
    try {
      // Create unique filename with proper extension
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Ensure clean file path (no double product-images)
      const filePath = fileName; // Just the filename, bucket is already 'product-images'

      console.log('ProductImageUpload: Starting upload:', {
        fileName,
        filePath,
        fileSize: file.size,
        fileType: file.type,
        productId
      });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('ProductImageUpload: Upload error:', error);
        throw error;
      }

      console.log('ProductImageUpload: Upload successful:', data);

      // Get public URL - this should be clean without double paths
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      console.log('ProductImageUpload: Generated public URL:', {
        url: publicUrl,
        productId
      });

      // Verify the URL is accessible
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        console.log('ProductImageUpload: URL accessibility test:', {
          url: publicUrl,
          status: response.status,
          accessible: response.ok,
          productId
        });
      } catch (urlError) {
        console.warn('ProductImageUpload: URL test failed (but continuing):', urlError);
      }

      setImagePreview(publicUrl);
      onImageChange(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('ProductImageUpload: Upload failed:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setTempUrl(url);
  };

  const applyImageUrl = () => {
    if (!tempUrl.trim()) return;
    
    // Validate URL format
    try {
      new URL(tempUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    
    console.log('ProductImageUpload: Applying manual URL:', {
      url: tempUrl,
      productId
    });
    
    setImagePreview(tempUrl);
    onImageChange(tempUrl);
    setTempUrl('');
    toast.success('Image URL applied successfully');
  };

  const removeImage = () => {
    console.log('ProductImageUpload: Removing image:', {
      currentPreview: imagePreview,
      productId
    });
    setImagePreview('');
    onImageChange('');
    setTempUrl('');
    toast.success('Image removed');
  };

  // Test storage on mount if debug is enabled
  useEffect(() => {
    if (showDebugInfo) {
      testStorageBucket();
    }
  }, [showDebugInfo]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Product Image</Label>
        {showDebugInfo && (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={testStorageBucket}
            >
              Test Storage
            </Button>
            {imagePreview && (
              <Badge variant="outline" className="text-xs">
                URL: {imagePreview.length > 30 ? '...' + imagePreview.slice(-30) : imagePreview}
              </Badge>
            )}
            {productId && (
              <Badge variant="secondary" className="text-xs">
                ID: {productId.slice(-8)}
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {imagePreview ? (
        <div className="relative">
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="h-full w-full object-cover"
                  onLoad={() => {
                    console.log('ProductImageUpload: Preview loaded successfully', {
                      url: imagePreview,
                      productId
                    });
                    if (showDebugInfo) {
                      toast.success('Preview image loaded');
                    }
                  }}
                  onError={(e) => {
                    console.error('ProductImageUpload: Preview load error:', {
                      src: e.currentTarget.src,
                      imagePreview,
                      productId
                    });
                    setImagePreview('');
                    onImageChange('');
                    toast.error('Failed to load image preview');
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
                {showDebugInfo && (
                  <Badge variant="default" className="absolute bottom-2 left-2 text-xs">
                    Preview OK
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="url">Image URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mb-4">
                PNG, JPG, GIF up to 5MB
              </p>
              {showDebugInfo && (
                <div className="mb-4 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  <p>Debug: Upload will go to 'product-images' bucket</p>
                  <p>Path format: timestamp-random.ext</p>
                  {productId && <p>Product ID: {productId.slice(-8)}</p>}
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log('ProductImageUpload: File selected:', {
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      productId
                    });
                    handleImageUpload(file);
                  }
                }}
                disabled={uploadingImage}
                className="hidden"
                id={`image-upload-${productId || 'default'}`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(`image-upload-${productId || 'default'}`)?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={tempUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={applyImageUrl}
                disabled={!tempUrl.trim()}
              >
                <Link className="h-4 w-4" />
              </Button>
            </div>
            {showDebugInfo && tempUrl && (
              <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                <p>URL validation: {tempUrl.startsWith('http') ? '✓ Valid' : '✗ Invalid'}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
