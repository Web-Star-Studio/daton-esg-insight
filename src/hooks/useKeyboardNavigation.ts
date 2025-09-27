import { useState, useCallback, useRef, useEffect } from 'react';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onTab?: (event: KeyboardEvent) => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  trapFocus?: boolean;
  disabled?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    onEscape,
    onEnter,
    onTab,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    trapFocus = false,
    disabled = false
  } = options;

  const containerRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      
      case 'Enter':
        if (event.target instanceof HTMLButtonElement || 
            (event.target instanceof HTMLElement && event.target.role === 'button')) {
          event.preventDefault();
          onEnter?.();
        }
        break;
      
      case 'Tab':
        if (trapFocus && containerRef.current) {
          const focusableElements = containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
        onTab?.(event);
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.();
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.();
        break;
      
      case 'ArrowLeft':
        event.preventDefault();
        onArrowLeft?.();
        break;
      
      case 'ArrowRight':
        event.preventDefault();
        onArrowRight?.();
        break;
    }
  }, [disabled, onEscape, onEnter, onTab, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, trapFocus]);

  useEffect(() => {
    if (disabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, disabled]);

  // Focus trap para modais e dialogs
  const focusFirstElement = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElement = containerRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;

    if (focusableElement) {
      focusableElement.focus();
    }
  }, []);

  return {
    containerRef,
    focusFirstElement
  };
}

// Hook para navegação em listas
export function useListNavigation<T>(
  items: T[],
  keyExtractor: (item: T) => string | number
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleArrowUp = useCallback(() => {
    setSelectedIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleArrowDown = useCallback(() => {
    setSelectedIndex(prev => Math.min(items.length - 1, prev + 1));
  }, [items.length]);

  const handleHome = useCallback(() => {
    setSelectedIndex(0);
  }, []);

  const handleEnd = useCallback(() => {
    setSelectedIndex(items.length - 1);
  }, [items.length]);

  const { containerRef } = useKeyboardNavigation({
    onArrowUp: handleArrowUp,
    onArrowDown: handleArrowDown
  });

  // Scroll para o item selecionado
  useEffect(() => {
    if (!containerRef.current) return;

    const selectedElement = containerRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement;

    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  const getItemProps = useCallback((index: number) => ({
    'data-index': index,
    'aria-selected': index === selectedIndex,
    tabIndex: index === selectedIndex ? 0 : -1,
    role: 'option'
  }), [selectedIndex]);

  return {
    selectedIndex,
    selectedItem: items[selectedIndex],
    setSelectedIndex,
    getItemProps,
    containerRef,
    handleHome,
    handleEnd
  };
}