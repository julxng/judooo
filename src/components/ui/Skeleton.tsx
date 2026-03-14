import { cn } from '@/lib/utils';

type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  rounded?: boolean;
};

export const Skeleton = ({ className, width, height, circle, rounded }: SkeletonProps) => (
  <div
    className={cn('skeleton', circle && 'skeleton--circle', rounded && 'skeleton--rounded', className)}
    style={{ width, height }}
    aria-hidden="true"
  />
);

export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height={12}
        width={i === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonEventCard = ({ className }: { className?: string }) => (
  <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)} aria-hidden="true">
    <Skeleton height={200} className="w-full rounded-none" />
    <div className="flex flex-col gap-3 p-4">
      <div className="flex justify-between">
        <Skeleton width={80} height={10} />
        <Skeleton width={100} height={10} />
      </div>
      <Skeleton width="85%" height={20} rounded />
      <Skeleton width="50%" height={12} />
      <SkeletonText lines={2} />
    </div>
  </div>
);

export const SkeletonArtworkCard = ({ className }: { className?: string }) => (
  <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)} aria-hidden="true">
    <Skeleton height={260} className="w-full rounded-none" />
    <div className="flex flex-col gap-3 p-4">
      <Skeleton width="70%" height={18} rounded />
      <Skeleton width="45%" height={12} />
      <div className="flex justify-between items-center mt-1">
        <Skeleton width={90} height={14} />
        <Skeleton width={60} height={10} />
      </div>
    </div>
  </div>
);
