import React, { useEffect, useState } from 'react';
import { TourIntensity } from '@/types/tour';

interface TourOverlayProps {
  targetElement: HTMLElement | null;
  allowInteraction?: boolean;
  onClickOutside?: () => void;
  intensity?: TourIntensity;
}

export function TourOverlay({ 
  targetElement, 
  allowInteraction = false, 
  onClickOutside,
  intensity = 'medium' 
}: TourOverlayProps) {
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!targetElement) {
      setSpotlightStyle({});
      return;
    }

    const updateSpotlight = () => {
      const rect = targetElement.getBoundingClientRect();
      const padding = 8;

      setSpotlightStyle({
        position: 'fixed',
        top: `${rect.top - padding}px`,
        left: `${rect.left - padding}px`,
        width: `${rect.width + padding * 2}px`,
        height: `${rect.height + padding * 2}px`,
        borderRadius: '8px',
        pointerEvents: allowInteraction ? 'none' : 'auto',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 45,
      });
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);

    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [targetElement, allowInteraction]);

  const intensityOpacity = {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
  }[intensity];

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClickOutside) {
      onClickOutside();
    }
  };

  return (
    <>
      {/* Overlay escuro */}
      <div 
        className="fixed inset-0 bg-black transition-opacity duration-300"
        style={{ 
          opacity: intensityOpacity,
          zIndex: 40,
          pointerEvents: allowInteraction ? 'none' : 'auto',
        }}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      
      {/* Spotlight ao redor do elemento */}
      {targetElement && (
        <div 
          style={{
            ...spotlightStyle,
            boxShadow: `0 0 0 4px hsl(var(--primary) / 0.6), 0 0 0 2000px rgba(0, 0, 0, ${intensityOpacity})`,
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
