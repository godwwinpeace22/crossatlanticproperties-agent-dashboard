"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global SWR configuration for better performance
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        revalidateIfStale: true,
        revalidateOnMount: true,
        dedupingInterval: 60000, // 1 minute
        focusThrottleInterval: 5000,
        loadingTimeout: 3000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        // Cache for 5 minutes by default
        refreshInterval: 0,
        onError: (error) => {
          console.error("SWR Error:", error);
        },
        onLoadingSlow: (key) => {
          console.warn("SWR Loading slow for:", key);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
