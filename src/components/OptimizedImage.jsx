/**
 * OptimizedImage Component
 * Handles:
 * - Cross-origin requests with proper headers
 * - Tracking Prevention issues in Firefox/Safari
 * - Image loading errors with fallback
 * - Lazy loading for performance
 */

import { PLACEHOLDER_IMAGE } from "../constants";

export default function OptimizedImage({
  src,
  alt = "Product Image",
  className = "object-contain",
  fallbackSrc = PLACEHOLDER_IMAGE,
  onLoad,
  onError: customOnError,
  ...props
}) {
  const handleError = (e) => {
    // Try alternative fallback URLs
    if (e.target.src !== fallbackSrc) {
      e.target.src = fallbackSrc;
    }

    if (customOnError) {
      customOnError(e);
    }
  };

  // Handle invalid or missing src
  const imageSrc = src && src.trim() ? src : fallbackSrc;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={handleError}
      onLoad={onLoad}
      {...props}
    />
  );
}

