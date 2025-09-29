import React, { createContext, useContext, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModalState {
  id: string;
  content: React.ReactNode;
  options?: {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    hideCloseButton?: boolean;
  };
}

interface ModalContextType {
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  isOpen: boolean;
  currentModal: ModalState | null;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ProfessionalModalProvider({ children }: { children: React.ReactNode }) {
  const [currentModal, setCurrentModal] = useState<ModalState | null>(null);

  const openModal = useCallback((modal: ModalState) => {
    setCurrentModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setCurrentModal(null);
  }, []);

  const getSizeClasses = (size: ModalState['options']['size']) => {
    switch (size) {
      case 'sm': return 'max-w-md';
      case 'lg': return 'max-w-2xl';
      case 'xl': return 'max-w-4xl';
      default: return 'max-w-lg';
    }
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isOpen: !!currentModal, currentModal }}>
      {children}
      
      <Dialog open={!!currentModal} onOpenChange={closeModal}>
        <DialogOverlay className="backdrop-blur-sm bg-background/80" />
        <DialogContent 
          className={cn(
            'animate-scale-in border-0 shadow-2xl',
            getSizeClasses(currentModal?.options?.size),
            currentModal?.options?.className
          )}
        >
          {currentModal?.content}
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  );
}

export function useProfessionalModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useProfessionalModal must be used within a ProfessionalModalProvider');
  }
  return context;
}