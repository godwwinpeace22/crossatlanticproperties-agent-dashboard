"use client";

import { cn } from "@/lib/utils";

/**
 * Reusable loading spinner that can be imported either
 * as a default export or a named export.
 *
 * Example:
 *   import { LoadingSpinner } from '@/components/loading-spinner'
 *   //  or
 *   import LoadingSpinner from '@/components/loading-spinner'
 */
interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps = {}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex items-center justify-center"
    >
      <div
        className={cn(
          "h-16 w-16 animate-spin rounded-full border-4 border-solid border-dnx-blue border-t-transparent",
          className
        )}
      />
      <span className="sr-only">{"Loading…"}</span>
    </div>
  );
}

export default LoadingSpinner;
