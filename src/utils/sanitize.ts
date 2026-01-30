/**
 * HTML Sanitization Utilities
 * 
 * Provides secure HTML sanitization to prevent XSS attacks.
 * Uses DOMPurify with restrictive configuration for safe HTML rendering.
 */

import DOMPurify from 'dompurify';

/**
 * Default allowed HTML tags for rich content
 */
const DEFAULT_ALLOWED_TAGS = [
  'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'
];

/**
 * Default allowed HTML attributes
 */
const DEFAULT_ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'id', 'title', 'alt'
];

/**
 * Sanitizes HTML content for safe rendering
 * Prevents XSS attacks by removing dangerous tags and attributes
 * 
 * @param dirty - Raw HTML string to sanitize
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export const sanitizeHTML = (
  dirty: string,
  options?: {
    allowedTags?: string[];
    allowedAttr?: string[];
    allowDataAttr?: boolean;
  }
): string => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: options?.allowedTags || DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: options?.allowedAttr || DEFAULT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: options?.allowDataAttr ?? false,
    // Security: Remove all scripts and event handlers
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    // Ensure links open safely
    ADD_ATTR: ['target'],
  });
};

/**
 * Sanitizes text content by removing ALL HTML tags
 * Use this for plain text contexts
 * 
 * @param dirty - Raw string that may contain HTML
 * @returns Plain text with all HTML removed
 */
export const sanitizeText = (dirty: string): string => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitizes HTML for rich text editor content
 * More permissive than default, but still safe
 * 
 * @param dirty - HTML content from rich text editor
 * @returns Sanitized HTML
 */
export const sanitizeRichText = (dirty: string): string => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      ...DEFAULT_ALLOWED_TAGS,
      'img', 'video', 'audio', 'source',
      'hr', 'sub', 'sup', 'mark', 'abbr',
      'figure', 'figcaption', 'caption'
    ],
    ALLOWED_ATTR: [
      ...DEFAULT_ALLOWED_ATTR,
      'src', 'width', 'height', 'controls', 'autoplay', 'muted', 'loop',
      'colspan', 'rowspan', 'style'
    ],
    // Allow safe CSS properties only
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
};

/**
 * Sanitizes URL to prevent javascript: and data: protocols
 * 
 * @param url - URL string to validate
 * @returns Sanitized URL or empty string if unsafe
 */
export const sanitizeURL = (url: string): string => {
  if (!url) return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '';
  }
  
  // Allow safe protocols
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  ) {
    return url;
  }
  
  // Default to https for protocol-relative URLs
  if (trimmed.startsWith('//')) {
    return `https:${url}`;
  }
  
  // For relative paths, return as-is
  return url;
};
