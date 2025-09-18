import { Skeleton } from "@/components/ui/skeleton";

export function PropertyDetailSkeleton() {
  return (
    <div className="container-custom py-8">
      {/* Back button skeleton */}
      <Skeleton className="h-9 w-32 mb-6" />

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Gallery skeleton */}
            <div className="space-y-2">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <div className="flex gap-2 overflow-auto pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-20 w-20 flex-shrink-0 rounded-md"
                  />
                ))}
              </div>
            </div>

            {/* Title and badge skeleton */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex items-center">
                <Skeleton className="h-4 w-4 mr-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Property stats skeleton */}
            <div className="flex flex-wrap gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              ))}
            </div>

            {/* Description skeleton */}
            <div className="space-y-4">
              <div>
                <Skeleton className="h-6 w-24 mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>

              <Skeleton className="h-px w-full" />

              {/* Property details skeleton */}
              <div>
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Skeleton className="h-px w-full" />

            {/* Property features skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>

            <Skeleton className="h-px w-full" />

            {/* Floor plan skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="aspect-video w-full rounded-lg" />
            </div>

            <Skeleton className="h-px w-full" />

            {/* Map section skeleton */}
            <div className="space-y-4">
              <div>
                <Skeleton className="h-6 w-16 mb-2" />
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="aspect-video w-full rounded-lg" />
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-6">
          {/* Price card skeleton */}
          <div className="rounded-lg border p-6 bg-white">
            <div className="text-center mb-4">
              <Skeleton className="h-8 w-32 mx-auto mb-1" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
            <Skeleton className="h-11 w-full" />
          </div>

          {/* Quick actions skeleton */}
          <div className="rounded-lg border p-6 bg-white">
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Property highlights skeleton */}
          <div className="rounded-lg border p-6 bg-white">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Contact form skeleton */}
          <div className="rounded-lg border p-6 bg-white">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-12 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-12 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Location quick info skeleton */}
          <div className="rounded-lg border p-6 bg-white">
            <Skeleton className="h-5 w-16 mb-4" />
            <div className="space-y-2">
              <div className="flex items-center">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
