import React, { createContext, useContext } from 'react';

const OnboardingGateContext = createContext<(() => void) | null>(null);

export function OnboardingGateProvider({
  children,
  onMarkComplete,
}: {
  children: React.ReactNode;
  onMarkComplete: () => void;
}) {
  return (
    <OnboardingGateContext.Provider value={onMarkComplete}>
      {children}
    </OnboardingGateContext.Provider>
  );
}

export function useMarkOnboardingComplete(): () => void {
  const fn = useContext(OnboardingGateContext);
  if (!fn) {
    throw new Error('useMarkOnboardingComplete must be used within OnboardingGateProvider');
  }
  return fn;
}
