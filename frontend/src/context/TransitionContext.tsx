import React, { createContext, useContext, ReactNode, useState } from 'react';

interface TransitionContextType {
  triggerTransition: (callback: () => void) => Promise<void>;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const usePageTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within a TransitionProvider');
  }
  return context;
};

export const TransitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTransitioning] = useState(false);

  // Instantaneous zero-delay execution for flash-fast responsiveness
  const triggerTransition = async (callback: () => void) => {
    callback();
  };

  return (
    <TransitionContext.Provider value={{ triggerTransition, isTransitioning }}>
      {children}
    </TransitionContext.Provider>
  );
};

