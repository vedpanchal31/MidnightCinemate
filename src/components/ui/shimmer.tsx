import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className, children, ...props }: ShimmerProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-800",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ShimmerText({ className, lines = 1, ...props }: ShimmerProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function ShimmerCard({ className, ...props }: ShimmerProps) {
  return (
    <div className={cn("rounded-xl overflow-hidden bg-white/5 border border-white/10", className)} {...props}>
      <Shimmer className="aspect-2/3 w-full" />
      <div className="p-4 space-y-2">
        <ShimmerText lines={2} />
      </div>
    </div>
  );
}

export function ShimmerAvatar({ className, ...props }: ShimmerProps) {
  return (
    <Shimmer className={cn("h-10 w-10 rounded-full", className)} {...props} />
  );
}

export function ShimmerButton({ className, ...props }: ShimmerProps) {
  return (
    <Shimmer className={cn("h-10 w-24 rounded-lg", className)} {...props} />
  );
}
