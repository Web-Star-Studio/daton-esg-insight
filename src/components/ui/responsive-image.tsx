import * as React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveImageSrcSet {
  mobile?: string;   // 320-480px
  tablet?: string;   // 768-1024px
  desktop?: string;  // 1366px+
}

interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'srcSet'> {
  src: string;
  alt: string;
  responsiveSrcSet?: ResponsiveImageSrcSet;
  sizes?: string;
  aspectRatio?: string;
  fallback?: string;
}

export function ResponsiveImage({
  src,
  alt,
  responsiveSrcSet,
  sizes = "(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className,
  loading = "lazy",
  aspectRatio,
  fallback,
  ...props
}: ResponsiveImageProps) {
  const [hasError, setHasError] = React.useState(false);
  
  // Build srcSet string
  const srcSetString = responsiveSrcSet ? 
    `${responsiveSrcSet.mobile || src} 480w, ${responsiveSrcSet.tablet || src} 1024w, ${responsiveSrcSet.desktop || src} 1920w` 
    : undefined;

  const handleError = () => {
    if (fallback && !hasError) {
      setHasError(true);
    }
  };

  return (
    <img
      src={hasError && fallback ? fallback : src}
      srcSet={hasError ? undefined : srcSetString}
      sizes={hasError ? undefined : sizes}
      alt={alt}
      loading={loading}
      onError={handleError}
      className={cn("object-cover", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
      {...props}
    />
  );
}
