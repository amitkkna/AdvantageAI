'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import type { Step, CallBackProps, Props as JoyrideProps } from 'react-joyride';
import { useAuthStore } from '@/stores/auth-store';

const Joyride = lazy(() => import('react-joyride').then(mod => ({ default: mod.default as React.ComponentType<JoyrideProps> })));

const TOUR_KEY = 'advantage-tour-completed';

const steps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome to AdVantage!',
    content: 'Let us show you around the dashboard. This quick tour will help you get started with managing your outdoor advertising assets.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation Sidebar',
    content: 'Use the sidebar to navigate between different sections — Assets, Campaigns, Bookings, and more.',
    placement: 'right',
  },
  {
    target: '[data-tour="search"]',
    title: 'Quick Search (Ctrl+K)',
    content: 'Press Ctrl+K anytime to search across assets, campaigns, and clients, or quickly navigate to any page.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="theme-toggle"]',
    title: 'Dark Mode',
    content: 'Toggle between light and dark mode for comfortable viewing.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-menu"]',
    title: 'Your Profile',
    content: 'Access your profile settings and log out from here.',
    placement: 'bottom-end',
  },
];

export function OnboardingTour() {
  const [run, setRun] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    const completed = localStorage.getItem(`${TOUR_KEY}-${user.id}`);
    if (!completed) {
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === 'finished' || status === 'skipped') {
      setRun(false);
      if (user) localStorage.setItem(`${TOUR_KEY}-${user.id}`, 'true');
    }
  };

  if (!user) return null;

  return (
    <Suspense fallback={null}>
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: 'hsl(222.2, 47.4%, 11.2%)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '8px',
          fontSize: '14px',
        },
        buttonNext: {
          borderRadius: '6px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(215.4, 16.3%, 46.9%)',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Got it!',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
    </Suspense>
  );
}
