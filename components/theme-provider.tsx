"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

interface ThemeProviderComponentProps extends ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderComponentProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
