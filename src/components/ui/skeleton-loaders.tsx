import { Skeleton } from "@/components/ui/skeleton";

export const WorkoutCardSkeleton = () => (
  <div className="bg-card rounded-xl p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-16" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-36" />
    </div>
    <Skeleton className="h-10 w-full" />
  </div>
);

export const ProgramCardSkeleton = () => (
  <div className="bg-card rounded-xl p-4 space-y-4">
    <div className="flex items-start gap-4">
      <Skeleton className="h-16 w-16 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-2 w-full rounded-full" />
    <div className="flex gap-2">
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 w-9" />
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-card rounded-xl p-4 space-y-2">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-3 w-24" />
  </div>
);

export const CalendarDaySkeleton = () => (
  <div className="aspect-square p-1">
    <Skeleton className="h-full w-full rounded-lg" />
  </div>
);

export const CalendarGridSkeleton = () => (
  <div className="grid grid-cols-7 gap-1">
    {Array.from({ length: 35 }).map((_, i) => (
      <CalendarDaySkeleton key={i} />
    ))}
  </div>
);

export const ProgressChartSkeleton = () => (
  <div className="bg-card rounded-xl p-4 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-24" />
    </div>
    <Skeleton className="h-48 w-full" />
  </div>
);

export const ProfileHeaderSkeleton = () => (
  <div className="flex items-center gap-4">
    <Skeleton className="h-20 w-20 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>
  </div>
);

export const QuickStatsSkeleton = () => (
  <div className="grid grid-cols-3 gap-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
    <WorkoutCardSkeleton />
    <div className="grid grid-cols-2 gap-3">
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    <QuickStatsSkeleton />
  </div>
);
