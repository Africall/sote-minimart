
import React, { useState } from 'react';
import { ImageIcon, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  showDebugInfo?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className = "w-10 h-10 object-cover rounded",
  fallbackClassName = "w-10 h-10 rounded bg-muted flex items-center justify-center",
  showDebugInfo = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const [debugInfo, setDebugInfo] = useState<{
    url: string;
    status: 'loading' | 'loaded' | 'error';
    errorMessage?: string;
  }>({
    url: src,
    status: 'loading'
  });

  // Check for malformed URLs
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Clean up malformed URLs (fix double product-images path)
  const cleanImageUrl = (url: string) => {
    if (!url) return '';
    
    // Fix double product-images path issue
    if (url.includes('product-images/product-images/')) {
      const cleanedUrl = url.replace('product-images/product-images/', 'product-images/');
      console.log('ProductImage: Fixed malformed URL:', { original: url, cleaned: cleanedUrl });
      return cleanedUrl;
    }
    
    return url;
  };

  const cleanedSrc = cleanImageUrl(src);

  const handleImageLoad = () => {
    console.log('ProductImage: Image loaded successfully:', cleanedSrc);
    setLoading(false);
    setImageError(false);
    setDebugInfo(prev => ({ ...prev, status: 'loaded' }));
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = event.currentTarget;
    const errorMessage = `Failed to load image: ${imgElement.src}`;
    
    console.error('ProductImage: Image load error:', {
      originalSrc: src,
      cleanedSrc: cleanedSrc,
      finalSrc: imgElement.src,
      isValidUrl: isValidUrl(cleanedSrc),
      error: errorMessage
    });
    
    setLoading(false);
    setImageError(true);
    setDebugInfo(prev => ({ 
      ...prev, 
      status: 'error', 
      errorMessage 
    }));
  };

  const handleRetry = () => {
    console.log('ProductImage: Retrying image load for:', cleanedSrc);
    setImageError(false);
    setLoading(true);
    setRetryKey(prev => prev + 1);
    setDebugInfo(prev => ({ ...prev, status: 'loading', errorMessage: undefined }));
  };

  // Test if the URL is accessible
  const testImageUrl = async () => {
    if (!cleanedSrc) return;
    
    try {
      const response = await fetch(cleanedSrc, { method: 'HEAD' });
      console.log('ProductImage: URL test result:', {
        url: cleanedSrc,
        status: response.status,
        statusText: response.statusText,
        accessible: response.ok
      });
    } catch (error) {
      console.error('ProductImage: URL test failed:', {
        url: cleanedSrc,
        error: error
      });
    }
  };

  // Test URL on mount if debug info is enabled
  React.useEffect(() => {
    if (showDebugInfo && cleanedSrc) {
      testImageUrl();
    }
  }, [cleanedSrc, showDebugInfo]);

  if (!cleanedSrc || !isValidUrl(cleanedSrc)) {
    console.warn('ProductImage: Invalid or empty image URL:', { original: src, cleaned: cleanedSrc });
    return (
      <div className={`${fallbackClassName} group relative`}>
        <ImageIcon className="w-4 h-4 text-muted-foreground" />
        {showDebugInfo && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs">
            Invalid URL
          </Badge>
        )}
      </div>
    );
  }

  if (imageError) {
    return (
      <div className={`${fallbackClassName} group relative`}>
        <AlertCircle className="w-4 h-4 text-destructive" />
        <Button
          variant="ghost"
          size="sm"
          className="absolute inset-0 opacity-0 group-hover:opacity-100 w-full h-full p-0"
          onClick={handleRetry}
          title={showDebugInfo ? debugInfo.errorMessage : "Retry loading image"}
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
        {showDebugInfo && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs">
            Error
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className={fallbackClassName}>
          <div className="animate-pulse bg-muted-foreground/20 w-full h-full rounded" />
          {showDebugInfo && (
            <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
              Loading
            </Badge>
          )}
        </div>
      )}
      <img
        key={retryKey}
        src={cleanedSrc}
        alt={alt}
        className={`${className} ${loading ? 'absolute opacity-0' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      {showDebugInfo && !loading && !imageError && (
        <Badge variant="default" className="absolute -top-2 -right-2 text-xs">
          OK
        </Badge>
      )}
    </div>
  );
};
