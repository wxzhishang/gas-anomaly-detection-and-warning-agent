import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
    />
  );
}

export function DeviceListSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="divide-y divide-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-3 w-40 mb-2" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <Skeleton className="h-5 w-48 mb-4 mx-auto" />
      <Skeleton className="h-[400px] sm:h-[500px] w-full" />
    </div>
  );
}

export function AlertListSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="divide-y divide-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-16 w-full mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
