'use client';
import React, { useEffect, useLayoutEffect } from 'react';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';
import { Uniwind } from 'uniwind';
import { script } from './script';

export type ModeType = 'light' | 'dark' | 'system';

const useSafeLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function GluestackUIProvider({
  mode = 'dark',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
}) {
  const handleMediaQuery = React.useCallback(
    (e: MediaQueryListEvent) => {
      const resolvedMode = e.matches ? 'dark' : 'light';
      script(resolvedMode);
      Uniwind.setTheme(resolvedMode);
    },
    []
  );

  useSafeLayoutEffect(() => {
    if (mode === 'system') return;
    script(mode);
    Uniwind.setTheme(mode);
  }, [mode]);

  useSafeLayoutEffect(() => {
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    // Chottu: apply the OS scheme now too, not only when it next changes.
    const initial = media.matches ? 'dark' : 'light';
    script(initial);
    Uniwind.setTheme(initial);
    media.addListener(handleMediaQuery);
    return () => media.removeListener(handleMediaQuery);
  }, [handleMediaQuery, mode]);

  return (
    // Chottu: no inline <script>; the web build is a client-rendered SPA, where
    // React never runs it and warns. The layout effects above set the theme.
    <OverlayProvider>
      <ToastProvider>{props.children}</ToastProvider>
    </OverlayProvider>
  );
}
